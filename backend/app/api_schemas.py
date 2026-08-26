from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel, Field

class CustomerCreate(BaseModel):
    external_id: str = Field(min_length=2, max_length=50)
    risk_score: float = 0.0

class MerchantCreate(BaseModel):
    external_id: str = Field(min_length=2, max_length=50)
    category: Optional[str] = Field(default=None, max_length=50)
    country: Optional[str] = Field(default=None, max_length=10)

class CardCreate(BaseModel):   
    card_fingerprint: str = Field(min_length=2, max_length=50)
    card_network: Optional[str] = Field(default=None, max_length=20)
    card_category: Optional[str] = Field(default=None, max_length=20)

class DeviceCreate(BaseModel):  

    device_info: str = Field(min_length=2, max_length=255)
    device_type: Optional[str] = Field(default=None, max_length=20)
    os: Optional[str] = Field(default=None, max_length=100)
    browser: Optional[str] = Field(default=None, max_length=100)
    screen_res: Optional[str] = Field(default=None, max_length=30)

class IPCreate(BaseModel):
    ip_address: str = Field(min_length=2, max_length=45)
    country: Optional[str] = Field(default=None, max_length=10)
    city: Optional[str] = Field(default=None, max_length=100)
    vpn_flag: bool = False
    tor_flag: bool = False

class TransactionCreate(BaseModel):
    customer_id: str
    amount: float
    tx_type: str = Field(min_length=2, max_length=20)
    product_code: Optional[str] = Field(default=None, max_length=10)
    balance_before: Optional[float] = None
    balance_after: Optional[float] = None
    timestamp: Optional[datetime] = None
    merchant_external_id: Optional[str] = None
    card_fingerprint: Optional[str] = None
    card_network: Optional[str] = None
    card_category: Optional[str] = None
    device_info: Optional[str] = None
    device_type: Optional[str] = None
    os: Optional[str] = None
    browser: Optional[str] = None
    screen_res: Optional[str] = None
    ip_address: Optional[str] = None
    ip_country: Optional[str] = None
    ip_city: Optional[str] = None
    vpn_flag: bool = False
    tor_flag: bool = False
    is_fraud: bool = False
    is_flagged: bool = False
    idempotency_key: Optional[str] = Field(default=None, max_length=128)

class LoginEventCreate(BaseModel):
    customer_external_id:str
    ip_id: Optional[str] = None
    device_id: Optional[str] = None
    success: bool = True
    timestamp: Optional[datetime] = None


class PredictionCreate(BaseModel):
    customer_external_id: str
    fraud_score: float
    risk_level: Optional[str] = Field(default=None, max_length=10)
    top_features: Optional[Dict[str, float]] = None
    model_version: str = "1.0.0"

