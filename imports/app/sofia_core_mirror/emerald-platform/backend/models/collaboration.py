from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid

class Workspace(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # code, legal, research
    description: Optional[str] = None
    owner_email: EmailStr
    members: list[dict] = Field(default_factory=list)  # [{email, name, role}]
    created_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"

class WorkspaceMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    user_email: EmailStr
    user_name: str
    message: str
    message_type: str = "text"  # text, file, code
    created_date: datetime = Field(default_factory=datetime.utcnow)