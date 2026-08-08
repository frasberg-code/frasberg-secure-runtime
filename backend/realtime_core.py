import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger("realtime_core")
router = APIRouter()

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

LIVEKIT_URL = os.environ.get("LIVEKIT_URL", "")
LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


def _now():
    return datetime.now(timezone.utc).isoformat()


class TokenBody(BaseModel):
    identity: str
    room: str
    role: str  # host | viewer | agent


@router.post("/livekit/token")
async def livekit_token(body: TokenBody):
    if body.role not in ("host", "viewer", "agent"):
        raise HTTPException(status_code=400, detail="role must be host, viewer or agent")
    if not (LIVEKIT_API_KEY and LIVEKIT_API_SECRET and LIVEKIT_URL):
        return {"token": f"LK_DEV_{body.identity}_{body.room}_{body.role}_{uuid.uuid4().hex[:8]}",
                "expiresIn": 900, "host": LIVEKIT_URL or "wss://dev.livekit.local", "mocked": True}
    from livekit import api as lk
    can_publish = body.role in ("host", "agent")
    grants = lk.VideoGrants(room_join=True, room=body.room,
                            can_publish=can_publish, can_subscribe=True,
                            can_publish_data=True)
    token = (lk.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
             .with_identity(body.identity).with_name(body.identity)
             .with_ttl(timedelta(seconds=900)).with_grants(grants).to_jwt())
    return {"token": token, "expiresIn": 900, "host": LIVEKIT_URL}


class RoomLiveBody(BaseModel):
    roomId: str
    hostId: str


@router.post("/rooms/live")
async def mark_room_live(body: RoomLiveBody):
    await db.linq_rooms.update_one(
        {"roomId": body.roomId},
        {"$set": {"roomId": body.roomId, "hostId": body.hostId, "status": "live",
                  "startedAt": _now(), "endedAt": None},
         "$setOnInsert": {"viewerCount": 0}},
        upsert=True)
    return {"ok": True}


@router.get("/rooms/live")
async def get_live_rooms():
    rooms = await db.linq_rooms.find({"status": "live"}, {"_id": 0}).to_list(100)
    return rooms


class RoomEndBody(BaseModel):
    roomId: str


@router.post("/rooms/end")
async def end_room(body: RoomEndBody):
    await db.linq_rooms.update_one({"roomId": body.roomId},
                                   {"$set": {"status": "ended", "endedAt": _now()}})
    return {"ok": True}


class RoomEventBody(BaseModel):
    roomId: str
    type: str
    identity: str
    payload: dict = {}
    timestamp: Optional[str] = None


@router.post("/rooms/events")
async def ingest_event(body: RoomEventBody):
    doc = {"id": str(uuid.uuid4()), "roomId": body.roomId, "type": body.type,
           "identity": body.identity, "payload": body.payload,
           "timestamp": body.timestamp or _now()}
    await db.linq_events.insert_one(dict(doc))
    if body.type == "viewer_joined":
        await db.linq_rooms.update_one({"roomId": body.roomId}, {"$inc": {"viewerCount": 1}})
    return {"ok": True, "id": doc["id"]}


class TipBody(BaseModel):
    roomId: str
    from_: str = None
    amount: float

    class Config:
        fields = {"from_": "from"}


@router.post("/rooms/tip")
async def send_tip(body: dict):
    room_id, sender, amount = body.get("roomId"), body.get("from"), body.get("amount")
    if not room_id or not sender or amount is None:
        raise HTTPException(status_code=400, detail="roomId, from, amount required")
    doc = {"id": str(uuid.uuid4()), "roomId": room_id, "type": "tip",
           "identity": sender, "payload": {"amount": amount}, "timestamp": _now()}
    await db.linq_events.insert_one(dict(doc))
    return {"ok": True}


class SummaryBody(BaseModel):
    roomId: str
    hostId: str
    summary: dict
    generatedAt: Optional[str] = None


@router.post("/rooms/summary")
async def ingest_summary(body: SummaryBody):
    doc = {"id": str(uuid.uuid4()), "roomId": body.roomId, "hostId": body.hostId,
           "summary": body.summary, "generatedAt": body.generatedAt or _now()}
    await db.linq_summaries.insert_one(dict(doc))
    return {"ok": True}


@router.get("/rooms/{room_id}")
async def get_room(room_id: str):
    room = await db.linq_rooms.find_one({"roomId": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


class AgentActionBody(BaseModel):
    roomId: str
    action: str
    details: dict = {}

    class Config:
        extra = "allow"


ENGINE_LABELS = {"threat": "🔮 Threat Graph", "billing": "⚡ Billing Intelligence", "compliance": "🧠 Compliance Copilot"}


def _detect_engine(text: str):
    t = text.lower()
    engine = None
    if "threat" in t:
        engine = "threat"
    elif any(k in t for k in ("billing", "revenue", "economic")):
        engine = "billing"
    elif any(k in t for k in ("compliance", "regulat", "governance")):
        engine = "compliance"
    if not engine:
        return None
    verbs = ("run", "scan", "pull", "show", "check", "report", "analyz", "analys", "latest", "status", "data", "give")
    return engine if any(v in t for v in verbs) else None


async def _run_agent_engine(engine: str, room_id: str, sender: str):
    import linq_governance
    artifact = await linq_governance.run_engine_core(engine, f"luchii-live:{sender}")
    recs = artifact.get("recommendations") or []
    reply = (f"{ENGINE_LABELS[engine]} scan complete — {artifact.get('tag', 'artifact')} "
             f"(score {artifact.get('score', '?')}/100). {artifact.get('narrative', '')}"
             + (f" Top recommendation: {recs[0]}" if recs else ""))
    lite = {"engine": engine, "tag": artifact.get("tag"), "score": artifact.get("score"),
            "narrative": artifact.get("narrative"), "recommendations": recs[:3], "id": artifact.get("id")}
    await db.linq_events.insert_one({"id": str(uuid.uuid4()), "roomId": room_id,
                                     "type": "agent_action", "identity": "luchii",
                                     "payload": {"reply": reply, "engine": engine, "artifact": lite},
                                     "timestamp": _now()})
    return reply, lite


@router.post("/agents/luchii/actions")
async def luchii_action(body: dict):
    room_id, action, sender = body.get("roomId"), body.get("action"), body.get("from")
    if not room_id or not action or not sender:
        raise HTTPException(status_code=400, detail="roomId, action, from required")
    details = body.get("details") or {}
    doc = {"id": str(uuid.uuid4()), "roomId": room_id, "action": action,
           "from": sender, "details": details, "timestamp": _now()}
    await db.linq_agent_actions.insert_one(dict(doc))
    reply = None
    if action == "run_engine" and details.get("engine") in ENGINE_LABELS:
        try:
            reply, artifact = await _run_agent_engine(details["engine"], room_id, sender)
            return {"ok": True, "reply": reply, "artifact": artifact}
        except Exception:
            logger.exception("agent engine run failed")
            return {"ok": False, "reply": "Engine run failed — try again in a moment.", "artifact": None}
    if action in ("viewer_question", "question", "cli_message") and details.get("text"):
        engine = _detect_engine(details["text"])
        if engine:
            try:
                reply, artifact = await _run_agent_engine(engine, room_id, sender)
                return {"ok": True, "reply": reply, "artifact": artifact}
            except Exception:
                logger.exception("agent engine run failed")
    if action in ("viewer_question", "question", "cli_message") and details.get("text"):
        try:
            llm = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"luchii-{room_id}",
                          system_message="You are Luchii, the Frasberg AI agent inside a LINQ live room. LINQ is Frasberg's streaming and workspace platform (NOT the .NET query language). You help hosts and viewers with the show, the platform, scheduling and questions. Reply in 1-3 short sentences, friendly and helpful.")
            llm = llm.with_model("anthropic", "claude-sonnet-4-6")
            resp = await llm.send_message(UserMessage(text=details["text"]))
            reply = resp if isinstance(resp, str) else getattr(resp, "content", str(resp))
            await db.linq_events.insert_one({"id": str(uuid.uuid4()), "roomId": room_id,
                                             "type": "agent_action", "identity": "luchii",
                                             "payload": {"reply": reply}, "timestamp": _now()})
        except Exception:
            logger.exception("luchii reply failed")
    return {"ok": True, "reply": reply}


class LeadBody(BaseModel):
    roomId: str
    viewerId: str
    hostId: str
    intent: str = "private_session"
    contact: str = ""


@router.post("/leads")
async def capture_lead(body: LeadBody):
    doc = {"id": str(uuid.uuid4()), **body.dict(), "createdAt": _now()}
    await db.linq_leads.insert_one(dict(doc))
    return {"ok": True, "id": doc["id"]}


@router.get("/preview/state")
async def preview_state():
    rooms = await db.linq_rooms.find({}, {"_id": 0}).sort("startedAt", -1).to_list(20)
    events = await db.linq_events.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    summaries = await db.linq_summaries.find({}, {"_id": 0}).sort("generatedAt", -1).to_list(10)
    actions = await db.linq_agent_actions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    return {"rooms": rooms, "events": events, "summaries": summaries, "agentActions": actions}
