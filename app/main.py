
import uuid
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app import model
from app.database import get_db          

from src.adapters import ps           
import api_schemas as api

@asynccontextmanager
async def lifespan(app:FastAPI):
    await ps.create_all_tables()
    yield

app=FastAPI(title="Shadow Trace", lifespan=lifespan)


@app.exception_handler(asyncpg.ForeignKeyViolationError)
async def fk_violation_handler(request,exc):
    return JSONResponse(400,{"error":"foreign_key_violation","detail":"a reference parent doesnt exsist yet"})


@app.exception_handler(asyncpg.UniqueViolationError)
async def unique_violation_handler(request, exc):
    return JSONResponse(409, {"error": "unique_violation", "detail": str(exc)})





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




@app.get("/customer/{external_id}")
async def read_customer(external_id:str,db:AsyncSession=Depends(get_db)):
    stmt=(select(models.CustomerDB)
        .where(models.CustomerDb.external_id==external_id)
        .options(
            selectinload(models.CustomerDB.transactions),
            selectinload(models.CustomerDB.login_events),
            selectinload(models.CustomerDB.predictions),
            selectinload(models.CustomerDB.identities),
        )
    )
    row=(await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPSException(404,"customer not found")
return _row_to_dict(row, relations=("transactions", "login_events", "predictions", "identities"))