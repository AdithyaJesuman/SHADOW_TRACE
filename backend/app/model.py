import uuid
from datetime import datetime
from typing import Optional, List, Dict
from decimal import Decimal
from sqlalchemy import Boolean, Float, Numeric, String, DateTime, ForeignKey, Index, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class CustomerDB(Base):
    __tablename__="customers"
    customer_id:Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    external_id:Mapped[str]=mapped_column(String(50),nullable=False,index=True,unique=True)
    is_fraud:Mapped[bool]=mapped_column(Boolean,default=False,index=True)
    risk_score:Mapped[float]=mapped_column(Float,default=0.0)
    created_at:Mapped[datetime]=mapped_column(DateTime,server_default=text("NOW()"))
    updated_at:Mapped[datetime]=mapped_column(DateTime,server_default=text("NOW()"))

    transactions:Mapped[List["TransactionDB"]]=relationship(back_populates="customer")
    login_events:Mapped[List["LoginEventDB"]]=relationship(back_populates="customer")
    predictions:Mapped[List["PredictionDB"]]=relationship(back_populates="customer")
    identities:Mapped[List["CustomerIdentityDB"]]=relationship(back_populates="customer")

class MerchantDB(Base):
    __tablename__="merchants"

    merchant_id:Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    external_id:Mapped[str]=mapped_column(String(50),unique=True,nullable=False,index=True)
    category:Mapped[Optional[str]]=mapped_column(String(50),nullable=True)
    country:Mapped[Optional[str]]=mapped_column(String(10),nullable=True)
    created_at:Mapped[datetime]=mapped_column(DateTime,server_default=text("NOW()"))

    transactions:Mapped[List["TransactionDB"]]=relationship(back_populates="merchant")

class CardDB(Base):
    __tablename__="cards"
    card_id:Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    card_fingerprint:Mapped[str]=mapped_column(String(50),unique=True,nullable=False,index=True)
    card_network: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    card_category: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    created_at:Mapped[datetime]=mapped_column(DateTime,server_default=text("NOW()"))

    transactions:Mapped[List["TransactionDB"]]=relationship(back_populates="card")

class DeviceDB(Base):
    __tablename__="devices"
    device_id:Mapped[uuid.UUID]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    device_info: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)  # uq_devices_device_info
    device_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    os: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    browser: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    screen_res: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    created_at:Mapped[datetime]=mapped_column(DateTime,server_default=text("NOW()"))

    transactions:Mapped[List["TransactionDB"]]=relationship(back_populates="device")
    login_events:Mapped[List["LoginEventDB"]]=relationship(back_populates="device")

class IPDB(Base):
    __tablename__ = "ips"
    ip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ip_address: Mapped[str] = mapped_column(String(45), unique=True, nullable=False, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    vpn_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    tor_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("NOW()"), onupdate=text("NOW()"))

    transactions: Mapped[List["TransactionDB"]] = relationship(back_populates="ip")
    login_events: Mapped[List["LoginEventDB"]] = relationship(back_populates="ip")


class TransactionDB(Base):
    __tablename__="transactions"
    __table_args__=(Index("uq_tx_idempotency_key", "idempotency_key", unique=True,postgresql_where=text("idempotency_key IS NOT NULL")),
    )
    
    tx_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.customer_id"), nullable=False, index=True)
    merchant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("merchants.merchant_id"), nullable=True)
    card_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("cards.card_id"), nullable=True)
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.device_id"), nullable=True)
    ip_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("ips.ip_id"), nullable=True)

    amount: Mapped[Decimal] = mapped_column(Numeric, index=True)
    tx_type: Mapped[str] = mapped_column(String(20))
    product_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    balance_before: Mapped[Optional[Decimal]] = mapped_column(Numeric, nullable=True)
    balance_after: Mapped[Optional[Decimal]] = mapped_column(Numeric, nullable=True)

    is_fraud: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("NOW()"))

    customer: Mapped["CustomerDB"] = relationship(back_populates="transactions")
    merchant: Mapped[Optional["MerchantDB"]] = relationship(back_populates="transactions")
    card: Mapped[Optional["CardDB"]] = relationship(back_populates="transactions")
    device: Mapped[Optional["DeviceDB"]] = relationship(back_populates="transactions")
    ip: Mapped[Optional["IPDB"]] = relationship(back_populates="transactions")
    features: Mapped[Optional["TransactionFeaturesDB"]] = relationship(back_populates="transaction", uselist=False)
    identity: Mapped[Optional["CustomerIdentityDB"]] = relationship(back_populates="transaction", uselist=False)


class TransactionFeaturesDB(Base):
    __tablename__ = "transaction_features"

    feature_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.tx_id"), unique=True, nullable=False)  # uq_features_transaction_id

    c1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c4: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c5: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c6: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c7: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c8: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c9: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c10: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c11: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c12: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c13: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    c14: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    d1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d3: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d4: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d5: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d6: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d7: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d8: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d9: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d10: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d11: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d12: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d13: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d14: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    d15: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    m1: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m2: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m3: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m4: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m5: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m6: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m7: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m8: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    m9: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("NOW()"))

    transaction: Mapped["TransactionDB"] = relationship(back_populates="features")



class CustomerIdentityDB(Base):
    __tablename__ = "customer_identity"

    identity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.tx_id"), nullable=False,unique=True)  
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.customer_id"), nullable=False, index=True)

    id_01: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_02: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_03: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_04: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_05: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_06: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_07: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_08: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_09: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_10: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_11: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_12: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    id_13: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_14: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_15: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_16: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_17: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_18: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_19: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_20: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_21: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_22: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_23: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_24: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_25: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_26: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_27: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_28: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_29: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_30: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    id_31: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    id_32: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    id_33: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    id_34: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_35: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_36: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_37: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    id_38: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("NOW()"))

    transaction: Mapped["TransactionDB"] = relationship(back_populates="identity")
    customer: Mapped["CustomerDB"] = relationship(back_populates="identities")


class LoginEventDB(Base):
    __tablename__ = "login_events"

    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.customer_id"), nullable=False, index=True)
    ip_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("ips.ip_id"), nullable=True)
    device_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.device_id"), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("NOW()"))

    customer: Mapped["CustomerDB"] = relationship(back_populates="login_events")
    ip: Mapped[Optional["IPDB"]] = relationship(back_populates="login_events")
    device: Mapped[Optional["DeviceDB"]] = relationship(back_populates="login_events")


class PredictionDB(Base):
    __tablename__ = "predictions"

    prediction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.customer_id"), nullable=False, index=True)
    fraud_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    top_features: Mapped[Optional[Dict[str, float]]] = mapped_column(JSONB, nullable=True)
    model_version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    scored_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("NOW()"), index=True)

    customer: Mapped["CustomerDB"] = relationship(back_populates="predictions")















