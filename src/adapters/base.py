<<<<<<< HEAD
import psycopg2
from neo4j import GraphDatabase
from src.config import BaseConfig


class PostgresDB:
    def __init__(self):
        cfg = BaseConfig.get_postgres()
        self.conn = psycopg2.connect(
            host=cfg["host"],
            port=cfg["port"],
            database=cfg["database"],
            user=cfg["user"],
            password=cfg["password"]
        )

    def cursor(self):
        return self.conn.cursor()

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


class Neo4jDB:
    def __init__(self):
        cfg = BaseConfig.get_neo4j()
        self.driver = GraphDatabase.driver(
            cfg["uri"],
            auth=(str(cfg["user"]), str(cfg["password"]))
        )

    def session(self):
        return self.driver.session(database="neo4j")

    def close(self):
        self.driver.close()
=======
import os
import asyncpg

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Return (and lazily create) the shared asyncpg connection pool."""
    global _pool
    if _pool is None:
        dsn = os.environ.get(
            "DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/fraud_db",
        )
        # asyncpg DSN uses postgresql://, not postgresql+asyncpg://
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://")
        _pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=2,
            max_size=10,
            statement_cache_size=0,
        )
    return _pool


async def close_pool() -> None:
    """Close the pool on shutdown."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
>>>>>>> a4fb4db (do ittt)
