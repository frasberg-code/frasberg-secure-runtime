from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class CryptoWallet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: EmailStr
    currency: str  # BTC, ETH, USDT, etc.
    balance: float = 0.0
    wallet_address: Optional[str] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)

class CryptoTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: EmailStr
    transaction_type: str  # buy, sell, transfer
    currency: str
    amount: float
    price_usd: float
    status: str = "pending"  # pending, completed, failed
    transaction_hash: Optional[str] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)