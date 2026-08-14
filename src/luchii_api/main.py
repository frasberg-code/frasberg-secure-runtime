import logging
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from luchii import LuchiiModel
from luchii_api.config import settings
from luchii_api.models import (
    ApiKeyRequest,
    ApiKeyResponse,
    AssistRepRequest,
    AssistRepResponse,
    CoachNextLineRequest,
    CoachNextLineResponse,
    HealthResponse,
    LeadRouteRequest,
    LeadRouteResponse,
    MarketScanResponse,
    MarketSignalRequest,
    MarketSignalResponse,
    ModelTokenRequest,
    ModelTokenResponse,
    MemoryRecord,
    MemoryRemoveRequest,
    MemoryRemoveResponse,
    MemoryRetrieveRequest,
    MemoryRetrieveResponse,
    MemoryStoreRequest,
    MemoryStoreResponse,
    SkinPersonaRequest,
    SkinPersonaResponse,
    now_utc,
)
from utils.helpers import generate_api_key

logger = logging.getLogger("luchii_api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
engine = LuchiiModel.load(settings.default_model_name, model_source=settings.model_source)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url=settings.docs_url,
    redoc_url=settings.redoc_url,
    openapi_url=settings.openapi_url,
    description=(
        "Production-ready scaffold for Luchii endpoints across market, lead, coach, memory, "
        "assist, and skin domains."
    ),
)

app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_memory_store: dict[str, MemoryRecord] = {}


@app.middleware("http")
async def request_id_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


@app.get("/healthz", response_model=HealthResponse, tags=["system"])
def healthz() -> HealthResponse:
    return HealthResponse(
        service=settings.app_name,
        version=settings.app_version,
        timestamp=now_utc(),
    )


@app.post(f"{settings.api_prefix}/model/token", response_model=ModelTokenResponse, tags=["model"])
def model_token(body: ModelTokenRequest) -> ModelTokenResponse:
    active_engine = LuchiiModel.load(
        body.model_name,
        model_source=settings.model_source,
    )
    token_data = active_engine.issue_model_token(body.model_name)
    return ModelTokenResponse(
        token=token_data["token"],
        model_name=token_data["model_name"],
        backend=token_data["backend"],
        issued_at=now_utc(),
    )


@app.post(f"{settings.api_prefix}/keys/api", response_model=ApiKeyResponse, tags=["security"])
def create_api_key(body: ApiKeyRequest) -> ApiKeyResponse:
    return ApiKeyResponse(
        api_key=generate_api_key(),
        label=body.label,
        issued_at=now_utc(),
    )


@app.get(f"{settings.api_prefix}/market/scan", response_model=MarketScanResponse, tags=["market"])
def market_scan(symbol: str, timeframe: str = "1h") -> MarketScanResponse:
    analysis = engine.analyze_market(
        symbol=symbol,
        timeframe=timeframe,
        risk_profile="balanced",
    )
    return MarketScanResponse(
        symbol=analysis["symbol"],
        timeframe=analysis["timeframe"],
        trend=analysis["trend"],
        confidence=analysis["confidence"],
        timestamp=now_utc(),
    )


@app.post(
    f"{settings.api_prefix}/market/signal",
    response_model=MarketSignalResponse,
    tags=["market"],
)
def market_signal(body: MarketSignalRequest) -> MarketSignalResponse:
    analysis = engine.analyze_market(
        symbol=body.symbol,
        timeframe=body.timeframe,
        risk_profile=body.risk_profile.value,
    )
    return MarketSignalResponse(
        symbol=analysis["symbol"],
        timeframe=analysis["timeframe"],
        risk_profile=body.risk_profile,
        signal=analysis["signal"],
        confidence=analysis["confidence"],
        rationale=analysis["rationale"],
        timestamp=now_utc(),
    )


@app.post(f"{settings.api_prefix}/lead/route", response_model=LeadRouteResponse, tags=["lead"])
def lead_route(body: LeadRouteRequest) -> LeadRouteResponse:
    routing = engine.route_lead(body.lead_id, body.pressure)
    return LeadRouteResponse(
        lead_id=routing["lead_id"],
        destination=routing["destination"],
        queue=routing["queue"],
        priority=routing["priority"],
        timestamp=now_utc(),
    )


@app.post(
    f"{settings.api_prefix}/coach/nextline",
    response_model=CoachNextLineResponse,
    tags=["coach"],
)
def coach_nextline(body: CoachNextLineRequest) -> CoachNextLineResponse:
    coaching = engine.coach_next_line(body.context, body.persona)
    return CoachNextLineResponse(
        persona=coaching["persona"],
        line=coaching["line"],
        confidence=coaching["confidence"],
        timestamp=now_utc(),
    )


@app.post(
    f"{settings.api_prefix}/memory/store",
    response_model=MemoryStoreResponse,
    tags=["memory"],
)
def memory_store(body: MemoryStoreRequest) -> MemoryStoreResponse:
    memory_id = f"mem_{uuid.uuid4().hex[:12]}"
    _memory_store[memory_id] = MemoryRecord(
        memory_id=memory_id,
        memory_type=body.memory_type,
        content=body.content,
        tags=body.tags,
        timestamp=now_utc(),
    )
    return MemoryStoreResponse(
        memory_id=memory_id,
        stored=True,
        timestamp=now_utc(),
    )


@app.post(
    f"{settings.api_prefix}/memory/retrieve",
    response_model=MemoryRetrieveResponse,
    tags=["memory"],
)
def memory_retrieve(body: MemoryRetrieveRequest) -> MemoryRetrieveResponse:
    records = list(_memory_store.values())
    if body.tags:
        records = [record for record in records if set(body.tags).intersection(record.tags)]

    items = [record.model_dump() for record in records[: body.limit]]
    return MemoryRetrieveResponse(items=items, count=len(items))


@app.post(
    f"{settings.api_prefix}/memory/remove",
    response_model=MemoryRemoveResponse,
    tags=["memory"],
)
def memory_remove(body: MemoryRemoveRequest) -> MemoryRemoveResponse:
    removed = _memory_store.pop(body.memory_id, None) is not None
    return MemoryRemoveResponse(memory_id=body.memory_id, removed=removed)


@app.post(f"{settings.api_prefix}/assist/rep", response_model=AssistRepResponse, tags=["assist"])
def assist_rep(body: AssistRepRequest) -> AssistRepResponse:
    response = engine.assist_rep(body.intent, body.context)
    return AssistRepResponse(
        message=response["message"],
        tone=response["tone"],
        timestamp=now_utc(),
    )


@app.post(f"{settings.api_prefix}/skin/persona", response_model=SkinPersonaResponse, tags=["skin"])
def skin_persona(body: SkinPersonaRequest) -> SkinPersonaResponse:
    response = engine.update_persona(body.persona_id, body.traits)
    return SkinPersonaResponse(
        persona_id=response["persona_id"],
        updated=response["updated"],
        timestamp=now_utc(),
    )
