from __future__ import annotations
import uuid
import json
import hashlib
from datetime import datetime
from typing   import Optional, List, Dict, Any, Tuple
import asyncpg
import pandas as pd
from src.adapters.base import get_pool
from src.logger        import logger
_DEFAULT_CHUNK_SIZE = 50_000   

def _gen_id() -> str:
    return str(uuid.uuid4())


def _safe(val, default=None):
    """Return None instead of NaN/inf for nullable numeric fields."""
    if val is None:
        return default
    try:
        import math
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
    except (TypeError, ValueError):
        pass
    return val


def compute_idempotency_key(*parts: Any) -> str:

    raw = ":".join(str(p) for p in parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _parse_affected(status: str) -> int:
    """
    Parse asyncpg's command status tag, e.g. 'INSERT 0 4213' -> 4213.
    Used to report how many rows a staged merge actually inserted
    (as opposed to how many were offered and skipped as duplicates).
    """
    try:
        return int(status.split()[-1])
    except (ValueError, IndexError):
        return 0



async def create_all_tables() -> None:
    """
    Create all tables and indexes in dependency order.
    Safe to call on every startup - every statement is idempotent:
        - CREATE TABLE IF NOT EXISTS
        - ALTER TABLE ADD COLUMN IF NOT EXISTS
        - CREATE [UNIQUE] INDEX IF NOT EXISTS
    The one-time dedup cleanup (see _migrate_dedupe_existing_rows) only
    does real work the first time it finds pre-existing duplicates; every
    call after that is a fast no-op.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():

            # -- customers -----------------------------------------------------
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

            # -- merchants -------------------------------------------------------
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

            # -- cards -----------------------------------------------------------
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cards (
                    card_id           UUID        PRIMARY KEY,
                    card_fingerprint  VARCHAR(50) NOT NULL,
                    card_network      VARCHAR(20),
                    card_category     VARCHAR(20),
                    created_at        TIMESTAMP   DEFAULT NOW()
                );
            """)

            # -- devices ----------------------------------------------------------
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS devices (
                    device_id     UUID         PRIMARY KEY,
                    device_info   VARCHAR(255) NOT NULL,
                    device_type   VARCHAR(20),
                    os            VARCHAR(100),
                    browser       VARCHAR(100),
                    screen_res    VARCHAR(30),
                    created_at    TIMESTAMP    DEFAULT NOW()
                );
            """)

            # -- ips ---------------------------------------------------------------
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

            # -- transactions --------------------------------------------------------
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    tx_id           UUID        PRIMARY KEY,
                    customer_id     UUID        REFERENCES customers(customer_id),
                    merchant_id     UUID        REFERENCES merchants(merchant_id),
                    card_id         UUID        REFERENCES cards(card_id),
                    device_id       UUID        REFERENCES devices(device_id),
                    ip_id           UUID        REFERENCES ips(ip_id),
                    amount          FLOAT,
                    tx_type         VARCHAR(20),
                    product_code    VARCHAR(10),
                    balance_before  FLOAT,
                    balance_after   FLOAT,
                    is_fraud        BOOLEAN     DEFAULT FALSE,
                    is_flagged      BOOLEAN     DEFAULT FALSE,
                    timestamp       TIMESTAMP,
                    created_at      TIMESTAMP   DEFAULT NOW()
                );
            """)
            # migration: add idempotency_key to tables created before this fix
            await conn.execute("""
                ALTER TABLE transactions
                ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
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

            # -- transaction_features ------------------------------------------------
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS transaction_features (
                    feature_id     UUID  PRIMARY KEY,
                    transaction_id UUID  REFERENCES transactions(tx_id),
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

            # -- customer_identity ------------------------------------------------------
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS customer_identity (
                    identity_id    UUID PRIMARY KEY,
                    transaction_id UUID REFERENCES transactions(tx_id),
                    customer_id    UUID REFERENCES customers(customer_id),
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

            # -- login_events --------------------------------------------------------
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS login_events (
                    event_id    UUID      PRIMARY KEY,
                    customer_id UUID      REFERENCES customers(customer_id),
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

            # -- predictions -----------------------------------------------------------
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    prediction_id  UUID      PRIMARY KEY,
                    customer_id    UUID      REFERENCES customers(customer_id),
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
    await _migrate_dedupe_existing_rows()

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_cards_fingerprint
                ON cards(card_fingerprint);
            """)
            await conn.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_devices_device_info
                ON devices(device_info);
            """)
            await conn.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_tx_idempotency_key
                ON transactions(idempotency_key)
                WHERE idempotency_key IS NOT NULL;
            """)

            # one transaction <-> one feature row
            await conn.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_features_transaction_id
                ON transaction_features(transaction_id);
            """)

    logger.success("All tables, migrations, and indexes ready")


async def _migrate_dedupe_existing_rows() -> None:
  
    pool = await get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():

            # -- cards -----------------------------------------------------------
            await conn.execute("""
                WITH ranked AS (
                    SELECT card_id, card_fingerprint,
                           ROW_NUMBER() OVER (
                               PARTITION BY card_fingerprint ORDER BY created_at
                           ) AS rn,
                           FIRST_VALUE(card_id) OVER (
                               PARTITION BY card_fingerprint ORDER BY created_at
                           ) AS canonical_id
                    FROM cards
                ),
                dupes AS (
                    SELECT card_id, canonical_id FROM ranked WHERE rn > 1
                )
                UPDATE transactions t
                SET    card_id = d.canonical_id
                FROM   dupes d
                WHERE  t.card_id = d.card_id;
            """)

            deleted_cards = await conn.execute("""
                WITH ranked AS (
                    SELECT card_id,
                           ROW_NUMBER() OVER (
                               PARTITION BY card_fingerprint ORDER BY created_at
                           ) AS rn
                    FROM cards
                )
                DELETE FROM cards
                WHERE card_id IN (SELECT card_id FROM ranked WHERE rn > 1);
            """)

            # -- devices ------------------------------------------------------------
            await conn.execute("""
                WITH ranked AS (
                    SELECT device_id, device_info,
                           ROW_NUMBER() OVER (
                               PARTITION BY device_info ORDER BY created_at
                           ) AS rn,
                           FIRST_VALUE(device_id) OVER (
                               PARTITION BY device_info ORDER BY created_at
                           ) AS canonical_id
                    FROM devices
                ),
                dupes AS (
                    SELECT device_id, canonical_id FROM ranked WHERE rn > 1
                )
                UPDATE transactions t
                SET    device_id = d.canonical_id
                FROM   dupes d
                WHERE  t.device_id = d.device_id;
            """)

            deleted_devices = await conn.execute("""
                WITH ranked AS (
                    SELECT device_id,
                           ROW_NUMBER() OVER (
                               PARTITION BY device_info ORDER BY created_at
                           ) AS rn
                    FROM devices
                )
                DELETE FROM devices
                WHERE device_id IN (SELECT device_id FROM ranked WHERE rn > 1);
            """)

    n_cards   = _parse_affected(deleted_cards)
    n_devices = _parse_affected(deleted_devices)
    if n_cards or n_devices:
        logger.warning(
            f"Migration cleanup: removed {n_cards} duplicate cards, "
            f"{n_devices} duplicate devices (pre-existing data from before "
            f"the dedup fix)"
        )
    else:
        logger.debug("Migration cleanup: no duplicate cards/devices found")

async def insert_customer(
    external_id: str,
    is_fraud: bool = False,
    risk_score: float = 0.0,
) -> str:
   
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


async def insert_merchant(
    external_id: str,
    category: Optional[str] = None,
    country: Optional[str] = None,
) -> str:
    
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
    card_network:  Optional[str] = None,
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
    os:          Optional[str] = None,
    browser:     Optional[str] = None,
    screen_res:  Optional[str] = None,
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
    country:    Optional[str]  = None,
    city:       Optional[str]  = None,
    vpn_flag:   bool           = False,
    tor_flag:   bool           = False,
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
    customer_id:     str,
    amount:          float,
    tx_type:         str,
    idempotency_key: Optional[str]      = None,
    merchant_id:     Optional[str]      = None,
    card_id:         Optional[str]      = None,
    device_id:       Optional[str]      = None,
    ip_id:           Optional[str]      = None,
    product_code:    Optional[str]      = None,
    balance_before:  Optional[float]    = None,
    balance_after:   Optional[float]    = None,
    is_fraud:        bool               = False,
    is_flagged:      bool               = False,
    timestamp:       Optional[datetime] = None,
) -> Tuple[str, bool]:

    pool  = await get_pool()
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
    customer_id:   str,
    fraud_score:   float,
    risk_level:    str,
    top_features:  Optional[dict]  = None,
    model_version: str             = "1.0.0",
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
    ip_id:       Optional[str]      = None,
    device_id:   Optional[str]      = None,
    success:     bool               = True,
    timestamp:   Optional[datetime] = None,
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



async def bulk_insert_customers(
    df: pd.DataFrame,
    chunk_size: int = _DEFAULT_CHUNK_SIZE,
) -> int:
    """
    Bulk insert customers. DataFrame needs: external_id, is_fraud (optional).
    Safe to rerun - merge step uses ON CONFLICT (external_id) DO NOTHING.
    """
    pool = await get_pool()
    total_inserted = 0

    for start in range(0, len(df), chunk_size):
        chunk = df.iloc[start:start + chunk_size]
        records = [
            (
                uuid.UUID(_gen_id()),
                str(row["external_id"]),
                bool(row.get("is_fraud", False)),
                float(row.get("risk_score", 0.0)),
            )
            for _, row in chunk.iterrows()
        ]

        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("""
                    CREATE TEMP TABLE IF NOT EXISTS tmp_customers_staging
                        (LIKE customers INCLUDING DEFAULTS)
                    ON COMMIT DROP;
                """)
                await conn.copy_records_to_table(
                    "tmp_customers_staging",
                    records=records,
                    columns=["customer_id", "external_id", "is_fraud", "risk_score"],
                )
                status = await conn.execute("""
                    INSERT INTO customers
                        (customer_id, external_id, is_fraud, risk_score)
                    SELECT customer_id, external_id, is_fraud, risk_score
                    FROM   tmp_customers_staging
                    ON CONFLICT (external_id) DO NOTHING;
                """)

        inserted = _parse_affected(status)
        total_inserted += inserted
        logger.info(
            f"Customers chunk [{start}:{start+len(chunk)}] - "
            f"{inserted}/{len(records)} new (rest were duplicates)"
        )

    logger.success(f"bulk_insert_customers complete - {total_inserted:,} new rows")
    return total_inserted


async def bulk_insert_merchants(
    df: pd.DataFrame,
    chunk_size: int = _DEFAULT_CHUNK_SIZE,
) -> int:
   
    pool = await get_pool()
    total_inserted = 0

    for start in range(0, len(df), chunk_size):
        chunk = df.iloc[start:start + chunk_size]
        records = [
            (uuid.UUID(_gen_id()), str(row["external_id"]))
            for _, row in chunk.iterrows()
        ]

        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("""
                    CREATE TEMP TABLE IF NOT EXISTS tmp_merchants_staging
                        (LIKE merchants INCLUDING DEFAULTS)
                    ON COMMIT DROP;
                """)
                await conn.copy_records_to_table(
                    "tmp_merchants_staging",
                    records=records,
                    columns=["merchant_id", "external_id"],
                )
                status = await conn.execute("""
                    INSERT INTO merchants (merchant_id, external_id)
                    SELECT merchant_id, external_id
                    FROM   tmp_merchants_staging
                    ON CONFLICT (external_id) DO NOTHING;
                """)

        inserted = _parse_affected(status)
        total_inserted += inserted
        logger.info(
            f"Merchants chunk [{start}:{start+len(chunk)}] - "
            f"{inserted}/{len(records)} new"
        )

    logger.success(f"bulk_insert_merchants complete - {total_inserted:,} new rows")
    return total_inserted


async def bulk_insert_transactions(
    df: pd.DataFrame,
    chunk_size: int = _DEFAULT_CHUNK_SIZE,
) -> int:
   
    if "idempotency_key" not in df.columns:
        raise ValueError(
            "bulk_insert_transactions requires an 'idempotency_key' column. "
            "Compute one per row with compute_idempotency_key(...) before "
            "calling - see this function's docstring for a worked example. "
            "This is what makes reruns and Kafka redeliveries safe."
        )

    pool = await get_pool()
    total_inserted = 0

    for start in range(0, len(df), chunk_size):
        chunk = df.iloc[start:start + chunk_size]

        records = []
        for _, row in chunk.iterrows():
            records.append((
                uuid.UUID(_gen_id()),
                uuid.UUID(str(row["customer_id"])) if row.get("customer_id") else None,
                None,  # merchant_id 
                None,  # card_id     
                None,  # device_id   
                None,  # ip_id       
                _safe(row.get("amount"), 0.0),
                _safe(row.get("tx_type"), "UNKNOWN"),
                None,  
                _safe(row.get("balance_before")),
                _safe(row.get("balance_after")),
                bool(row.get("is_fraud",   False)),
                bool(row.get("is_flagged", False)),
                row.get("timestamp"),
                str(row["idempotency_key"]),
            ))

        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("""
                    CREATE TEMP TABLE IF NOT EXISTS tmp_tx_staging
                        (LIKE transactions INCLUDING DEFAULTS)
                    ON COMMIT DROP;
                """)
                await conn.copy_records_to_table(
                    "tmp_tx_staging",
                    records=records,
                    columns=[
                        "tx_id", "customer_id", "merchant_id", "card_id",
                        "device_id", "ip_id", "amount", "tx_type",
                        "product_code", "balance_before", "balance_after",
                        "is_fraud", "is_flagged", "timestamp", "idempotency_key",
                    ],
                )
                status = await conn.execute("""
                    INSERT INTO transactions (
                        tx_id, customer_id, merchant_id, card_id,
                        device_id, ip_id, amount, tx_type,
                        product_code, balance_before, balance_after,
                        is_fraud, is_flagged, timestamp, idempotency_key
                    )
                    SELECT
                        tx_id, customer_id, merchant_id, card_id,
                        device_id, ip_id, amount, tx_type,
                        product_code, balance_before, balance_after,
                        is_fraud, is_flagged, timestamp, idempotency_key
                    FROM tmp_tx_staging
                    ON CONFLICT (idempotency_key) DO NOTHING;
                """)

        inserted = _parse_affected(status)
        total_inserted += inserted
        logger.info(
            f"Transactions chunk [{start}:{start+len(chunk)}] - "
            f"{inserted}/{len(records)} new "
            f"({len(records)-inserted} duplicates skipped)"
        )

    logger.success(f"bulk_insert_transactions complete - {total_inserted:,} new rows")
    return total_inserted


async def bulk_insert_transaction_features(
    df: pd.DataFrame,
    transaction_id_map: Dict[int, str],
    chunk_size: int = _DEFAULT_CHUNK_SIZE,
) -> int:
    """
    Bulk insert IEEE C/D/M feature columns. Safe to rerun - merge step
    uses ON CONFLICT (transaction_id) DO NOTHING, since one transaction
    should only ever have one feature row.

    transaction_id_map: IEEE TransactionID (int) -> our tx_id (UUID str)
    """
    pool = await get_pool()
    total_inserted = 0
    cols = [
        "feature_id", "transaction_id",
        "c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12","c13","c14",
        "d1","d2","d3","d4","d5","d6","d7","d8","d9","d10","d11","d12","d13","d14","d15",
        "m1","m2","m3","m4","m5","m6","m7","m8","m9",
    ]

    for start in range(0, len(df), chunk_size):
        chunk = df.iloc[start:start + chunk_size]

        records = []
        for _, row in chunk.iterrows():
            tx_id = transaction_id_map.get(int(row["TransactionID"]))
            if tx_id is None:
                continue
            records.append((
                uuid.UUID(_gen_id()), uuid.UUID(tx_id),
                _safe(row.get("C1")),  _safe(row.get("C2")),
                _safe(row.get("C3")),  _safe(row.get("C4")),
                _safe(row.get("C5")),  _safe(row.get("C6")),
                _safe(row.get("C7")),  _safe(row.get("C8")),
                _safe(row.get("C9")),  _safe(row.get("C10")),
                _safe(row.get("C11")), _safe(row.get("C12")),
                _safe(row.get("C13")), _safe(row.get("C14")),
                _safe(row.get("D1")),  _safe(row.get("D2")),
                _safe(row.get("D3")),  _safe(row.get("D4")),
                _safe(row.get("D5")),  _safe(row.get("D6")),
                _safe(row.get("D7")),  _safe(row.get("D8")),
                _safe(row.get("D9")),  _safe(row.get("D10")),
                _safe(row.get("D11")), _safe(row.get("D12")),
                _safe(row.get("D13")), _safe(row.get("D14")),
                _safe(row.get("D15")),
                _safe(row.get("M1")),  _safe(row.get("M2")),
                _safe(row.get("M3")),  _safe(row.get("M4")),
                _safe(row.get("M5")),  _safe(row.get("M6")),
                _safe(row.get("M7")),  _safe(row.get("M8")),
                _safe(row.get("M9")),
            ))

        if not records:
            continue

        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute("""
                    CREATE TEMP TABLE IF NOT EXISTS tmp_features_staging
                        (LIKE transaction_features INCLUDING DEFAULTS)
                    ON COMMIT DROP;
                """)
                await conn.copy_records_to_table(
                    "tmp_features_staging", records=records, columns=cols,
                )
                col_list = ", ".join(cols)
                status = await conn.execute(f"""
                    INSERT INTO transaction_features ({col_list})
                    SELECT {col_list}
                    FROM   tmp_features_staging
                    ON CONFLICT (transaction_id) DO NOTHING;
                """)

        inserted = _parse_affected(status)
        total_inserted += inserted
        logger.info(
            f"Features chunk [{start}:{start+len(chunk)}] - "
            f"{inserted}/{len(records)} new"
        )

    logger.success(f"bulk_insert_transaction_features complete - {total_inserted:,} new rows")
    return total_inserted



async def get_customer_transactions(customer_id: str, limit: int = 100) -> List[Dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT tx_id, amount, tx_type, is_fraud,
                   is_flagged, timestamp, balance_before, balance_after
            FROM   transactions
            WHERE  customer_id = $1
            ORDER  BY timestamp DESC
            LIMIT  $2;
        """, customer_id, limit)
    return [dict(r) for r in rows]


async def get_all_customers() -> List[Dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT customer_id, external_id, is_fraud, risk_score
            FROM   customers
            ORDER  BY created_at;
        """)
    return [dict(r) for r in rows]


async def get_customer_by_external_id(external_id: str) -> Optional[Dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT customer_id, external_id, is_fraud, risk_score
            FROM   customers
            WHERE  external_id = $1;
        """, external_id)
    return dict(row) if row else None


async def get_device_by_fingerprint(device_info: str) -> Optional[str]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT device_id FROM devices
            WHERE  device_info = $1
            LIMIT  1;
        """, device_info)
    return str(row["device_id"]) if row else None


async def get_ip_by_address(ip_address: str) -> Optional[Dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT ip_id, country, vpn_flag, tor_flag, risk_score
            FROM   ips
            WHERE  ip_address = $1;
        """, ip_address)
    return dict(row) if row else None


async def get_fraud_customers() -> List[Dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT customer_id, external_id, risk_score
            FROM   customers
            WHERE  is_fraud = TRUE
            ORDER  BY risk_score DESC;
        """)
    return [dict(r) for r in rows]


async def get_high_score_predictions(threshold: float = 0.85, limit: int = 1000) -> List[Dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT customer_id, fraud_score, risk_level,
                   top_features, model_version, scored_at
            FROM   predictions
            WHERE  fraud_score >= $1
            ORDER  BY fraud_score DESC
            LIMIT  $2;
        """, threshold, limit)
    return [dict(r) for r in rows]


async def get_customer_velocity(customer_id: str, hours: int = 24) -> int:
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.fetchval("""
            SELECT COUNT(*)
            FROM   transactions
            WHERE  customer_id = $1
              AND  timestamp   >= NOW() - ($2 * INTERVAL '1 hour');
        """, customer_id, hours)
    return int(result or 0)


async def get_customer_stats(customer_id: str) -> Dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT
                COUNT(*)                                        AS tx_count,
                AVG(amount)                                     AS avg_amount,
                MAX(amount)                                     AS max_amount,
                SUM(CASE WHEN is_fraud   THEN 1 ELSE 0 END)    AS fraud_count,
                SUM(CASE WHEN is_flagged THEN 1 ELSE 0 END)    AS flagged_count,
                COUNT(DISTINCT device_id)                       AS unique_devices,
                COUNT(DISTINCT ip_id)                           AS unique_ips,
                COUNT(DISTINCT merchant_id)                     AS unique_merchants,
                SUM(CASE
                    WHEN EXTRACT(HOUR FROM timestamp) >= 23
                      OR EXTRACT(HOUR FROM timestamp) <  5
                    THEN 1 ELSE 0
                END)                                            AS night_tx_count,
                AVG(balance_before - balance_after)             AS avg_balance_drain
            FROM transactions
            WHERE customer_id = $1;
        """, customer_id)
    return dict(row) if row else {}


async def update_customer_risk_score(customer_id: str, risk_score: float) -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE customers
            SET    risk_score = $1, updated_at = NOW()
            WHERE  customer_id = $2;
        """, risk_score, customer_id)


async def batch_update_risk_scores(scores: Dict[str, float]) -> int:
    pool = await get_pool()
    records = [(score, cid) for cid, score in scores.items()]

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.executemany("""
                UPDATE customers
                SET    risk_score = $1, updated_at = NOW()
                WHERE  customer_id = $2;
            """, records)

    logger.info(f"Updated risk scores for {len(records):,} customers")
    return len(records)
