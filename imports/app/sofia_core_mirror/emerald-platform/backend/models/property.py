from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class Property(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    address: str
    city: str
    state: str
    zip_code: str
    property_type: str  # residential, commercial, land
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[int] = None
    price: Optional[float] = None
    status: str = "available"  # available, pending, sold
    description: Optional[str] = None
    images: Optional[list[str]] = Field(default_factory=list)
    created_date: datetime = Field(default_factory=datetime.utcnow)

class PropertyValuation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    property_id: str
    valuation_amount: float
    valuation_date: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float  # 0-100
    methodology: Optional[str] = None
    comparables: Optional[list[dict]] = Field(default_factory=list)
    created_by: EmailStr