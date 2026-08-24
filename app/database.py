import os
<<<<<<< HEAD
from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import (
=======
import typing as t
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import(
>>>>>>> 83b84e9 (do it)
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase
<<<<<<< HEAD

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,      
    pool_recycle=1800,       
    connect_args={
        "statement_cache_size": 0,  
                                     
        "ssl": "require",           
    },
)

=======
load_dotenv()


URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/fraud_db")

engine = create_async_engine(
    URL,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args={
        "statement_cache_size": 0, 
        "prepared_statement_cache_size": 0
    },
)
>>>>>>> 83b84e9 (do it)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,  
    class_=AsyncSession,
)

<<<<<<< HEAD

class Base(DeclarativeBase):
    pass


=======
class Base(DeclarativeBase):
    pass

>>>>>>> 83b84e9 (do it)
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
<<<<<<< HEAD
            raise
=======
            raise


>>>>>>> 83b84e9 (do it)
