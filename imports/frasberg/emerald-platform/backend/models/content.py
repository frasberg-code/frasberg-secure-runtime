from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class UserSong(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: EmailStr
    title: str
    artist: str
    audio_url: Optional[str] = None
    genre: Optional[str] = None
    bpm: Optional[int] = None
    key: Optional[str] = None
    tags: Optional[list[str]] = Field(default_factory=list)
    for_sale: bool = False
    price_usd: Optional[float] = 0.0
    license_type: Optional[str] = "non_exclusive"
    plays: int = 0
    likes: int = 0
    downloads: int = 0
    created_date: datetime = Field(default_factory=datetime.utcnow)

class ContentItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: EmailStr
    type: str  # article, video, image, document
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    status: str = "draft"  # draft, published, archived
    tags: Optional[list[str]] = Field(default_factory=list)
    created_date: datetime = Field(default_factory=datetime.utcnow)
    published_date: Optional[datetime] = None