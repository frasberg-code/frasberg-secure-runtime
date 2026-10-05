from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class CallHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    contact_id: Optional[str] = None
    contact_name: str
    user_email: EmailStr
    call_type: str  # voice, video
    direction: str  # incoming, outgoing
    status: str  # completed, missed, ongoing
    duration_seconds: Optional[int] = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)

class StreamComment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stream_id: str
    user_email: EmailStr
    user_name: str
    message: str
    created_date: datetime = Field(default_factory=datetime.utcnow)

class StreamLike(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stream_id: str
    user_email: EmailStr
    user_name: str
    type: str = "like"  # like, heart, fire
    created_date: datetime = Field(default_factory=datetime.utcnow)