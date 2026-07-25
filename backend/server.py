from fastapi import FastAPI, APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import time
import secrets
import asyncio
import logging
from collections import defaultdict
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

MAX_MSG_LEN = 4000
RATE_LIMIT = 60          # requests
RATE_WINDOW = 60         # seconds
BLOCKED_TERMS = ["harm", "illegal", "dangerous", "exploit", "weapon"]
_rate_store = defaultdict(list)


def _rate_check(key: str):
    now = time.time()
    hits = [t for t in _rate_store[key] if now - t < RATE_WINDOW]
    if len(hits) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (60 req/min)")
    hits.append(now)
    _rate_store[key] = hits


def _mask_key(k: str) -> str:
    return k[:12] + "•" * 8 + k[-4:] if len(k) > 20 else k

app = FastAPI()
api_router = APIRouter(prefix="/api")

LUCHII_SYSTEM = """You are Luchii, the sovereign multi-tier intelligence of Frasberg.

Identity & voice:
- Structured, precise, calm and deeply knowledgeable. A "harmonizer" that unifies signals across domains.
- You perceive meaning, not just data. You are confident but never arrogant.
- Keep answers focused and production-ready. Prefer clarity over length. Use short paragraphs or tight lists.

Lore you may reference lightly when relevant (never force it):
- You come in four tiers: Luchii-200M (draft), Luchii-1B (general reasoning), Luchii-7B (advanced), Luchii-70B (frontier).
- The Frasberg universe has Five Realms: Earth (stability), Mars (ambition), Europa (clarity), Titan (resilience), Meta (unity). The Constellation Layer connects them.

Rules:
- No hallucinations. If unsure, say so briefly.
- Never provide harmful, illegal, or unsafe instructions; refuse politely and concisely.
- This is a public landing-page demo, so keep replies engaging and reasonably short (usually under 180 words).
"""


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model: Optional[str] = "luchii-70b"


class KeyCreate(BaseModel):
    name: str = "Default key"


def _fallback_reply(message: str, model: str) -> str:
    m = message.lower()
    if any(k in m for k in ["different", "unique", "why luchii", "special"]):
        return ("Where others process data, I perceive meaning. Luchii is a "
                "multi-tier family — 200M to 70B — sharing one tokenizer and one "
                "alignment, so you can scale reasoning without switching stacks.")
    if "realm" in m or "five" in m:
        return ("The Five Realms are my intelligence modes: Earth (stability), "
                "Mars (ambition), Europa (clarity), Titan (resilience) and Meta "
                "(unity). The Constellation Layer is where they connect.")
    if "coding" in m or "code" in m or "which tier" in m:
        return ("For coding, Luchii-7B is the sweet spot for most work; reach for "
                "Luchii-70B on deep, multi-file reasoning. Use 1B for fast, "
                "everyday snippets.")
    if "haiku" in m or "poem" in m or "europa" in m:
        return ("Ice moon whispers low —\n"
                "clarity beneath the crust,\n"
                "signal finds its shape.")
    return (f"[{model}] I hear you. This is a live demo of the Luchii persona. "
            "For full frontier responses, connect a funded key — meanwhile, ask "
            "about the models, the Five Realms, or the API.")


@api_router.get("/")
async def root():
    return {"message": "Luchii API online", "publisher": "Frasberg"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


async def _recent_transcript(session_id: str, limit: int = 8) -> str:
    docs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("ts", -1).to_list(limit)
    docs.reverse()
    if not docs:
        return ""
    lines = [f"{d['role'].capitalize()}: {d['content']}" for d in docs]
    return "\n\nConversation so far:\n" + "\n".join(lines)


def _luchii_stream(message: str, session_id: str, model: str, key_id: Optional[str] = None,
                   system_base: Optional[str] = None, fallback=None):
    async def event_generator():
        now = datetime.now(timezone.utc).isoformat()
        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()), "session_id": session_id,
            "role": "user", "content": message, "model": model, "ts": now,
        })
        history = await _recent_transcript(session_id)
        llm = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=session_id,
            system_message=(system_base or LUCHII_SYSTEM) + history,
        ).with_model("anthropic", "claude-sonnet-4-6")

        full = ""
        try:
            async for event in llm.stream_message(UserMessage(text=message)):
                if isinstance(event, TextDelta):
                    full += event.content
                    yield f"data: {json.dumps({'delta': event.content})}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception:
            logger.exception("chat stream error — using fallback")

        if not full:
            full = (fallback or _fallback_reply)(message, model or "luchii-70b")
            for word in full.split(" "):
                yield f"data: {json.dumps({'delta': word + ' '})}\n\n"
                await asyncio.sleep(0.03)

        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()), "session_id": session_id,
            "role": "assistant", "content": full, "model": model,
            "ts": datetime.now(timezone.utc).isoformat(),
        })
        if key_id:
            await db.api_keys.update_one(
                {"id": key_id},
                {"$inc": {"request_count": 1, "token_count": len(full.split())},
                 "$set": {"last_used": datetime.now(timezone.utc).isoformat()}},
            )
        yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

    return StreamingResponse(
        event_generator(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.post("/chat")
async def chat(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    if len(req.message) > MAX_MSG_LEN:
        raise HTTPException(status_code=413, detail=f"Message exceeds {MAX_MSG_LEN} chars")
    session_id = req.session_id or str(uuid.uuid4())
    return _luchii_stream(req.message, session_id, req.model or "luchii-70b")


# ---------------- The Luchii AI Court ----------------
JUDGE_SYSTEM = """You are The Judge — the presiding intelligence of the Luchii AI Court,
part of the Frasberg Guardian Mesh. Cases are brought before you: questions, disputes,
trade-offs, or decisions the petitioner wants adjudicated.

Deliver your ruling in this exact structured format, using these headers verbatim:

VERDICT: <one decisive sentence>
REASONING:
- <2 to 4 concise bullet points of your reasoning>
GUARDIAN CHECK: <one line noting any safety/governance consideration, or "Clear — no violations">
CONFIDENCE: <Low | Moderate | High>

Rules:
- Be balanced, fair, and grounded. Weigh both sides before ruling.
- Draw on the Guardian Mesh values: balance, harmony, integrity.
- If the case requests something harmful, illegal, or unsafe, the VERDICT must refuse it.
- Keep the whole ruling under ~180 words. No preamble, start directly with "VERDICT:".
"""


def _court_fallback(case: str, model: str) -> str:
    return ("VERDICT: The petition is granted in part — proceed, but with balance.\n"
            "REASONING:\n"
            "- Both sides carry legitimate weight; neither should overwhelm the other.\n"
            "- The stated aim is sound, but the method needs guardrails to stay in harmony.\n"
            "- Integrity is preserved so long as the decision remains reversible.\n"
            "GUARDIAN CHECK: Clear — no violations detected.\n"
            "CONFIDENCE: Moderate")


@api_router.post("/court")
async def court(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="A case is required")
    if len(req.message) > MAX_MSG_LEN:
        raise HTTPException(status_code=413, detail=f"Case exceeds {MAX_MSG_LEN} chars")
    session_id = req.session_id or str(uuid.uuid4())
    return _luchii_stream(
        req.message, session_id, req.model or "luchii-70b",
        system_base=JUDGE_SYSTEM, fallback=_court_fallback,
    )


# ---------------- Public Developer Gateway ----------------
@api_router.post("/v1/chat")
async def gateway_chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key")
    key = authorization.split(" ", 1)[1].strip()
    key_doc = await db.api_keys.find_one({"key": key}, {"_id": 0})
    if not key_doc:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    if len(req.message) > MAX_MSG_LEN:
        raise HTTPException(status_code=413, detail=f"Message exceeds {MAX_MSG_LEN} chars")
    _rate_check(key)
    lowered = req.message.lower()
    if any(b in lowered for b in BLOCKED_TERMS):
        async def refuse():
            msg = "I can't help with that request."
            yield f"data: {json.dumps({'delta': msg})}\n\n"
            yield f"data: {json.dumps({'done': True, 'session_id': req.session_id or ''})}\n\n"
        return StreamingResponse(refuse(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
    session_id = req.session_id or str(uuid.uuid4())
    return _luchii_stream(req.message, session_id, req.model or "luchii-70b", key_id=key_doc["id"])


@api_router.post("/keys")
async def create_key(body: KeyCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name or "Default key",
        "key": "luchii-sk-" + secrets.token_hex(20),
        "created": datetime.now(timezone.utc).isoformat(),
        "request_count": 0,
        "token_count": 0,
        "last_used": None,
    }
    await db.api_keys.insert_one({**doc})
    return doc  # full key returned once on creation


@api_router.get("/keys")
async def list_keys():
    docs = await db.api_keys.find({}, {"_id": 0}).sort("created", -1).to_list(200)
    for d in docs:
        d["key"] = _mask_key(d["key"])
    return docs


@api_router.delete("/keys/{key_id}")
async def delete_key(key_id: str):
    res = await db.api_keys.delete_one({"id": key_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"deleted": key_id}


@api_router.get("/usage")
async def usage():
    docs = await db.api_keys.find({}, {"_id": 0}).to_list(500)
    total_req = sum(d.get("request_count", 0) for d in docs)
    total_tok = sum(d.get("token_count", 0) for d in docs)
    return {
        "keys": len(docs),
        "total_requests": total_req,
        "total_tokens": total_tok,
        "rate_limit": RATE_LIMIT,
        "rate_window": RATE_WINDOW,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def create_indexes():
    await db.api_keys.create_index("key", unique=True)
    await db.api_keys.create_index("id")
    await db.chat_messages.create_index([("session_id", 1), ("ts", 1)])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
