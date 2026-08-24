"""
main.py — reads via SQLAlchemy (models.py), writes via ps.py.

Two separate connections to the same Postgres DB, on purpose:
  - WRITES go through ps.py (asyncpg) — that's where the get-or-create /
    upsert / idempotency logic lives, not duplicating it here.
  - READS go through SQLAlchemy (models.py) — every detail route below
    eager-loads its relationships (selectinload) so you get the full
    related graph back in one response, not just bare FK UUIDs. That's
    the "giant read": GET /transactions/{tx_id} comes back with its
    customer, merchant, card, device, ip, features and identity nested
    inline, not five follow-up requests.

ASSUMPTION: `database.py` exports an async session dependency called
`get_db` (matches the `from database import Base` pattern your
ShipmentDB example used). Rename the import below if yours is different.

List routes stay flat (no relationships loaded) — pagination only,
so listing 10k customers doesn't try to eager-load 10k transaction
lists in the same call. Nesting only happens on the single-row routes.
"""

import uuid
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

import models
from database import get_db          # <- adjust if your session dependency is named differently

from src.adapters import ps           # <- adjust to your layout if different
import api_schemas as api


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ps.create_all_tables()      # ps.py still owns the actual DDL
    yield

app = FastAPI(title="Fraud Graph API", lifespan=lifespan)


@app.exception_handler(asyncpg.ForeignKeyViolationError)
async def fk_violation_handler(request, exc):
    return JSONResponse(400, {"error": "foreign_key_violation",
                               "detail": "a referenced parent row doesn't exist yet"})

@app.exception_handler(asyncpg.UniqueViolationError)
async def unique_violation_handler(request, exc):
    return JSONResponse(409, {"error": "unique_violation", "detail": str(exc)})


# ---- generic ORM -> dict, expands only the relationships you ask for -------

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


# =============================================================================
# READS — flat list + nested "giant" detail, per table
# =============================================================================

# ---- customers ----------------------------------------------------------------

@app.get("/customers")
async def list_customers(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.CustomerDB).order_by(models.CustomerDB.created_at.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/customers/{external_id}")
async def read_customer(external_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.CustomerDB)
        .where(models.CustomerDB.external_id == external_id)
        .options(
            selectinload(models.CustomerDB.transactions),
            selectinload(models.CustomerDB.login_events),
            selectinload(models.CustomerDB.predictions),
            selectinload(models.CustomerDB.identities),
        )
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "customer not found")
    return _row_to_dict(row, relations=("transactions", "login_events", "predictions", "identities"))


# ---- merchants ------------------------------------------------------------------

@app.get("/merchants")
async def list_merchants(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.MerchantDB).order_by(models.MerchantDB.created_at.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/merchants/{external_id}")
async def read_merchant(external_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.MerchantDB)
        .where(models.MerchantDB.external_id == external_id)
        .options(selectinload(models.MerchantDB.transactions))
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "merchant not found")
    return _row_to_dict(row, relations=("transactions",))


# ---- cards ----------------------------------------------------------------------

@app.get("/cards")
async def list_cards(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.CardDB).order_by(models.CardDB.created_at.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/cards/{card_fingerprint}")
async def read_card(card_fingerprint: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.CardDB)
        .where(models.CardDB.card_fingerprint == card_fingerprint)
        .options(selectinload(models.CardDB.transactions))
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "card not found")
    return _row_to_dict(row, relations=("transactions",))


# ---- devices ---------------------------------------------------------------------

@app.get("/devices")
async def list_devices(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.DeviceDB).order_by(models.DeviceDB.created_at.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/devices/{device_info}")
async def read_device(device_info: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.DeviceDB)
        .where(models.DeviceDB.device_info == device_info)
        .options(selectinload(models.DeviceDB.transactions), selectinload(models.DeviceDB.login_events))
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "device not found")
    return _row_to_dict(row, relations=("transactions", "login_events"))


# ---- ips -------------------------------------------------------------------------

@app.get("/ips")
async def list_ips(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.IPDB).order_by(models.IPDB.created_at.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/ips/{ip_address}")
async def read_ip(ip_address: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.IPDB)
        .where(models.IPDB.ip_address == ip_address)
        .options(selectinload(models.IPDB.transactions), selectinload(models.IPDB.login_events))
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "ip not found")
    return _row_to_dict(row, relations=("transactions", "login_events"))


# ---- transactions — the actual giant read ----------------------------------------

@app.get("/transactions")
async def list_transactions(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.TransactionDB).order_by(models.TransactionDB.timestamp.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/transactions/{tx_id}")
async def read_transaction(tx_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.TransactionDB)
        .where(models.TransactionDB.tx_id == tx_id)
        .options(
            selectinload(models.TransactionDB.customer),
            selectinload(models.TransactionDB.merchant),
            selectinload(models.TransactionDB.card),
            selectinload(models.TransactionDB.device),
            selectinload(models.TransactionDB.ip),
            selectinload(models.TransactionDB.features),
            selectinload(models.TransactionDB.identity),
        )
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "transaction not found")
    return _row_to_dict(row, relations=("customer", "merchant", "card", "device", "ip", "features", "identity"))

@app.get("/customers/{external_id}/transactions")
async def read_customer_transactions(external_id: str, db: AsyncSession = Depends(get_db), limit: int = 100):
    stmt = (
        select(models.TransactionDB)
        .join(models.CustomerDB)
        .where(models.CustomerDB.external_id == external_id)
        .order_by(models.TransactionDB.timestamp.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]


# ---- transaction_features ---------------------------------------------------------

@app.get("/transaction-features/{transaction_id}")
async def read_transaction_features(transaction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.TransactionFeaturesDB)
        .where(models.TransactionFeaturesDB.transaction_id == transaction_id)
        .options(selectinload(models.TransactionFeaturesDB.transaction))
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "no features recorded for this transaction")
    return _row_to_dict(row, relations=("transaction",))


# ---- customer_identity ---------------------------------------------------------------

@app.get("/customer-identity/{transaction_id}")
async def read_transaction_identity(transaction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.CustomerIdentityDB)
        .where(models.CustomerIdentityDB.transaction_id == transaction_id)
        .options(selectinload(models.CustomerIdentityDB.transaction), selectinload(models.CustomerIdentityDB.customer))
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "no identity record for this transaction")
    return _row_to_dict(row, relations=("transaction", "customer"))


# ---- login_events ----------------------------------------------------------------------

@app.get("/login-events")
async def list_login_events(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.LoginEventDB).order_by(models.LoginEventDB.timestamp.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/login-events/{event_id}")
async def read_login_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.LoginEventDB)
        .where(models.LoginEventDB.event_id == event_id)
        .options(
            selectinload(models.LoginEventDB.customer),
            selectinload(models.LoginEventDB.ip),
            selectinload(models.LoginEventDB.device),
        )
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "login event not found")
    return _row_to_dict(row, relations=("customer", "ip", "device"))

@app.get("/customers/{external_id}/login-events")
async def read_customer_login_events(external_id: str, db: AsyncSession = Depends(get_db), limit: int = 100):
    stmt = (
        select(models.LoginEventDB)
        .join(models.CustomerDB)
        .where(models.CustomerDB.external_id == external_id)
        .order_by(models.LoginEventDB.timestamp.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]


# ---- predictions ------------------------------------------------------------------------

@app.get("/predictions")
async def list_predictions(db: AsyncSession = Depends(get_db), limit: int = 100, offset: int = 0):
    stmt = select(models.PredictionDB).order_by(models.PredictionDB.scored_at.desc()).limit(limit).offset(offset)
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/predictions/high-score")
async def list_high_score_predictions(db: AsyncSession = Depends(get_db), threshold: float = 0.85, limit: int = 1000):
    stmt = (
        select(models.PredictionDB)
        .where(models.PredictionDB.fraud_score >= threshold)
        .order_by(models.PredictionDB.fraud_score.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]

@app.get("/predictions/{prediction_id}")
async def read_prediction(prediction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(models.PredictionDB)
        .where(models.PredictionDB.prediction_id == prediction_id)
        .options(selectinload(models.PredictionDB.customer))
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "prediction not found")
    return _row_to_dict(row, relations=("customer",))

@app.get("/customers/{external_id}/predictions")
async def read_customer_predictions(external_id: str, db: AsyncSession = Depends(get_db), limit: int = 100):
    stmt = (
        select(models.PredictionDB)
        .join(models.CustomerDB)
        .where(models.CustomerDB.external_id == external_id)
        .order_by(models.PredictionDB.scored_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return [_row_to_dict(r) for r in rows]


# ---- cross-table aggregates (kept on ps.py — real SQL aggregation, not a plain read) ----

@app.get("/fraud-customers")
async def list_fraud_customers():
    return await ps.get_fraud_customers()

@app.get("/customers/{external_id}/stats")
async def read_customer_stats(external_id: str):
    customer = await ps.get_customer_by_external_id(external_id)
    if customer is None:
        raise HTTPException(404, "customer not found")
    return await ps.get_customer_stats(str(customer["customer_id"]))

@app.get("/customers/{external_id}/velocity")
async def read_customer_velocity(external_id: str, hours: int = 24):
    customer = await ps.get_customer_by_external_id(external_id)
    if customer is None:
        raise HTTPException(404, "customer not found")
    count = await ps.get_customer_velocity(str(customer["customer_id"]), hours)
    return {"customer_id": str(customer["customer_id"]), "hours": hours, "tx_count": count}


# =============================================================================
# WRITES — unchanged, still ps.py (get-or-create + idempotency lives there)
# =============================================================================

@app.post("/customers")
async def create_customer(body: api.CustomerCreate):
    customer_id = await ps.insert_customer(body.external_id, risk_score=body.risk_score)
    return {"customer_id": customer_id}

@app.post("/merchants")
async def create_merchant(body: api.MerchantCreate):
    merchant_id = await ps.insert_merchant(body.external_id, body.category, body.country)
    return {"merchant_id": merchant_id}

@app.post("/cards")
async def create_card(body: api.CardCreate):
    card_id = await ps.insert_card(body.card_fingerprint, body.card_network, body.card_category)
    return {"card_id": card_id}

@app.post("/devices")
async def create_device(body: api.DeviceCreate):
    device_id = await ps.insert_device(
        body.device_info, body.device_type, body.os, body.browser, body.screen_res,
    )
    return {"device_id": device_id}

@app.post("/ips")
async def create_ip(body: api.IPCreate):
    ip_id = await ps.insert_ip(body.ip_address, body.country, body.city, body.vpn_flag, body.tor_flag)
    return {"ip_id": ip_id}


@app.post("/transactions")
async def create_transaction(body: api.TransactionCreate):
    customer_id = await ps.insert_customer(body.customer_external_id)

    merchant_id = await ps.insert_merchant(body.merchant_external_id) \
        if body.merchant_external_id else None

    card_id = await ps.insert_card(body.card_fingerprint, body.card_network, body.card_category) \
        if body.card_fingerprint else None

    device_id = await ps.insert_device(
        body.device_info, body.device_type, body.os, body.browser, body.screen_res,
    ) if body.device_info else None

    ip_id = await ps.insert_ip(
        body.ip_address, body.ip_country, body.ip_city, body.vpn_flag, body.tor_flag,
    ) if body.ip_address else None

    idempotency_key = body.idempotency_key or ps.compute_idempotency_key(
        "api", body.customer_external_id, body.amount, body.tx_type, body.timestamp,
    )

    tx_id, is_new = await ps.insert_transaction(
        customer_id=customer_id, amount=body.amount, tx_type=body.tx_type,
        idempotency_key=idempotency_key,
        merchant_id=merchant_id, card_id=card_id, device_id=device_id, ip_id=ip_id,
        product_code=body.product_code,
        balance_before=body.balance_before, balance_after=body.balance_after,
        is_fraud=body.is_fraud, is_flagged=body.is_flagged,
        timestamp=body.timestamp,
    )
    return {
        "tx_id": tx_id, "is_new": is_new, "customer_id": customer_id,
        "merchant_id": merchant_id, "card_id": card_id,
        "device_id": device_id, "ip_id": ip_id,
    }


@app.post("/login-events")
async def create_login_event(body: api.LoginEventCreate):
    customer = await ps.get_customer_by_external_id(body.customer_external_id)
    if customer is None:
        raise HTTPException(404, "customer not found — create the customer first")

    ip_id = None
    if body.ip_address:
        ip_row = await ps.get_ip_by_address(body.ip_address)
        ip_id = str(ip_row["ip_id"]) if ip_row else await ps.insert_ip(body.ip_address)

    device_id = None
    if body.device_info:
        device_id = await ps.get_device_by_fingerprint(body.device_info) \
                    or await ps.insert_device(body.device_info)

    event_id = await ps.insert_login_event(
        str(customer["customer_id"]), ip_id, device_id, body.success, body.timestamp,
    )
    return {"event_id": event_id}


@app.post("/predictions")
async def create_prediction(body: api.PredictionCreate):
    customer = await ps.get_customer_by_external_id(body.customer_external_id)
    if customer is None:
        raise HTTPException(404, "customer not found — create the customer first")

    prediction_id = await ps.insert_prediction(
        str(customer["customer_id"]), body.fraud_score, body.risk_level,
        body.top_features, body.model_version,
    )
    return {"prediction_id": prediction_id}