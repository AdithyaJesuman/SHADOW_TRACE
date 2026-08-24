from __future__ import annotations

import uuid
import json
import hashlib
from datetime import datetime
from typing import Optional, Tuple, Any

from src.adapters.base import get_pool
from src.logger import logger


def _gen_id() -> str:
    return str(uuid.uuid4())


def compute_idempotency_key(*parts: Any) -> str:
    raw = ":".join(str(p) for p in parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()



async def create_all_tables() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS customers (
                    customer_id   UUID        PRIMARY KEY,
                    external_id   VARCHAR(50) UNIQUE NOT NULL,
                    is_fraud      BOOLEAN     DEFAULT FALSE,
                    risk_score    FLOAT       DEFAULT 0.0,
                    created_at    TIMESTAMP   DEFAULT NOW(),
                    updated_at    TIMESTAMP   DEFAULT NOW()
                );
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_customers_external_id
                ON customers(external_id);
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_customers_is_fraud
                ON customers(is_fraud);
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS merchants (
                    merchant_id   UUID        PRIMARY KEY,
                    external_id   VARCHAR(50) UNIQUE NOT NULL,
                    category      VARCHAR(50),
                    country       VARCHAR(10),
                    created_at    TIMESTAMP   DEFAULT NOW()
                );
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_merchants_external_id
                ON merchants(external_id);
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cards (
                    card_id           UUID        PRIMARY KEY,
                    card_fingerprint  VARCHAR(50) UNIQUE NOT NULL,
                    card_network      VARCHAR(20),
                    card_category     VARCHAR(20),
                    created_at        TIMESTAMP   DEFAULT NOW()
                );
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS devices (
                    device_id     UUID         PRIMARY KEY,
                    device_info   VARCHAR(255) UNIQUE NOT NULL,
                    device_type   VARCHAR(20),
                    os            VARCHAR(100),
                    browser       VARCHAR(100),
                    screen_res    VARCHAR(30),
                    created_at    TIMESTAMP    DEFAULT NOW()
                );
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS ips (
                    ip_id        UUID         PRIMARY KEY,
                    ip_address   VARCHAR(45)  UNIQUE NOT NULL,
                    country      VARCHAR(10),
                    city         VARCHAR(100),
                    vpn_flag     BOOLEAN      DEFAULT FALSE,
                    tor_flag     BOOLEAN      DEFAULT FALSE,
                    risk_score   FLOAT        DEFAULT 0.0,
                    created_at   TIMESTAMP    DEFAULT NOW(),
                    updated_at   TIMESTAMP    DEFAULT NOW()
                );
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_ips_address
                ON ips(ip_address);
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_ips_vpn_tor
                ON ips(vpn_flag, tor_flag);
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    tx_id            UUID        PRIMARY KEY,
                    customer_id      UUID        NOT NULL REFERENCES customers(customer_id),
                    merchant_id      UUID        REFERENCES merchants(merchant_id),
                    card_id          UUID        REFERENCES cards(card_id),
                    device_id        UUID        REFERENCES devices(device_id),
                    ip_id            UUID        REFERENCES ips(ip_id),
                    amount           FLOAT,
                    tx_type          VARCHAR(20),
                    product_code     VARCHAR(10),
                    balance_before   FLOAT,
                    balance_after    FLOAT,
                    is_fraud         BOOLEAN     DEFAULT FALSE,
                    is_flagged       BOOLEAN     DEFAULT FALSE,
                    idempotency_key  VARCHAR(128),
                    timestamp        TIMESTAMP,
                    created_at       TIMESTAMP   DEFAULT NOW()
                );
            """)
            await conn.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_idempotency_key
                ON transactions(idempotency_key)
                WHERE idempotency_key IS NOT NULL;
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_tx_customer_id
                ON transactions(customer_id);
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_tx_timestamp
                ON transactions(timestamp DESC);
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_tx_is_fraud
                ON transactions(is_fraud);
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_tx_customer_timestamp
                ON transactions(customer_id, timestamp DESC);
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_tx_amount
                ON transactions(amount DESC);
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS transaction_features (
                    feature_id     UUID  PRIMARY KEY,
                    transaction_id UUID  UNIQUE NOT NULL REFERENCES transactions(tx_id),
                    c1  FLOAT, c2  FLOAT, c3  FLOAT, c4  FLOAT,
                    c5  FLOAT, c6  FLOAT, c7  FLOAT, c8  FLOAT,
                    c9  FLOAT, c10 FLOAT, c11 FLOAT, c12 FLOAT,
                    c13 FLOAT, c14 FLOAT,
                    d1  FLOAT, d2  FLOAT, d3  FLOAT, d4  FLOAT,
                    d5  FLOAT, d6  FLOAT, d7  FLOAT, d8  FLOAT,
                    d9  FLOAT, d10 FLOAT, d11 FLOAT, d12 FLOAT,
                    d13 FLOAT, d14 FLOAT, d15 FLOAT,
                    m1  VARCHAR(5), m2 VARCHAR(5), m3 VARCHAR(5),
                    m4  VARCHAR(5), m5 VARCHAR(5), m6 VARCHAR(5),
                    m7  VARCHAR(5), m8 VARCHAR(5), m9 VARCHAR(5),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS customer_identity (
                    identity_id    UUID PRIMARY KEY,
                    transaction_id UUID NOT NULL REFERENCES transactions(tx_id),
                    customer_id    UUID NOT NULL REFERENCES customers(customer_id),
                    id_01 FLOAT, id_02 FLOAT, id_03 FLOAT, id_04 FLOAT,
                    id_05 FLOAT, id_06 FLOAT, id_07 FLOAT, id_08 FLOAT,
                    id_09 FLOAT, id_10 FLOAT, id_11 FLOAT,
                    id_12 VARCHAR(10), id_13 FLOAT, id_14 FLOAT,
                    id_15 VARCHAR(20), id_16 VARCHAR(20),
                    id_17 FLOAT, id_18 FLOAT, id_19 FLOAT, id_20 FLOAT,
                    id_21 FLOAT, id_22 FLOAT,
                    id_23 VARCHAR(20),
                    id_24 FLOAT, id_25 FLOAT, id_26 FLOAT, id_27 FLOAT,
                    id_28 VARCHAR(20), id_29 VARCHAR(20),
                    id_30 VARCHAR(100), id_31 VARCHAR(100),
                    id_32 FLOAT, id_33 VARCHAR(30),
                    id_34 VARCHAR(20), id_35 VARCHAR(20),
                    id_36 VARCHAR(20), id_37 VARCHAR(20), id_38 VARCHAR(20),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_identity_customer_id
                ON customer_identity(customer_id);
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS login_events (
                    event_id    UUID      PRIMARY KEY,
                    customer_id UUID      NOT NULL REFERENCES customers(customer_id),
                    ip_id       UUID      REFERENCES ips(ip_id),
                    device_id   UUID      REFERENCES devices(device_id),
                    success     BOOLEAN   DEFAULT TRUE,
                    timestamp   TIMESTAMP,
                    created_at  TIMESTAMP DEFAULT NOW()
                );
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_login_customer_timestamp
                ON login_events(customer_id, timestamp DESC);
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    prediction_id  UUID      PRIMARY KEY,
                    customer_id    UUID      NOT NULL REFERENCES customers(customer_id),
                    fraud_score    FLOAT     NOT NULL,
                    risk_level     VARCHAR(10),
                    top_features   JSONB,
                    model_version  VARCHAR(20) DEFAULT '1.0.0',
                    scored_at      TIMESTAMP DEFAULT NOW()
                );
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_predictions_fraud_score
                ON predictions(fraud_score DESC);
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_predictions_scored_at
                ON predictions(scored_at DESC);
            """)

    logger.success("All tables and indexes ready")



async def insert_customer( external_id: str,is_fraud: bool = False,risk_score:float = 0.0,) -> str:
    pool = await get_pool()
    customer_id = _gen_id()
    async with pool.acquire() as conn:
        result = await conn.fetchrow("""
            INSERT INTO customers (customer_id, external_id, is_fraud, risk_score)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (external_id) DO NOTHING
            RETURNING customer_id;
        """, customer_id, external_id, is_fraud, risk_score)

        if result is None:
            result = await conn.fetchrow(
                "SELECT customer_id FROM customers WHERE external_id = $1;",
                external_id,
            )

    return str(result["customer_id"])


async def insert_merchant(external_id: str,category: Optional[str] = None,country: Optional[str] = None,) -> str:
    pool = await get_pool()
    merchant_id = _gen_id()

    async with pool.acquire() as conn:
        result = await conn.fetchrow("""
            INSERT INTO merchants (merchant_id, external_id, category, country)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (external_id) DO NOTHING
            RETURNING merchant_id;
        """, merchant_id, external_id, category, country)

        if result is None:
            result = await conn.fetchrow(
                "SELECT merchant_id FROM merchants WHERE external_id = $1;",
                external_id,
            )

    return str(result["merchant_id"])


async def insert_card(
    card_fingerprint: str,
    card_network: Optional[str] = None,
    card_category: Optional[str] = None,
) -> str:
    pool = await get_pool()
    card_id = _gen_id()

    async with pool.acquire() as conn:
        result = await conn.fetchrow("""
            INSERT INTO cards (card_id, card_fingerprint, card_network, card_category)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (card_fingerprint) DO UPDATE
                SET card_network  = COALESCE(EXCLUDED.card_network,  cards.card_network),
                    card_category = COALESCE(EXCLUDED.card_category, cards.card_category)
            RETURNING card_id;
        """, card_id, card_fingerprint, card_network, card_category)

    return str(result["card_id"])


async def insert_device(
    device_info: str,
    device_type: Optional[str] = None,
    os: Optional[str] = None,
    browser: Optional[str] = None,
    screen_res: Optional[str] = None,
) -> str:
    pool = await get_pool()
    device_id = _gen_id()

    async with pool.acquire() as conn:
        result = await conn.fetchrow("""
            INSERT INTO devices
                (device_id, device_info, device_type, os, browser, screen_res)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (device_info) DO UPDATE
                SET device_type = COALESCE(EXCLUDED.device_type, devices.device_type),
                    os          = COALESCE(EXCLUDED.os,          devices.os),
                    browser     = COALESCE(EXCLUDED.browser,     devices.browser),
                    screen_res  = COALESCE(EXCLUDED.screen_res,  devices.screen_res)
            RETURNING device_id;
        """, device_id, device_info, device_type, os, browser, screen_res)

    return str(result["device_id"])


async def insert_ip(
    ip_address: str,
    country: Optional[str] = None,
    city: Optional[str] = None,
    vpn_flag: bool = False,
    tor_flag: bool = False,
) -> str:
    pool = await get_pool()
    ip_id = _gen_id()

    async with pool.acquire() as conn:
        result = await conn.fetchrow("""
            INSERT INTO ips (ip_id, ip_address, country, city, vpn_flag, tor_flag)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (ip_address) DO NOTHING
            RETURNING ip_id;
        """, ip_id, ip_address, country, city, vpn_flag, tor_flag)

        if result is None:
            result = await conn.fetchrow(
                "SELECT ip_id FROM ips WHERE ip_address = $1;",
                ip_address,
            )

    return str(result["ip_id"])


async def insert_transaction(
    customer_id: str,
    amount: float,
    tx_type: str,
    idempotency_key: Optional[str] = None,
    merchant_id: Optional[str] = None,
    card_id: Optional[str] = None,
    device_id: Optional[str] = None,
    ip_id: Optional[str] = None,
    product_code: Optional[str] = None,
    balance_before: Optional[float] = None,
    balance_after: Optional[float] = None,
    is_fraud: bool = False,
    is_flagged: bool = False,
    timestamp: Optional[datetime] = None,
) -> Tuple[str, bool]:
    pool = await get_pool()
    tx_id = _gen_id()

    async with pool.acquire() as conn:
        if idempotency_key is not None:
            result = await conn.fetchrow("""
                INSERT INTO transactions (
                    tx_id, customer_id, merchant_id, card_id,
                    device_id, ip_id, amount, tx_type,
                    product_code, balance_before, balance_after,
                    is_fraud, is_flagged, timestamp, idempotency_key
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                ON CONFLICT (idempotency_key) DO NOTHING
                RETURNING tx_id;
            """,
                tx_id, customer_id, merchant_id, card_id,
                device_id, ip_id, amount, tx_type,
                product_code, balance_before, balance_after,
                is_fraud, is_flagged, timestamp, idempotency_key,
            )

            if result is None:
                existing = await conn.fetchrow(
                    "SELECT tx_id FROM transactions WHERE idempotency_key = $1;",
                    idempotency_key,
                )
                logger.debug(f"Duplicate transaction skipped - key={idempotency_key[:16]}...")
                return str(existing["tx_id"]), False

            return str(result["tx_id"]), True

        result = await conn.fetchrow("""
            INSERT INTO transactions (
                tx_id, customer_id, merchant_id, card_id,
                device_id, ip_id, amount, tx_type,
                product_code, balance_before, balance_after,
                is_fraud, is_flagged, timestamp
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING tx_id;
        """,
            tx_id, customer_id, merchant_id, card_id,
            device_id, ip_id, amount, tx_type,
            product_code, balance_before, balance_after,
            is_fraud, is_flagged, timestamp,
        )
        return str(result["tx_id"]), True


async def insert_prediction(
    customer_id: str,
    fraud_score: float,
    risk_level: Optional[str] = None,
    top_features: Optional[dict] = None,
    model_version: str = "1.0.0",
) -> str:
    pool = await get_pool()
    prediction_id = _gen_id()

    async with pool.acquire() as conn:
        result = await conn.fetchrow("""
            INSERT INTO predictions
                (prediction_id, customer_id, fraud_score,
                 risk_level, top_features, model_version)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING prediction_id;
        """,
            prediction_id, customer_id, fraud_score,
            risk_level,
            json.dumps(top_features) if top_features else None,
            model_version,
        )

    return str(result["prediction_id"])


async def insert_login_event(
    customer_id: str,
    ip_id: Optional[str] = None,
    device_id: Optional[str] = None,
    success: bool = True,
    timestamp: Optional[datetime] = None,
) -> str:
    pool = await get_pool()
    event_id = _gen_id()

    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO login_events
                (event_id, customer_id, ip_id, device_id, success, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6);
        """, event_id, customer_id, ip_id, device_id, success, timestamp)

    return event_id