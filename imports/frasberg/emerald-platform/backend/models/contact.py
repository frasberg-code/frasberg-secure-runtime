from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: EmailStr
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    role: Optional[str] = None  # client, agent, investor, vendor, other
    notes: Optional[str] = None
    tags: Optional[list[str]] = Field(default_factory=list)
    created_date: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_email": "user@example.com",
                "name": "Jane Smith",
                "phone": "+1234567890",
                "role": "client"
            }
        }