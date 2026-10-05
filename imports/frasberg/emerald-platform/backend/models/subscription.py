from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class UserSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: EmailStr
    tier: str  # free, premium, enterprise, elite
    status: str = "active"  # active, cancelled, expired
    monthly_price: float = 0.0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    features: Optional[list[str]] = Field(default_factory=list)
    created_date: datetime = Field(default_factory=datetime.utcnow)

class StreamSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subscriber_email: EmailStr
    subscriber_name: str
    streamer_email: EmailStr
    streamer_name: str
    tier: str  # basic, premium, vip
    monthly_price: float
    status: str = "active"
    created_date: datetime = Field(default_factory=datetime.utcnow)