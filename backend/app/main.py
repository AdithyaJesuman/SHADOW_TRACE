from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from contextlib import asynccontextmanager
import uuid,asyncpg,os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


from app.database import get_db
from app import model
from app import api_schemas as api
from src.adapters import ps
from src.adapters.base import close_pool
from ml.kafka_Producer import send_transactions,trigger_callback,shutdown_producer
from fastapi import BackgroundTasks

@asynccontextmanager
async def lifespan(app: FastAPI):
    await ps.create_all_tables()
    yield
    shutdown_producer()
    await close_pool()

app = FastAPI(title="Shadow Trace", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(asyncpg.ForeignKeyViolationError)
async def fk_violation_handler(request, exc):
    return JSONResponse(status_code=400, content={"error": "foreign_key_violation", "detail": "a referenced parent doesn't exist yet"})

@app.exception_handler(asyncpg.UniqueViolationError)
async def unique_violation_handler(request, exc):
    return JSONResponse(status_code=409, content={"error": "unique_violation", "detail": str(exc)})

def _row_to_dict(obj, relations: tuple = ()) -> dict | None:
    if obj is None:
        return None
    data = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    for rel in relations:
        value = getattr(obj, rel, None)
        if isinstance(value, list):
            data[rel] = [_row_to_dict(v) for v in value]
        else:
            data[rel] = _row_to_dict(value)
    return data

#########################################################
########## GET ##########################################
#########################################################

@app.get("/transactions")
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
    is_flagged: bool = None,
):
    stmt = select(model.TransactionDB)
    if is_flagged is not None:
        stmt = stmt.where(model.TransactionDB.is_flagged == is_flagged)
    stmt = stmt.order_by(model.TransactionDB.timestamp.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]


@app.get("/transactions/{tx_id}")
async def read_transaction(tx_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(model.TransactionDB)
        .where(model.TransactionDB.tx_id == tx_id)
        .options(
            selectinload(model.TransactionDB.customer),
            selectinload(model.TransactionDB.merchant),
            selectinload(model.TransactionDB.card),
            selectinload(model.TransactionDB.device),
            selectinload(model.TransactionDB.ip),
            selectinload(model.TransactionDB.features),
            selectinload(model.TransactionDB.identity),
        )
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "transaction not found")
    return _row_to_dict(row, relations=("customer", "merchant", "card", "device", "ip", "features", "identity"))


@app.get("/customers/{external_id}")
async def read_customer(external_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(model.CustomerDB)
        .where(model.CustomerDB.external_id == external_id)
        .options(
            selectinload(model.CustomerDB.transactions),
            selectinload(model.CustomerDB.login_events),
            selectinload(model.CustomerDB.predictions),
            selectinload(model.CustomerDB.identities),
        )
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "customer not found")
    return _row_to_dict(row, relations=("transactions", "login_events", "predictions", "identities"))


@app.get("/customers/{external_id}/predictions")
async def read_customer_predictions(external_id: str, db: AsyncSession = Depends(get_db)):
    cust = (await db.execute(
        select(model.CustomerDB).where(model.CustomerDB.external_id == external_id)
    )).scalar_one_or_none()
    if cust is None:
        raise HTTPException(404, "customer not found")
    stmt = (
        select(model.PredictionDB)
        .where(model.PredictionDB.customer_id == cust.customer_id)
        .order_by(model.PredictionDB.scored_at.desc())
        .limit(50)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]


@app.get("/flagged")
async def list_flagged(
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    stmt = (
        select(model.TransactionDB)
        .where(model.TransactionDB.is_flagged == True)
        .order_by(model.TransactionDB.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]


@app.get("/health")
async def health():
    return {"status": "ok"}

####################################################
######## post ######################################
####################################################

@app.post("/predictions", status_code=201)
async def create_prediction(body: api.PredictionCreate):
    customer_id = await ps.insert_customer(external_id=body.customer_external_id)
    prediction_id = await ps.insert_prediction(
        customer_id=customer_id,
        fraud_score=body.fraud_score,
        risk_level=body.risk_level,
        top_features=body.top_features,
        model_version=body.model_version,
    )
    return {"prediction_id": prediction_id}

@app.post("/customers", status_code=201)
async def create_customer(body: api.CustomerCreate):
    customer_id = await ps.insert_customer(
        external_id=body.external_id,
        risk_score=body.risk_score,
    )
    return {"customer_id": customer_id}
 
@app.post("/merchants", status_code=201)
async def create_merchant(body: api.MerchantCreate):
    merchant_id = await ps.insert_merchant(
        external_id=body.external_id,
        category=body.category,
        country=body.country,
    )
    return {"merchant_id": merchant_id}


@app.post("/cards", status_code=201)
async def create_card(body: api.CardCreate):
    card_id = await ps.insert_card(
        card_fingerprint=body.card_fingerprint,
        card_network=body.card_network,
        card_category=body.card_category,
    )
    return {"card_id": card_id}


@app.post("/devices", status_code=201)
async def create_device(body: api.DeviceCreate):
    device_id = await ps.insert_device(
        device_info=body.device_info,
        device_type=body.device_type,
        os=body.os,
        browser=body.browser,
        screen_res=body.screen_res,
    )
    return {"device_id": device_id}


@app.post("/ips", status_code=201)
async def create_ip(body: api.IPCreate):
    ip_id = await ps.insert_ip(
        ip_address=body.ip_address,
        country=body.country,
        city=body.city,
        vpn_flag=body.vpn_flag,
        tor_flag=body.tor_flag,
    )
    return {"ip_id": ip_id}

##########################################
####### kafka producer ###################
##########################################

@app.post("/transactions", status_code=202)
async def create_transaction(body: api.TransactionCreate,bg_tasks:BackgroundTasks):
    tx_data=body.model_dump()
    send_transactions(
        topic="transactions_raw",
        key=body.customer_id,
        value=tx_data
    )
    bg_tasks.add_task(trigger_callback)
    return {
        "status": "Accepted", 
        "message": "Transaction sent to intelligence engine for scoring."
    }

@app.post("/login-events", status_code=202)
async def create_login_event(body: api.LoginEventCreate,bg_tasks:BackgroundTasks):
    tx_data=body.model_dump()
    send_transactions(
        topic="login_events_raw",
        key=body.customer_external_id,
        value=tx_data
    )
    bg_tasks.add_task(trigger_callback)
    return {
        "status": "Accepted", 
        "message": "Login-Events sent to intelligence engine for scoring."
    }




#########################################
#########################################

dist_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
