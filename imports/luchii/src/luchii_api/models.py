from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RiskProfile(str, Enum):
    low = "low"
    balanced = "balanced"
    high = "high"


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str
    version: str
    timestamp: datetime


class ModelTokenRequest(BaseModel):
    model_name: str = Field(min_length=1)


class ModelTokenResponse(BaseModel):
    token: str
    model_name: str
    backend: str
    issued_at: datetime


class ApiKeyRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1)


class ApiKeyResponse(BaseModel):
    api_key: str
    label: str | None = None
    issued_at: datetime


class MarketScanResponse(BaseModel):
    symbol: str
    timeframe: str
    trend: str
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: datetime


class MarketSignalRequest(BaseModel):
    symbol: str = Field(min_length=3)
    timeframe: str = Field(min_length=1)
    risk_profile: RiskProfile = RiskProfile.balanced


class MarketSignalResponse(BaseModel):
    symbol: str
    timeframe: str
    risk_profile: RiskProfile
    signal: str
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str
    timestamp: datetime


class LeadRouteRequest(BaseModel):
    lead_id: str = Field(min_length=1)
    pressure: float = Field(ge=0.0, le=1.0)


class LeadRouteResponse(BaseModel):
    lead_id: str
    destination: str
    queue: str
    priority: str
    timestamp: datetime


class CoachNextLineRequest(BaseModel):
    context: str = Field(min_length=1)
    persona: str = Field(min_length=1)


class CoachNextLineResponse(BaseModel):
    persona: str
    line: str
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: datetime


class MemoryStoreRequest(BaseModel):
    memory_type: str = Field(min_length=1)
    content: dict[str, Any]
    tags: list[str] = []


class MemoryStoreResponse(BaseModel):
    memory_id: str
    stored: bool
    timestamp: datetime


class MemoryRetrieveRequest(BaseModel):
    tags: list[str] = []
    limit: int = Field(default=10, ge=1, le=100)


class MemoryRetrieveResponse(BaseModel):
    items: list[dict[str, Any]]
    count: int


class MemoryRemoveRequest(BaseModel):
    memory_id: str = Field(min_length=1)


class MemoryRemoveResponse(BaseModel):
    memory_id: str
    removed: bool


class AssistRepRequest(BaseModel):
    intent: str = Field(min_length=1)
    context: str = Field(min_length=1)


class AssistRepResponse(BaseModel):
    message: str
    tone: str
    timestamp: datetime


class SkinPersonaRequest(BaseModel):
    persona_id: str = Field(min_length=1)
    traits: dict[str, Any]


class SkinPersonaResponse(BaseModel):
    persona_id: str
    updated: bool
    timestamp: datetime


class MemoryRecord(BaseModel):
    memory_id: str
    memory_type: str
    content: dict[str, Any]
    tags: list[str]
    timestamp: datetime


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
