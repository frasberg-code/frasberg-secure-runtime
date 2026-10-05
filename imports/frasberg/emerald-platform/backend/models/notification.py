from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: EmailStr
    title: str
    message: str
    type: str  # info, warning, success, error
    read: bool = False
    action_url: Optional[str] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)