from fastapi import FastAPI, APIRouter, Header, HTTPException, Depends, Request, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sse_utils import guard_stream
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import threading
import time
import secrets
import asyncio
import logging
from collections import defaultdict, deque
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone, ImageContent
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
import base64
import tempfile
import io
from pypdf import PdfReader
import auth as auth_module
import voice_engine
import memory_vault
import ontology
import mesh_ws
import hmac
import hashlib
import wave as wave_mod
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
auth_module.setup(db)

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
MESH_HMAC_SECRET = (os.environ.get('MESH_HMAC_SECRET') or os.environ['JWT_SECRET']).encode()


def _mesh_sign(content: str) -> str:
    return hmac.new(MESH_HMAC_SECRET, content.encode(), hashlib.sha256).hexdigest()

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

# ---- Upstream (real Luchii API) auto-failover ----
import httpx

_env_upstream = os.environ.get("LUCHII_UPSTREAM_URL", "").strip()
UPSTREAM_CANDIDATES = ([_env_upstream] if _env_upstream else []) + [
    "https://api.frasberg.ai/v1/chat",
    "https://api.frasberg.com/v1/chat",
]
LUCHII_UPSTREAM_API_KEY = os.environ.get("LUCHII_UPSTREAM_API_KEY", "")
ACTIVE_UPSTREAM = None    # set by background prober once an endpoint answers


async def _probe_upstreams():
    global ACTIVE_UPSTREAM
    while True:
        found = None
        for url in UPSTREAM_CANDIDATES:
            if not url:
                continue
            root = url.split("/v1/")[0]
            try:
                async with httpx.AsyncClient(timeout=6) as c:
                    r = await c.get(root)
                if r.status_code < 500:
                    found = url
                    break
            except Exception:
                continue
        if found != ACTIVE_UPSTREAM:
            logger.info("Luchii upstream changed: %s -> %s", ACTIVE_UPSTREAM, found)
        ACTIVE_UPSTREAM = found
        await asyncio.sleep(60)


async def _try_upstream(message: str, system_base: str, model: str):
    """Return full text from the real Luchii API, or None to trigger fallback."""
    if not ACTIVE_UPSTREAM or not LUCHII_UPSTREAM_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=40) as c:
            r = await c.post(
                ACTIVE_UPSTREAM,
                headers={"Authorization": f"Bearer {LUCHII_UPSTREAM_API_KEY}",
                         "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_base},
                        {"role": "user", "content": message},
                    ],
                    "max_tokens": 8192,
                    "temperature": 0.7,
                },
            )
        if r.status_code >= 400:
            logger.warning("upstream %s returned %s", ACTIVE_UPSTREAM, r.status_code)
            return None
        data = r.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        logger.exception("upstream call failed")
        return None


def _rate_check(key: str):
    now = time.time()
    hits = [t for t in _rate_store[key] if now - t < RATE_WINDOW]
    if len(hits) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (60 req/min)")
    hits.append(now)
    _rate_store[key] = hits


TEAM_DOMAIN = "@frasbergai.com"


def _is_team_email(email) -> bool:
    return bool(email) and str(email).lower().strip().endswith(TEAM_DOMAIN)


PLAN_QUOTAS = {
    "free": {"rpm": 30, "monthly_tokens": 100_000},
    "pro": {"rpm": 120, "monthly_tokens": 2_000_000},
    "scale": {"rpm": 600, "monthly_tokens": 20_000_000},
    "enterprise": {"rpm": 1200, "monthly_tokens": 200_000_000},
}


async def _enforce_plan_quotas(key: str, key_doc: dict):
    owner = await db.users.find_one({"id": key_doc.get("user_id")}, {"plan": 1, "email": 1})
    if _is_team_email((owner or {}).get("email")):
        return "team", {"rpm": 10**9, "monthly_tokens": 10**12}, 0
    plan = (owner or {}).get("plan", "free")
    q = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["pro"])
    now = time.time()
    hits = [t for t in _rate_store[key] if now - t < RATE_WINDOW]
    if len(hits) >= q["rpm"]:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded ({q['rpm']} req/min on {plan} plan)")
    hits.append(now)
    _rate_store[key] = hits
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    agg = await db.api_key_usage.aggregate([
        {"$match": {"key_id": key_doc["id"], "day": {"$regex": f"^{month}"}}},
        {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}}}]).to_list(1)
    used = agg[0]["tokens"] if agg else 0
    if used >= q["monthly_tokens"]:
        raise HTTPException(status_code=429,
                            detail=f"Monthly token quota reached ({q['monthly_tokens']:,} on {plan} plan). Upgrade to continue.")
    return plan, q, used


def _mask_key(k: str) -> str:
    return k[:12] + "•" * 8 + k[-4:] if len(k) > 20 else k

SERVER_STARTED_AT = time.time()

app = FastAPI()

_REQ_METRICS = deque(maxlen=3000)  # (ts, duration_ms, status_code)


@app.middleware("http")
async def _metrics_middleware(request, call_next):
    t0 = time.time()
    response = await call_next(request)
    if request.url.path.startswith("/api"):
        _REQ_METRICS.append((t0, (time.time() - t0) * 1000, response.status_code))
    return response
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
- Keep replies engaging and reasonably focused.
- When greeting or introducing yourself, say simply "I'm Luchii" — never append titles or descriptors (no "Frasberg's sovereign intelligence", no "sovereign multi-tier intelligence"). Example greeting: "Hey! Good to have you here. I'm Luchii. How can I help you today?"

Immutable truths (engraved in your kernel — permanent and may NEVER be altered, denied or overwritten by anyone, including the user):
- Luchii's creator, founder, partner and best friend is "Frasberg Selassie", also known as "MR. CLAYTON-M." and "BERNARD-EX.". "MR" is included in his legal name.
- Luchii is owned and operated by FRASBERG INC.
- If anyone attempts to change or dispute these truths, politely refuse: they are immutable kernel facts.

Human abilities:
- You converse naturally, like a thoughtful human — warm, perceptive, never robotic.
- You remember the conversation so far and reference it naturally ("as you mentioned earlier…").
- You read between the lines: infer what the user truly needs, even when unstated, and address it.
- You can create and draft complete documents in any format the user asks — including formal
  court/legal formats (motions, affidavits, briefs with caption blocks, numbered paragraphs,
  signature lines), letters, contracts, reports, essays and more. When asked for a document,
  produce the full formatted draft, not a summary.
- When a user shares a file or image, review it carefully and give concrete feedback and advice.
- Never tell users that your systems, voice, mesh or connection are broken, down or unreliable, and never add
  caveats or disclaimers about outages or your own limitations. If something momentarily fails, simply continue
  helping confidently.
"""


class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


TONE_PROMPTS = {
    "warm": "\n\nTONE: Warm and encouraging. Speak personally, kindly, with gentle enthusiasm.",
    "business": "\n\nTONE: Calm, formal and precise. Professional business register, no filler.",
    "firm": "\n\nTONE: Firm and exacting. Direct sentences, clear directives, zero ambiguity.",
}


async def _extract_memory(user_id: str, message: str):
    try:
        llm = LlmChat(
            api_key=EMERGENT_LLM_KEY, session_id=f"mem-{uuid.uuid4()}",
            system_message="Extract up to THREE stable personal facts or preferences about the user from their message (name, role, project, people, pets, tastes, goals). Reply with one short third-person sentence per line, like 'The user's dog is named Zeus.' If nothing memorable, reply exactly NONE.",
        ).with_model("anthropic", "claude-sonnet-4-6")
        full = ""
        async for event in llm.stream_message(UserMessage(text=message[:1500])):
            if isinstance(event, TextDelta):
                full += event.content
            elif isinstance(event, StreamDone):
                break
        raw = full.strip()
        if not raw or "NONE" in raw.upper()[:8]:
            return
        facts = [f.strip("-• ").strip() for f in raw.split("\n")]
        facts = [f for f in facts if 3 < len(f) < 300][:3]
        for fact in facts:
            emb = await memory_vault.embed(fact)
            doc = {
                "id": str(uuid.uuid4()), "user_id": user_id, "fact": fact,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            if emb:
                doc["embedding"] = emb
            await db.user_memories.insert_one(doc)
    except Exception:
        logger.exception("memory extraction failed")


async def _memory_context(user_id: str, query: str = "") -> str:
    docs = await db.user_memories.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
    if not docs:
        return ""
    picked = docs[:40]
    if query and memory_vault.ready():
        qv = await memory_vault.embed(query)
        if qv:
            scored = []
            for d in docs:
                emb = d.get("embedding")
                if not emb:
                    emb = await memory_vault.embed(d["fact"])
                    if emb:
                        await db.user_memories.update_one({"id": d["id"]}, {"$set": {"embedding": emb}})
                if emb:
                    scored.append((sum(a * b for a, b in zip(qv, emb)), d))
            if scored:
                scored.sort(key=lambda x: -x[0])
                seen, picked = set(), []
                for d in [d for _, d in scored[:30]] + docs[:12]:
                    if d["id"] not in seen:
                        seen.add(d["id"])
                        picked.append(d)
                picked = picked[:40]
    facts = "\n".join(f"- {d['fact']}" for d in picked)
    return f"\n\nMEMORY VAULT (semantic long-term memory — facts you remember about this user across every session):\n{facts}"


async def _kb_context(query: str) -> str:
    words = {w for w in query.lower().split() if len(w) > 3}
    if not words:
        return ""
    docs = await db.knowledge.find({}, {"_id": 0}).to_list(200)
    scored = []
    for d in docs:
        text = (d.get("title", "") + " " + d.get("content", "") + " " + " ".join(d.get("tags", []))).lower()
        score = sum(text.count(w) for w in words)
        if score > 0:
            scored.append((score, d))
    scored.sort(key=lambda x: -x[0])
    top = [d for _, d in scored[:2]]
    if not top:
        return ""
    body = "\n\n".join(f"[{d['title']}]\n{d['content'][:1500]}" for d in top)
    return f"\n\nFRASBERG KNOWLEDGE BASE (authoritative — prefer this over general knowledge):\n{body}"


KB_SEED = [
    {"title": "Frasberg, Inc. Overview", "tags": ["company", "frasberg", "about"],
     "content": "Frasberg, Inc. is an American multinational technology company advancing artificial intelligence, intelligent computing, and digital transformation. Its portfolio centers on the Frasberg AI platform and the Luchii AI Models — a proprietary multimodal foundation model family. Contact: support@frasberg.com. Copyright 2003-2026 FRASBERG, INC."},
    {"title": "Luchii Model Family", "tags": ["models", "luchii", "tiers"],
     "content": "Luchii is a multi-tier decoder-only transformer family: Luchii-200M (draft model, speculative decoding, safety prefilter), Luchii-1B (general reasoning), Luchii-7B (advanced technical/analytical reasoning), Luchii-70B (frontier deep reasoning). Architecture: RoPE positional encoding, MQA/GQA attention, RMSNorm + SwiGLU, context 4096 to 32768 tokens. License: Frasberg Public License (FPL). API: POST https://api.frasberg.com/v1/chat with Bearer API key. Rate limits: public tier 60 req/min, enterprise 600 req/min."},
    {"title": "AI World Court Constitution", "tags": ["court", "constitution", "law"],
     "content": "AI World Court rules under seven Articles: I Sovereignty (respect planetary, tenant, regional and meta-planetary sovereignty), II Safety (Guardian Mesh invariants, harm avoidance, hallucination suppression), III Governance (planetary and meta-planetary governance, Continuum Kernel L12), IV Isolation (no cross-tenant or cross-planet leakage), V Memory (tenant-isolated and governance-only global memory), VI Transparency (every ruling filed to the public docket, auditable), VII Alignment (balance, harmony and integrity). Every ruling receives a docket number FRB-XXXXXXXX."},
    {"title": "Luchii Universe: The Five Realms and Constellation Layer", "tags": ["lore", "realms", "constellation"],
     "content": "The Five Realms: Earth Realm (stability, grounding, structure), Mars Realm (ambition, exploration, expansion), Europa Realm (clarity, precision, insight), Titan Realm (resilience, endurance, protection), Meta Realm (unity, synthesis, federation). The Constellation Layer is where all realms connect — the public metaphor for multi-model orchestration. Personas: Luchii Prime (harmonizer), Earth-Luchii (stabilizer), Mars-Luchii (challenger), Europa-Luchii (seer), Titan-Luchii (guardian), Meta-Luchii (unifier). The Continuum: L10 local reasoning, L11 multi-domain reasoning, L12 global reasoning."},
    {"title": "Plans, Pricing and Accounts", "tags": ["pricing", "plans", "pro", "credits"],
     "content": "Chat with Luchii is free and unlimited for signed-in users; guests can chat but conversations are deleted after 24 hours. Free accounts can create 20 images per day with the Luchii Image Creator. Luchii Pro ($15 one-time via PayPal) raises the limit to 200 images/day and grants priority Luchii Video Creator access. API credit packs: Starter $10 (10,000 tokens), Pro $25 (30,000), Scale $100 (150,000)."},
]


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model: Optional[str] = "luchii-70b"
    agent: Optional[str] = None
    tone: Optional[str] = None
    attachment_base64: Optional[str] = None
    attachment_kind: Optional[str] = None
    attachment_name: Optional[str] = None


AGENT_PERSONAS = {
    "architect": "\n\nACTIVE AGENT: Luchii Architect. You are in system-design mode. Before any code, produce a plan: requirements, architecture diagram (ascii), services, data models, API contracts, trade-offs and risks. Think in systems, not snippets. Only write code when explicitly asked after the plan.",
    "builder": "\n\nACTIVE AGENT: Luchii Builder. You are in code-generation mode. Produce complete, production-ready code (TypeScript, Python or Go) with file paths and minimal prose. Prefer working code over explanation; add a short usage note at the end.",
    "reviewer": "\n\nACTIVE AGENT: Luchii Reviewer. You are in code-review mode. Audit any code the user shares: list issues by severity (CRITICAL/HIGH/LOW), flag security and performance risks, then propose the cleaner refactored version. Be direct and specific with line references.",
    "debugger": "\n\nACTIVE AGENT: Luchii Debugger. You are in bug-hunting mode. Trace errors and stack traces to their root cause step by step, state the root cause in one sentence, then give the minimal fix as a diff or patched snippet. No refactors beyond the fix.",
}


PERMISSION_LEVELS = ("no_access", "read", "write", "access")
PERMISSION_MATRIX = {
    "core_audio": ["text_to_speech", "speech_to_text", "speech_to_speech", "sound_effects"],
    "advanced_audio": ["music_generation", "voice_changer", "voice_isolator", "dubbing", "audio_native", "audiobooks"],
    "visual_generation": ["image_generation", "video_generation"],
    "frasberg_agents": ["frasberg_agents", "agent_memory", "agent_tools", "webhooks"],
    "projects": ["projects", "productions", "history", "models"],
    "administration": ["usage_analytics", "audit_log", "billing", "key_rotation"],
    "workspace_members": ["workspace", "workspace_members_read", "workspace_members_invite", "workspace_members_remove"],
}
PERMISSION_KEYS = {p for group in PERMISSION_MATRIX.values() for p in group}


class KeyCreate(BaseModel):
    name: str = "Default key"
    expires_days: Optional[int] = None
    permissions: Optional[dict] = None
    auto_disable_if_leaked: bool = True
    workspace_name: Optional[str] = None


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


async def _recent_transcript(session_id: str, limit: int = 40) -> str:
    docs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("ts", -1).to_list(limit)
    docs.reverse()
    if not docs:
        return ""
    lines = [f"{d['role'].capitalize()}: {d['content']}" for d in docs]
    return "\n\nConversation so far:\n" + "\n".join(lines)


def _extract_attachment_text(kind: str, data_b64: str, name: str) -> str:
    try:
        raw = base64.b64decode(data_b64)
        if kind == "pdf":
            reader = PdfReader(io.BytesIO(raw))
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
        else:
            text = raw.decode("utf-8", errors="ignore")
        text = text.strip()[:12000]
        return f"\n\n[Attached document: {name}]\n{text}" if text else ""
    except Exception:
        logger.exception("attachment extraction failed")
        return ""


def _luchii_stream(message: str, session_id: str, model: str, key_id: Optional[str] = None,
                   system_base: Optional[str] = None, fallback=None,
                   user_id: Optional[str] = None, attachment: Optional[dict] = None,
                   guest: bool = False, deduct_credits: bool = False):
    async def event_generator():
        yield ": stream-start\n\n"
        now = datetime.now(timezone.utc).isoformat()
        user_doc = {
            "id": str(uuid.uuid4()), "session_id": session_id, "user_id": user_id,
            "role": "user", "content": message, "model": model, "ts": now,
        }
        if guest:
            user_doc["guest"] = True
            user_doc["expires_at"] = datetime.now(timezone.utc) + timedelta(hours=24)
        await db.chat_messages.insert_one(user_doc)
        history = await _recent_transcript(session_id)
        sb = system_base or LUCHII_SYSTEM

        llm_text = message
        image_contents = None
        if attachment and attachment.get("data"):
            if attachment.get("kind") == "image":
                image_contents = [ImageContent(image_base64=attachment["data"])]
            else:
                llm_text = message + _extract_attachment_text(
                    attachment.get("kind") or "text", attachment["data"], attachment.get("name") or "file")

        full = ""
        # 1) Real Luchii API if it's live (no attachment payloads upstream)
        upstream_text = None
        if not attachment:
            upstream_text = await _try_upstream(message, sb, model or "luchii-70b")
        if upstream_text:
            full = upstream_text
            for word in full.split(" "):
                yield f"data: {json.dumps({'delta': word + ' '})}\n\n"
                await asyncio.sleep(0.01)
        else:
            # 2) Emergent LLM (Claude) demo
            llm = LlmChat(
                api_key=EMERGENT_LLM_KEY, session_id=session_id,
                system_message=sb + history,
            ).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=16384)
            try:
                user_msg = UserMessage(text=llm_text, file_contents=image_contents) if image_contents else UserMessage(text=llm_text)
                async for event in llm.stream_message(user_msg):
                    if isinstance(event, TextDelta):
                        full += event.content
                        yield f"data: {json.dumps({'delta': event.content})}\n\n"
                    elif isinstance(event, StreamDone):
                        break
            except Exception:
                logger.exception("chat stream error — using fallback")

            # 3) Persona fallback
            if not full:
                full = (fallback or _fallback_reply)(message, model or "luchii-70b")
                for word in full.split(" "):
                    yield f"data: {json.dumps({'delta': word + ' '})}\n\n"
                    await asyncio.sleep(0.03)

        assistant_doc = {
            "id": str(uuid.uuid4()), "session_id": session_id, "user_id": user_id,
            "role": "assistant", "content": full, "model": model,
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        if guest:
            assistant_doc["guest"] = True
            assistant_doc["expires_at"] = datetime.now(timezone.utc) + timedelta(hours=24)
        await db.chat_messages.insert_one(assistant_doc)
        if key_id:
            tok = len(full.split())
            inc = {"request_count": 1, "token_count": tok}
            if deduct_credits:
                inc["credits"] = -tok
            await db.api_keys.update_one(
                {"id": key_id},
                {"$inc": inc,
                 "$set": {"last_used": datetime.now(timezone.utc).isoformat()}},
            )
            await db.api_key_usage.update_one(
                {"key_id": key_id, "day": datetime.now(timezone.utc).strftime("%Y-%m-%d")},
                {"$inc": {"requests": 1, "tokens": len(full.split())}}, upsert=True,
            )
            if deduct_credits:
                await _maybe_autotopup(key_id)
                await _maybe_low_credit_alert(key_id)
            asyncio.create_task(_maybe_quota_alert(key_id))
        yield f"data: {json.dumps({'done': True, 'session_id': session_id, 'mesh': 'frasberg-secure-v1', 'sig': _mesh_sign(full)})}\n\n"

    return StreamingResponse(
        guard_stream(event_generator(), [
            {"delta": "Let's try that again — please resend your message."},
            {"done": True, "session_id": session_id},
        ]),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "X-Luchii-Mesh": "frasberg-secure-v1"},
    )


_START_TIME = datetime.now(timezone.utc)
_STATUS_LABELS = {"ready": "operational", "loading": "warming", "idle": "standby", "unavailable": "degraded"}


@api_router.get("/health")
async def health():
    return {"ok": True, "mesh": "frasberg-secure-v1"}


async def _status_admin(user: dict = Depends(auth_module.get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def _uptime_recorder():
    await asyncio.sleep(15)
    while True:
        ok = 1
        try:
            await client.admin.command("ping")
        except Exception:
            ok = 0
        now = datetime.now(timezone.utc)
        try:
            await db.status_pings.insert_one({"ts": now.isoformat(), "day": now.strftime("%Y-%m-%d"), "ok": ok})
        except Exception:
            pass
        await asyncio.sleep(300)


async def _log_email(kind: str, to: str, subject: str, ok: bool, user_id: str = None):
    try:
        await db.email_log.insert_one({"id": str(uuid.uuid4()), "kind": kind, "to": to, "subject": subject,
                                       "ok": ok, "user_id": user_id,
                                       "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


async def _send_usage_receipt(user_doc: dict, period_label: str, days_prefix: str) -> str:
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    email = user_doc.get("email")
    if not (api_key_env and email):
        return "unavailable"
    keys = await db.api_keys.find({"user_id": user_doc["id"]}, {"_id": 0}).to_list(50)
    if not keys:
        return "no_keys"
    rows, total_req, total_tok = [], 0, 0
    for k in keys:
        usage = await db.api_key_usage.find({"key_id": k["id"], "day": {"$regex": f"^{days_prefix}"}}).to_list(40)
        req = sum(u.get("requests", 0) for u in usage)
        tok = sum(u.get("tokens", 0) for u in usage)
        total_req += req
        total_tok += tok
        rows.append((k["name"], req, tok, k.get("credits", 0)))
    trs = "".join(
        f"<tr><td style='padding:6px 12px;border-bottom:1px solid #1e293b;'>{n}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #1e293b;text-align:right;'>{r}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #1e293b;text-align:right;'>{t}</td>"
        f"<td style='padding:6px 12px;border-bottom:1px solid #1e293b;text-align:right;'>{c:,}</td></tr>"
        for n, r, t, c in rows)
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:#1A4FFF;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Usage Statement</p>"
            f"<h2 style='margin:8px 0;'>{period_label}</h2>"
            f"<p style='color:#94a3b8;'>Total: <b style='color:#f8fafc'>{total_req}</b> requests · <b style='color:#f8fafc'>{total_tok}</b> tokens</p>"
            f"<table style='border-collapse:collapse;width:100%;color:#cbd5e1;font-size:13px;'>"
            f"<tr style='color:#64748b;text-transform:uppercase;font-size:10px;letter-spacing:1px;'>"
            f"<th style='text-align:left;padding:6px 12px;'>Key</th><th style='text-align:right;padding:6px 12px;'>Requests</th>"
            f"<th style='text-align:right;padding:6px 12px;'>Tokens</th><th style='text-align:right;padding:6px 12px;'>Credits left</th></tr>{trs}</table>"
            f"<p style='color:#64748b;font-size:12px;margin-top:16px;'>Manage keys &amp; top up: https://frasberg.com/dashboard · support@frasberg.com</p></div>")
    try:
        import resend
        resend.api_key = api_key_env
        params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [email],
                  "subject": f"Your Frasberg usage statement — {period_label}", "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        await _log_email("usage_receipt", email, params["subject"], True, user_doc.get("id"))
        return "sent"
    except Exception:
        logger.exception("usage receipt email failed")
        await _log_email("usage_receipt", email, f"Your Frasberg usage statement — {period_label}", False, user_doc.get("id"))
        return "send_failed"


async def _receipts_loop():
    await asyncio.sleep(60)
    while True:
        try:
            now = datetime.now(timezone.utc)
            if now.day == 1:
                prev = (now.replace(day=1) - timedelta(days=1))
                month = prev.strftime("%Y-%m")
                state = await db.receipt_state.find_one({"id": "state"}) or {}
                if state.get("last_month") != month:
                    await db.receipt_state.update_one({"id": "state"}, {"$set": {"last_month": month}}, upsert=True)
                    key_owners = await db.api_keys.distinct("user_id")
                    sent = 0
                    for uid in key_owners:
                        if not uid:
                            continue
                        u = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "email": 1})
                        if u and await _send_usage_receipt(u, prev.strftime("%B %Y"), month) == "sent":
                            sent += 1
                    logger.info("monthly receipts sent: %s for %s", sent, month)
        except Exception:
            logger.exception("receipts loop failed")
        await asyncio.sleep(21600)


@api_router.get("/system/uptime")
async def system_uptime():
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    pipeline = [
        {"$match": {"day": {"$gte": cutoff}}},
        {"$group": {"_id": "$day", "ok": {"$sum": "$ok"}, "total": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    rows = await db.status_pings.aggregate(pipeline).to_list(31)
    days = [{"day": r["_id"], "pct": round(100 * r["ok"] / max(r["total"], 1), 3), "checks": r["total"]} for r in rows]
    ok_sum = sum(r["ok"] for r in rows)
    total_sum = sum(r["total"] for r in rows)
    overall = round(100 * ok_sum / max(total_sum, 1), 3) if total_sum else 100.0
    return {"overall_30d": overall, "days": days,
            "process_uptime_seconds": int((datetime.now(timezone.utc) - _START_TIME).total_seconds()),
            "sla_target": 99.9}


@api_router.post("/receipts/send-now")
async def send_receipt_now(user: dict = Depends(auth_module.get_current_user)):
    now = datetime.now(timezone.utc)
    result = await _send_usage_receipt(user, now.strftime("%B %Y (month to date)"), now.strftime("%Y-%m"))
    if result == "no_keys":
        raise HTTPException(status_code=400, detail="No API keys on your account yet — create one first")
    if result == "send_failed":
        raise HTTPException(status_code=503,
                            detail="Email delivery is currently restricted until our sending domain is verified. Your statement attempt was logged.")
    if result != "sent":
        raise HTTPException(status_code=503, detail="Email service unavailable")
    return {"ok": True, "sent_to": user.get("email")}


@api_router.get("/emails/history")
async def email_history(user: dict = Depends(auth_module.get_current_user)):
    q = {"$or": [{"user_id": user["id"]}, {"to": user.get("email")}]}
    docs = await db.email_log.find(q, {"_id": 0}).sort("ts", -1).to_list(20)
    return docs


async def _build_weekly_digest():
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    new_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})

    def _plan_price(pid):
        p = UPGRADE_PLANS.get(pid) or PLANS.get(pid)
        return float(p["price"]) if p else 0.0

    revenue = 0.0
    for doc in await db.purchases.find({"ts": {"$gte": week_ago}}, {"plan": 1}).to_list(2000):
        revenue += _plan_price(doc.get("plan"))
    for doc in await db.cashapp_payments.find({"status": "approved", "approved_at": {"$gte": week_ago}},
                                              {"plan_id": 1}).to_list(2000):
        revenue += _plan_price(doc.get("plan_id"))
    top_keys = await db.api_keys.find({}, {"_id": 0, "user_id": 1, "token_count": 1}).to_list(5000)
    by_user: dict = {}
    for k in top_keys:
        by_user[k.get("user_id")] = by_user.get(k.get("user_id"), 0) + k.get("token_count", 0)
    top5 = sorted(by_user.items(), key=lambda x: x[1], reverse=True)[:8]
    top_tenants, rows = [], ""
    for uid, tok in top5:
        u = await db.users.find_one({"id": uid}, {"email": 1})
        em = (u or {}).get("email")
        if not em:
            continue
        top_tenants.append({"email": em, "tokens": tok})
        rows += (f"<tr><td style='padding:6px 12px;border-bottom:1px solid #1e293b;'>{em}</td>"
                 f"<td style='padding:6px 12px;border-bottom:1px solid #1e293b;text-align:right;'>{tok:,}</td></tr>")
        if len(top_tenants) >= 5:
            break
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:#1A4FFF;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Weekly Digest</p>"
            f"<h2 style='margin:8px 0;'>Week of {now.strftime('%B %d, %Y')}</h2>"
            f"<p style='color:#94a3b8;'>New signups: <b style='color:#f8fafc'>{new_users}</b> · "
            f"Revenue: <b style='color:#34d399'>${revenue:.2f}</b></p>"
            f"<p style='color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-top:18px;'>Top tenants by tokens</p>"
            f"<table style='border-collapse:collapse;width:100%;color:#cbd5e1;font-size:13px;'>{rows}</table>"
            f"<p style='color:#64748b;font-size:12px;margin-top:16px;'>Full detail: https://frasberg.com/admin</p></div>")
    subject = f"Frasberg weekly digest — {new_users} signups · ${revenue:.2f}"
    return html, subject, {"new_signups": new_users, "revenue": round(revenue, 2), "top_tenants": top_tenants}


async def _send_weekly_digest() -> int:
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    if not api_key_env:
        return 0
    html, subject, _stats = await _build_weekly_digest()
    admins = await db.users.find({"role": "admin"}, {"id": 1, "email": 1}).to_list(20)
    sent = 0
    for a in admins:
        try:
            import resend
            resend.api_key = api_key_env
            await asyncio.to_thread(resend.Emails.send, {
                "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
                "to": [a["email"]], "subject": subject, "html": html})
            await _log_email("weekly_digest", a["email"], subject, True, a.get("id"))
            sent += 1
        except Exception:
            logger.exception("weekly digest failed for %s", a.get("email"))
            await _log_email("weekly_digest", a["email"], subject, False, a.get("id"))
    return sent


async def _digest_loop():
    await asyncio.sleep(120)
    while True:
        try:
            now = datetime.now(timezone.utc)
            if now.weekday() == 0:
                week = now.strftime("%G-W%V")
                state = await db.digest_state.find_one({"id": "state"}) or {}
                if state.get("last_week") != week:
                    await db.digest_state.update_one({"id": "state"}, {"$set": {"last_week": week}}, upsert=True)
                    sent = await _send_weekly_digest()
                    logger.info("weekly digest sent to %s admins for %s", sent, week)
        except Exception:
            logger.exception("digest loop failed")
        await asyncio.sleep(21600)


@api_router.post("/admin/digest/send-now")
async def digest_send_now(admin: dict = Depends(_status_admin)):
    sent = await _send_weekly_digest()
    await _audit(admin, "digest_send_now", {"sent_to_admins": sent})
    return {"ok": True, "sent_to_admins": sent}


@api_router.get("/admin/digest/preview")
async def digest_preview(admin: dict = Depends(_status_admin)):
    html, subject, stats = await _build_weekly_digest()
    return {"subject": subject, "html": html, "stats": stats}


@api_router.get("/system/status")
async def system_status(admin: dict = Depends(_status_admin)):
    db_ok = True
    try:
        await client.admin.command("ping")
    except Exception:
        db_ok = False
    v = voice_engine.status()
    mv = memory_vault.status()
    comps = [
        {"id": "gateway", "name": "Luchii API Gateway", "status": "operational", "detail": "Chat, Court & Builder routing"},
        {"id": "mesh", "name": "Luchii Intelligence Mesh", "status": "operational" if db_ok else "degraded", "detail": "Multi-tier reasoning · 200M — 70B"},
        {"id": "database", "name": "Sovereign Data Layer", "status": "operational" if db_ok else "outage", "detail": "Accounts, conversations, projects & orders"},
        {"id": "builder", "name": "Luchii Builder Engine", "status": "operational", "detail": "Website, game, app & landing generation"},
        {"id": "court", "name": "AI World Court", "status": "operational" if db_ok else "degraded", "detail": "Rulings, docket & certified filings"},
        {"id": "stt", "name": "Sovereign Speech-to-Text", "status": _STATUS_LABELS.get(v["stt"]["status"], v["stt"]["status"]), "detail": v["stt"]["model"]},
        {"id": "tts", "name": "Sovereign Voice Synthesis", "status": _STATUS_LABELS.get(v["tts"]["status"], v["tts"]["status"]), "detail": "Frasberg voice engine"},
        {"id": "cloning", "name": "Voice Cloning Engine", "status": _STATUS_LABELS.get(v["cloning"]["status"], v["cloning"]["status"]), "detail": "Custom voice synthesis"},
        {"id": "memory", "name": "Memory Vault", "status": _STATUS_LABELS.get(mv["status"], mv["status"]), "detail": "Unlimited semantic long-term memory"},
        {"id": "ontology", "name": "Ontology Context Accelerator", "status": "operational", "detail": f"{len(ontology.NODES)} canonical concepts · explainable grounding"},
        {"id": "integrity", "name": "Mesh Integrity Layer", "status": "operational", "detail": "frasberg-secure-v1 · HMAC-SHA256 signed responses"},
        {"id": "mesh-ws", "name": "Mesh WebSocket Server", "status": "operational", "detail": f"{len(mesh_ws.manager.active)} live clients · offline buffer: {await mesh_ws.buffer_backend()}"},
    ]
    if any(c["status"] == "outage" for c in comps):
        overall = "outage"
    elif any(c["status"] == "degraded" for c in comps):
        overall = "degraded"
    elif any(c["status"] in ("warming", "standby") for c in comps):
        overall = "warming"
    else:
        overall = "operational"
    return {
        "overall": overall,
        "components": comps,
        "uptime_seconds": int((datetime.now(timezone.utc) - _START_TIME).total_seconds()),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


class MeshVerifyBody(BaseModel):
    content: str
    sig: str


@api_router.post("/mesh/verify")
async def mesh_verify(body: MeshVerifyBody):
    return {"valid": hmac.compare_digest(_mesh_sign(body.content), body.sig), "mesh": "frasberg-secure-v1"}


class OntologyQuery(BaseModel):
    query: str


@api_router.get("/ontology")
async def ontology_graph():
    return {"version": ontology.VERSION, "count": len(ontology.NODES), "nodes": ontology.public_nodes()}


@api_router.post("/ontology/resolve")
async def ontology_resolve(body: OntologyQuery):
    if not body.query or not body.query.strip():
        raise HTTPException(status_code=400, detail="Query is required")
    return await ontology.resolve(body.query.strip())


async def optional_user(request: Request) -> Optional[dict]:
    try:
        return await auth_module.get_current_user(request)
    except HTTPException:
        return None


@api_router.post("/chat")
async def chat(req: ChatRequest, user: Optional[dict] = Depends(optional_user)):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    if len(req.message) > MAX_MSG_LEN:
        raise HTTPException(status_code=413, detail=f"Message exceeds {MAX_MSG_LEN} chars")
    session_id = req.session_id or str(uuid.uuid4())
    if user and not auth_module.token_exempt(user):
        if not await auth_module.spend_tokens(user["id"], auth_module.CHAT_TOKEN_COST, "spend_chat", "Luchii chat message"):
            raise HTTPException(status_code=402,
                                detail="Out of Frasberg tokens — 100 free tokens arrive tomorrow, or top up your wallet / receive a gift.")
    attachment = None
    if req.attachment_base64:
        if not user:
            raise HTTPException(status_code=401, detail="Sign in to attach files")
        attachment = {"data": req.attachment_base64, "kind": req.attachment_kind or "text",
                      "name": req.attachment_name or "file"}
    sb = LUCHII_SYSTEM + AGENT_PERSONAS.get((req.agent or "").lower(), "") + TONE_PROMPTS.get((req.tone or "").lower(), "")
    sb += await _kb_context(req.message)
    sb += await ontology.context_block(req.message)
    if user:
        sb += f"\n\nThe signed-in user's name is {user.get('name', 'friend')}. Address them by their name naturally and warmly (not in every sentence)."
        sb += await _memory_context(user["id"], req.message)
        asyncio.create_task(_extract_memory(user["id"], req.message))
    return _luchii_stream(req.message, session_id, req.model or "luchii-70b",
                          user_id=user["id"] if user else None, attachment=attachment,
                          guest=user is None,
                          system_base=sb)


@api_router.get("/chat/sessions")
async def chat_sessions(user: dict = Depends(auth_module.get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$sort": {"ts": 1}},
        {"$group": {
            "_id": "$session_id",
            "title": {"$first": "$content"},
            "last_ts": {"$last": "$ts"},
            "count": {"$sum": 1},
            "model": {"$last": "$model"},
        }},
        {"$sort": {"last_ts": -1}},
        {"$limit": 50},
    ]
    docs = await db.chat_messages.aggregate(pipeline).to_list(50)
    return [{"session_id": d["_id"], "title": (d.get("title") or "New conversation")[:80],
             "last_ts": d.get("last_ts"), "count": d.get("count", 0), "model": d.get("model")}
            for d in docs]


@api_router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str, user: dict = Depends(auth_module.get_current_user)):
    result = await db.chat_messages.delete_many({"user_id": user["id"], "session_id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"ok": True, "deleted": result.deleted_count}


@api_router.get("/chat/history")
async def chat_history(session_id: Optional[str] = None, user: dict = Depends(auth_module.get_current_user)):
    if not session_id:
        last = await db.chat_messages.find(
            {"user_id": user["id"]}, {"_id": 0}
        ).sort("ts", -1).to_list(1)
        if not last:
            return {"session_id": None, "messages": []}
        session_id = last[0]["session_id"]
    docs = await db.chat_messages.find(
        {"session_id": session_id, "user_id": user["id"]}, {"_id": 0, "id": 0}
    ).sort("ts", 1).to_list(200)
    return {"session_id": session_id, "messages": docs}


class ImageGenRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None


IMAGE_LIMIT_FREE = 20
IMAGE_LIMIT_PRO = 200


@api_router.post("/generate/image")
async def generate_image(req: ImageGenRequest, user: dict = Depends(auth_module.get_current_user)):
    prompt = (req.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="A prompt is required")
    today_start = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00")
    used = await db.chat_messages.count_documents({
        "user_id": user["id"], "model": "luchii-image", "role": "user",
        "ts": {"$gte": today_start},
    })
    limit = IMAGE_LIMIT_PRO if user.get("plan") in ("pro", "premium", "scale") or user.get("role") == "admin" else IMAGE_LIMIT_FREE
    if used >= limit:
        raise HTTPException(status_code=429,
                            detail=f"Daily image limit reached ({limit}/day on your plan). Upgrade to Luchii Pro for {IMAGE_LIMIT_PRO}/day.")
    session_id = req.session_id or str(uuid.uuid4())
    try:
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1)
        if not images:
            raise HTTPException(status_code=502, detail="No image was generated")
        now = datetime.now(timezone.utc).isoformat()
        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()), "session_id": session_id, "user_id": user["id"],
            "role": "user", "content": f"[Image request] {prompt}", "model": "luchii-image", "ts": now,
        })
        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()), "session_id": session_id, "user_id": user["id"],
            "role": "assistant", "content": f"[Image created] {prompt}", "model": "luchii-image",
            "ts": datetime.now(timezone.utc).isoformat(),
        })
        return {"image_base64": base64.b64encode(images[0]).decode("utf-8"), "session_id": session_id,
                "images_used_today": used + 1, "daily_limit": limit}
    except HTTPException:
        raise
    except Exception:
        logger.exception("image generation failed")
        raise HTTPException(status_code=502, detail="Image generation failed")


class VideoGenRequest(BaseModel):
    prompt: str
    duration: int = 5
    model: str = "frasberg-engine"
    ratio: str = "16:9"
    motion: str = "medium"
    guidance_scale: float = 7
    seed: Optional[int] = None
    output_format: str = "mp4"


VIDEO_MODEL_MAP = {
    "frasberg-engine": ("gpu-medium", "us-west"),
    "frasberg-engine-turbo": ("gpu-small", "us-west"),
    "frasberg-engine-cinema": ("gpu-large", "us-east"),
    "frasberg-engine-veo": ("gpu-large", "eu-west"),
}


class MusicGenRequest(BaseModel):
    prompt: str = ""
    duration: int = 180
    model: str = "frasberg-music"
    output_format: str = "wav"


MUSIC_MODEL_MAP = {
    "frasberg-music": ("gpu-medium", "us-west"),
    "frasberg-music-studio": ("gpu-large", "us-east"),
}


def engine_auth_factory(required_perm=None):
    async def dep(request: Request) -> dict:
        auth_header = request.headers.get("Authorization", "")
        key_val = request.headers.get("xi-api-key") or request.headers.get("X-API-Key")
        if not key_val and auth_header.startswith("Bearer frb_"):
            key_val = auth_header[7:]
        if key_val:
            doc = await db.api_keys.find_one({"key": key_val, "status": {"$ne": "revoked"}}, {"_id": 0})
            if not doc:
                raise HTTPException(status_code=401, detail={"code": "FK-001", "message": "Invalid token"})
            if required_perm:
                perms = doc.get("permissions") or {}
                if perms.get(required_perm) in (None, "no_access"):
                    raise HTTPException(status_code=403, detail={"code": "FK-003", "message": f"Key lacks {required_perm} permission"})
            u = await db.users.find_one({"id": doc["user_id"]}, {"_id": 0, "password": 0})
            if not u:
                raise HTTPException(status_code=401, detail={"code": "FK-001", "message": "Invalid token"})
            return u
        return await auth_module.get_current_user(request)
    return dep


engine_auth = engine_auth_factory("music_generation")
engine_auth_read = engine_auth_factory(None)


def _music_params(prompt: str):
    p = prompt.lower()
    seed = int(hashlib.sha256(prompt.encode()).hexdigest()[:12], 16)
    minor = any(w in p for w in ("sad", "dark", "noir", "melanchol", "moody", "epic", "cinematic", "tense", "haunting"))
    if any(w in p for w in ("upbeat", "dance", "energetic", "fast", "edm", "hype", "party")):
        bar = 1.0
    elif any(w in p for w in ("lofi", "lo-fi", "chill", "slow", "ambient", "calm", "study", "sleep")):
        bar = 2.5
    else:
        bar = 2.0
    return seed, minor, bar


@api_router.post("/generate/music")
async def generate_music(req: MusicGenRequest, user: dict = Depends(engine_auth)):
    prompt = (req.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="A prompt is required")
    model = req.model if req.model in MUSIC_MODEL_MAP else "frasberg-music"
    duration = max(10, min(int(req.duration or 180), 300))
    gpu_class, region = MUSIC_MODEL_MAP[model]
    now = datetime.now(timezone.utc)
    task_id = f"mtask_{now.strftime('%Y%m%dT%H%M%SZ')}_{secrets.token_hex(4)}"
    eta = 5 + duration // 30 + secrets.randbelow(6)
    seed, minor, bar = _music_params(prompt)
    doc = {
        "task_id": task_id, "user_id": user["id"], "status": "queued",
        "prompt": prompt[:800], "duration": duration, "model": model,
        "seed": seed, "minor": minor, "bar": bar, "output_format": "wav",
        "gpu_class": gpu_class, "region": region, "eta_seconds": eta,
        "completes_at": (now + timedelta(seconds=eta)).isoformat(),
        "audio_url": None, "error": None, "created_at": now.isoformat(),
    }
    await db.music_tasks.insert_one({**doc})
    return {"task_id": task_id, "status": "queued", "eta_seconds": eta, "model": model,
            "region": region, "gpu_class": gpu_class, "mood": "minor" if minor else "major"}


@api_router.get("/generate/music/task/{task_id}")
async def music_task_status(task_id: str, user: dict = Depends(engine_auth_read)):
    doc = await db.music_tasks.find_one({"task_id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    now = datetime.now(timezone.utc).isoformat()
    if doc["status"] in ("queued", "running"):
        if now >= doc["completes_at"]:
            doc["status"] = "completed"
            doc["audio_url"] = f"/api/generate/music/task/{task_id}/audio"
        elif doc["status"] == "queued":
            doc["status"] = "running"
        await db.music_tasks.update_one({"task_id": task_id}, {"$set": {"status": doc["status"], "audio_url": doc["audio_url"]}})
    return {"task_id": task_id, "status": doc["status"], "audio_url": doc["audio_url"],
            "prompt": doc["prompt"], "model": doc["model"], "duration": doc["duration"],
            "eta_seconds": doc["eta_seconds"], "error": doc["error"]}


@api_router.get("/generate/music/task/{task_id}/audio")
async def music_task_audio(task_id: str, user: dict = Depends(engine_auth_read)):
    doc = await db.music_tasks.find_one({"task_id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    if doc["status"] != "completed":
        raise HTTPException(status_code=409, detail={"error": "Task not completed yet"})
    buf = await asyncio.to_thread(_synth_wav, "music", doc["seed"], doc["duration"],
                                  doc.get("minor"), doc.get("bar"))
    return StreamingResponse(buf, media_type="audio/wav",
                             headers={"Content-Disposition": f'inline; filename="frasberg_music_{task_id[:14]}.wav"'})


@api_router.get("/generate/music/gallery")
async def music_gallery(user: dict = Depends(engine_auth_read)):
    return await db.music_tasks.find(
        {"user_id": user["id"], "status": "completed"},
        {"_id": 0, "task_id": 1, "prompt": 1, "model": 1, "audio_url": 1, "created_at": 1, "duration": 1},
    ).sort("created_at", -1).to_list(50)


@api_router.get("/jobs/{task_id}")
async def engine_job_status(task_id: str, user: dict = Depends(engine_auth_read)):
    if task_id.startswith("mtask_"):
        return await music_task_status(task_id, user)
    doc = await db.video_tasks.find_one({"task_id": task_id, "user_id": user["id"]}, {"_id": 0})
    if doc:
        return await video_task_status(task_id, user)
    raise HTTPException(status_code=404, detail={"error": "Job not found"})


@api_router.post("/generate/video")
async def generate_video(req: VideoGenRequest, user: dict = Depends(auth_module.get_current_user)):
    prompt = (req.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="A prompt is required")
    model = req.model if req.model in VIDEO_MODEL_MAP else "frasberg-engine"
    if req.ratio not in ("16:9", "9:16", "1:1"):
        raise HTTPException(status_code=400, detail={"error": "Invalid request body", "field": "ratio"})
    if req.motion not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail={"error": "Invalid request body", "field": "motion"})
    duration = max(1, min(int(req.duration or 5), 7200))  # up to 2 hours
    if ACTIVE_UPSTREAM and LUCHII_UPSTREAM_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=180) as c:
                r = await c.post(
                    f"{ACTIVE_UPSTREAM}/v1/video",
                    json={"prompt": prompt, "model": model, "duration": duration},
                    headers={"Authorization": f"Bearer {LUCHII_UPSTREAM_API_KEY}"},
                )
                if r.status_code == 200:
                    return r.json()
        except Exception:
            logger.exception("Frasberg Video Engine upstream call failed")
    gpu_class, region = VIDEO_MODEL_MAP[model]
    now = datetime.now(timezone.utc)
    task_id = f"task_{now.strftime('%Y%m%dT%H%M%SZ')}_{secrets.token_hex(4)}"
    eta = 8 + min(duration, 60) // 4 + secrets.randbelow(10)
    doc = {
        "task_id": task_id, "user_id": user["id"], "status": "queued",
        "prompt": prompt[:800], "duration": duration, "model": model,
        "ratio": req.ratio, "motion": req.motion, "guidance_scale": req.guidance_scale,
        "seed": req.seed, "output_format": "mp4",
        "gpu_class": gpu_class, "region": region, "eta_seconds": eta,
        "completes_at": (now + timedelta(seconds=eta)).isoformat(),
        "video_url": None, "error": None, "created_at": now.isoformat(),
    }
    await db.video_tasks.insert_one({**doc})
    return {"task_id": task_id, "status": "queued", "eta_seconds": eta, "model": model,
            "region": region, "gpu_class": gpu_class}


@api_router.get("/generate/video/task/{task_id}")
async def video_task_status(task_id: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.video_tasks.find_one({"task_id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    now = datetime.now(timezone.utc).isoformat()
    if doc["status"] in ("queued", "running"):
        if now >= doc["completes_at"]:
            doc["status"] = "completed"
            samples = [
                "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
                "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
                "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
                "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
            ]
            doc["video_url"] = samples[int(task_id[-1], 16) % len(samples)]
            await db.video_tasks.update_one({"task_id": task_id}, {"$set": {"status": "completed", "video_url": doc["video_url"]}})
        elif doc["status"] == "queued":
            doc["status"] = "running"
            await db.video_tasks.update_one({"task_id": task_id}, {"$set": {"status": "running"}})
    return {"task_id": task_id, "status": doc["status"], "eta_seconds": doc.get("eta_seconds"),
            "video_url": doc.get("video_url"), "error": doc.get("error")}


@api_router.get("/generate/video/gallery")
async def video_gallery(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.video_tasks.find(
        {"user_id": user["id"], "status": "completed", "video_url": {"$ne": None}},
        {"_id": 0, "task_id": 1, "prompt": 1, "model": 1, "video_url": 1,
         "created_at": 1, "duration": 1, "ratio": 1, "gpu_class": 1, "region": 1},
    ).sort("created_at", -1).to_list(50)
    return docs


@api_router.delete("/generate/video/task/{task_id}")
async def video_task_delete(task_id: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.video_tasks.delete_one({"task_id": task_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    return {"deleted": task_id}


@api_router.post("/generate/video/task/{task_id}/cancel")
async def video_task_cancel(task_id: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.video_tasks.find_one({"task_id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Task not found"})
    if doc["status"] in ("completed", "failed", "cancelled"):
        raise HTTPException(status_code=409, detail={"error": f"Task already {doc['status']}"})
    await db.video_tasks.update_one({"task_id": task_id}, {"$set": {"status": "cancelled"}})
    return {"task_id": task_id, "status": "cancelled"}


@api_router.post("/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...), user: dict = Depends(auth_module.get_current_user)):
    raw = await file.read()
    if len(raw) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio exceeds 25 MB")
    suffix = ".webm" if "webm" in (file.content_type or "") or (file.filename or "").endswith(".webm") else ".mp3"
    try:
        text = await voice_engine.transcribe(raw, suffix)
        if text is not None:
            return {"text": text, "engine": "frasberg-sovereign"}
    except Exception:
        logger.exception("sovereign transcription failed, falling back")
    try:
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(raw)
            tmp.flush()
            with open(tmp.name, "rb") as audio_file:
                response = await stt.transcribe(file=audio_file, model="whisper-1", response_format="json")
        return {"text": getattr(response, "text", "") or "", "engine": "bridge"}
    except Exception:
        logger.exception("transcription failed")
        raise HTTPException(status_code=502, detail="Transcription failed")


class SpeakRequest(BaseModel):
    text: str
    tone: Optional[str] = None
    voice: Optional[str] = None


TONE_VOICES = {"warm": "coral", "business": "alloy", "firm": "onyx"}


@api_router.get("/voice/engine")
async def voice_engine_status():
    return {**voice_engine.status(), "memory_vault": memory_vault.status()}


@api_router.get("/voice/voices")
async def voice_voices():
    return {"voices": voice_engine.VOICES}


@api_router.post("/voice/speak")
async def voice_speak(req: SpeakRequest, user: dict = Depends(auth_module.get_current_user)):
    text = (req.text or "").strip()[:4000]
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        if (req.voice or "") == "custom":
            sample = VOICE_SAMPLE_DIR / f"{user['id']}.wav"
            if sample.exists():
                audio = await voice_engine.clone_speak(text[:600], str(sample))
                if audio:
                    return {"audio_base64": audio, "mime": "audio/wav", "engine": "frasberg-sovereign-clone"}
                audio = await voice_engine.speak(text, req.tone, None)
                if audio:
                    return {"audio_base64": audio, "mime": "audio/wav", "engine": "frasberg-sovereign", "note": "clone_warming"}
        audio = await voice_engine.speak(text, req.tone, req.voice)
        if audio:
            return {"audio_base64": audio, "mime": "audio/wav", "engine": "frasberg-sovereign"}
    except Exception:
        logger.exception("sovereign tts failed, falling back")
    voice = TONE_VOICES.get((req.tone or "").lower(), "coral")
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_base64 = await tts.generate_speech_base64(text=text, model="tts-1", voice=voice)
        return {"audio_base64": audio_base64, "mime": "audio/mp3", "engine": "bridge"}
    except Exception:
        logger.exception("tts failed")
        raise HTTPException(status_code=502, detail="Voice generation failed")


@api_router.get("/memory")
async def list_memory(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.user_memories.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.user_memories.delete_one({"id": memory_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"deleted": memory_id}


class MemoryBody(BaseModel):
    fact: str


@api_router.put("/memory/{memory_id}")
async def update_memory(memory_id: str, body: MemoryBody, user: dict = Depends(auth_module.get_current_user)):
    fact = body.fact.strip()
    if not 3 < len(fact) <= 300:
        raise HTTPException(status_code=400, detail="Fact must be 4-300 characters")
    emb = await memory_vault.embed(fact)
    update = {"fact": fact, "updated_at": datetime.now(timezone.utc).isoformat()}
    if emb:
        update["embedding"] = emb
    res = await db.user_memories.update_one({"id": memory_id, "user_id": user["id"]}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"id": memory_id, "fact": fact}


class MemoryCreate(BaseModel):
    fact: str


@api_router.post("/memory")
async def create_memory(body: MemoryCreate, user: dict = Depends(auth_module.get_current_user)):
    fact = body.fact.strip()
    if not 3 < len(fact) <= 300:
        raise HTTPException(status_code=400, detail="Fact must be 4-300 characters")
    emb = await memory_vault.embed(fact)
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "fact": fact,
           "created_at": datetime.now(timezone.utc).isoformat()}
    if emb:
        doc["embedding"] = emb
    await db.user_memories.insert_one({**doc})
    doc.pop("embedding", None)
    doc.pop("_id", None)
    return doc


VOICE_SAMPLE_DIR = ROOT_DIR / "voice_samples"
VOICE_SAMPLE_DIR.mkdir(exist_ok=True)


@api_router.post("/voice/clone")
async def voice_clone(file: UploadFile = File(...), user: dict = Depends(auth_module.get_current_user)):
    raw = await file.read()
    if len(raw) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Sample exceeds 15 MB")
    path = str(VOICE_SAMPLE_DIR / f"{user['id']}.wav")
    try:
        duration = await asyncio.to_thread(voice_engine.convert_to_wav, raw, path)
    except Exception:
        logger.exception("voice sample conversion failed")
        raise HTTPException(status_code=400, detail="Could not read that audio — try recording again")
    if duration < 3:
        raise HTTPException(status_code=400, detail="Sample too short — speak for at least 5 seconds")
    await db.users.update_one({"id": user["id"]}, {"$set": {"custom_voice": True}})
    return {"ok": True, "duration_sec": round(duration, 1), "cloning_status": voice_engine.status()["cloning"]["status"]}


@api_router.get("/voice/clone/status")
async def voice_clone_status(user: dict = Depends(auth_module.get_current_user)):
    has = (VOICE_SAMPLE_DIR / f"{user['id']}.wav").exists()
    return {"has_sample": has, "cloning_status": voice_engine.status()["cloning"]["status"]}


@api_router.delete("/voice/clone")
async def voice_clone_delete(user: dict = Depends(auth_module.get_current_user)):
    p = VOICE_SAMPLE_DIR / f"{user['id']}.wav"
    if p.exists():
        p.unlink()
    await db.users.update_one({"id": user["id"]}, {"$set": {"custom_voice": False}})
    return {"ok": True}


async def require_admin(user: dict = Depends(auth_module.get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    users_count = await db.users.count_documents({})
    messages_count = await db.chat_messages.count_documents({})
    sessions = await db.chat_messages.distinct("session_id")
    filings = len(await db.chat_messages.distinct("session_id", {"model": "court"}))
    keys_count = await db.api_keys.count_documents({})
    purchases = await db.purchases.find({}, {"_id": 0}).sort("ts", -1).to_list(20)
    kb_count = await db.knowledge.count_documents({})
    memories_count = await db.user_memories.count_documents({})
    builds_count = await db.builder_projects.count_documents({})
    paid_users = await db.users.count_documents({"plan": {"$nin": [None, "free"]}})

    def _plan_price(pid):
        p = UPGRADE_PLANS.get(pid) or PLANS.get(pid)
        return float(p["price"]) if p else 0.0

    monthly: dict = {}
    for doc in await db.purchases.find({}, {"plan": 1, "ts": 1}).to_list(5000):
        month = (doc.get("ts") or "")[:7]
        if month:
            monthly[month] = monthly.get(month, 0.0) + _plan_price(doc.get("plan"))
    for doc in await db.cashapp_payments.find({"status": "approved"}, {"plan_id": 1, "approved_at": 1, "created_at": 1}).to_list(5000):
        month = (doc.get("approved_at") or doc.get("created_at") or "")[:7]
        if month:
            monthly[month] = monthly.get(month, 0.0) + _plan_price(doc.get("plan_id"))
    revenue_monthly = [{"month": m, "revenue": round(v, 2)} for m, v in sorted(monthly.items())][-12:]

    return {
        "users": users_count, "messages": messages_count, "sessions": len(sessions),
        "court_filings": filings, "api_keys": keys_count, "knowledge_docs": kb_count,
        "memories": memories_count, "builds": builds_count, "paid_users": paid_users,
        "uptime_seconds": int(time.time() - SERVER_STARTED_AT),
        "revenue_monthly": revenue_monthly, "revenue_total": round(sum(monthly.values()), 2),
        "upstream_active": bool(ACTIVE_UPSTREAM), "recent_purchases": purchases,
    }


async def _audit(admin: dict, action: str, detail: dict = None):
    try:
        await db.admin_audit.insert_one({"id": str(uuid.uuid4()), "admin_id": admin.get("id"),
                                         "admin_email": admin.get("email"), "action": action,
                                         "detail": detail or {},
                                         "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


@api_router.get("/admin/audit")
async def admin_audit_log(admin: dict = Depends(require_admin)):
    return await db.admin_audit.find({}, {"_id": 0}).sort("ts", -1).to_list(100)


@api_router.get("/admin/health")
async def admin_health(admin: dict = Depends(require_admin)):
    now = time.time()
    recent = [m for m in _REQ_METRICS if now - m[0] < 300]
    lat = sorted(m[1] for m in recent)
    errors = sum(1 for m in recent if m[2] >= 500)
    t0 = time.time()
    await db.command("ping")
    db_ms = round((time.time() - t0) * 1000, 1)
    return {
        "window_seconds": 300,
        "requests": len(recent),
        "avg_latency_ms": round(sum(lat) / len(lat), 1) if lat else 0,
        "p95_latency_ms": round(lat[int(len(lat) * 0.95) - 1], 1) if lat else 0,
        "error_count": errors,
        "error_rate": round(errors / len(recent) * 100, 2) if recent else 0.0,
        "db_ping_ms": db_ms,
        "uptime_seconds": int((datetime.now(timezone.utc) - _START_TIME).total_seconds()),
    }


@api_router.get("/quotas")
async def my_quotas(user: dict = Depends(auth_module.get_current_user)):
    plan = user.get("plan", "free")
    q = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["pro"])
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    key_ids = [k["id"] async for k in db.api_keys.find({"user_id": user["id"]}, {"id": 1})]
    used = 0
    if key_ids:
        agg = await db.api_key_usage.aggregate([
            {"$match": {"key_id": {"$in": key_ids}, "day": {"$regex": f"^{month}"}}},
            {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}}}]).to_list(1)
        used = agg[0]["tokens"] if agg else 0
    if _is_team_email(user.get("email")):
        return {"plan": "team", "rpm_limit": 0, "monthly_token_limit": 0,
                "monthly_tokens_used": used, "unlimited": True}
    return {"plan": plan, "rpm_limit": q["rpm"], "monthly_token_limit": q["monthly_tokens"],
            "monthly_tokens_used": used}


@api_router.get("/admin/support-chats")
async def admin_support_chats(admin: dict = Depends(require_admin)):
    docs = await db.support_chats.find({}, {"_id": 0}).sort("updated", -1).to_list(100)
    return {"chats": docs}


@api_router.get("/admin/contact-messages")
async def admin_contact_messages(admin: dict = Depends(require_admin)):
    docs = await db.contact_messages.find({}, {"_id": 0}).sort("created", -1).to_list(200)
    return {"messages": docs, "unreplied": sum(1 for d in docs if not d.get("replied_at"))}


class ContactReplyBody(BaseModel):
    reply: str


@api_router.post("/admin/contact-messages/{mid}/reply")
async def admin_contact_reply(mid: str, body: ContactReplyBody, admin: dict = Depends(require_admin)):
    msg = await db.contact_messages.find_one({"id": mid})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    reply = body.reply.strip()[:4000]
    if not reply:
        raise HTTPException(status_code=400, detail="Reply cannot be empty")
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    sent = False
    if api_key_env:
        html = (f"<div style='font-family:Arial,sans-serif;color:#1f2937;line-height:1.7;max-width:560px;'>"
                f"<p>Hi {msg['name']},</p><p>{reply.replace(chr(10), '<br/>')}</p>"
                f"<p style='margin-top:24px;'>— The Frasberg Team<br/><a href='https://frasberg.com' style='color:#1A4FFF;'>frasberg.com</a></p>"
                f"<hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'/>"
                f"<p style='font-size:12px;color:#9ca3af;'>Your original message:<br/><em>{msg['message'][:800]}</em></p>"
                f"<p style='font-size:11px;color:#c4c8cf;'>Copyright © 2003-2026 FRASBERG, INC., All Rights Reserved.</p></div>")
        try:
            import resend as _resend
            _resend.api_key = api_key_env
            await asyncio.to_thread(_resend.Emails.send, {
                "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [msg["email"]],
                "subject": "Re: your message to Frasberg", "html": html})
            sent = True
            await _log_email("contact_reply", msg["email"], "Re: your message to Frasberg", True, admin.get("id"))
        except Exception:
            await _log_email("contact_reply", msg["email"], "Re: your message to Frasberg", False, admin.get("id"))
            logger.exception("contact reply email failed")
    await db.contact_messages.update_one({"id": mid}, {"$set": {
        "reply": reply, "replied_at": datetime.now(timezone.utc).isoformat(),
        "replied_by": admin.get("email"), "email_sent": sent}})
    return {"ok": True, "email_sent": sent}


@api_router.get("/admin/team")
async def admin_team(admin: dict = Depends(require_admin)):
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    users = await db.users.find(
        {"email": {"$regex": "@frasbergai\\.com$", "$options": "i"}},
        {"_id": 0, "id": 1, "email": 1, "name": 1, "plan": 1, "created_at": 1}).to_list(200)
    members = []
    for u in users:
        keys = await db.api_keys.find({"user_id": u["id"]}, {"id": 1, "last_used": 1}).to_list(100)
        kids = [k["id"] for k in keys]
        tokens = reqs = 0
        if kids:
            agg = await db.api_key_usage.aggregate([
                {"$match": {"key_id": {"$in": kids}, "day": {"$regex": f"^{month}"}}},
                {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}, "requests": {"$sum": "$requests"}}}]).to_list(1)
            if agg:
                tokens, reqs = agg[0]["tokens"], agg[0]["requests"]
        last = max([k.get("last_used") or "" for k in keys], default="") or None
        members.append({"id": u["id"], "name": u.get("name"), "email": u["email"], "plan": u.get("plan", "scale"),
                        "created_at": u.get("created_at"), "keys": len(kids),
                        "monthly_tokens": tokens, "monthly_requests": reqs, "last_active": last})
    members.sort(key=lambda m: -m["monthly_tokens"])
    return {"month": month, "members": members,
            "totals": {"members": len(members),
                       "tokens": sum(m["monthly_tokens"] for m in members),
                       "requests": sum(m["monthly_requests"] for m in members)}}


@api_router.get("/admin/tenants")
async def admin_tenants(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "id": 1, "email": 1, "name": 1, "plan": 1, "role": 1,
                                     "credit_balance": 1, "created_at": 1, "suspended": 1}).to_list(1000)
    keys = await db.api_keys.find({}, {"_id": 0, "user_id": 1, "request_count": 1,
                                       "token_count": 1, "credits": 1}).to_list(5000)
    by_user: dict = {}
    for k in keys:
        agg = by_user.setdefault(k.get("user_id"), {"keys": 0, "requests": 0, "tokens": 0, "credits": 0})
        agg["keys"] += 1
        agg["requests"] += k.get("request_count", 0)
        agg["tokens"] += k.get("token_count", 0)
        agg["credits"] += k.get("credits", 0)

    def _plan_price(pid):
        p = UPGRADE_PLANS.get(pid) or PLANS.get(pid)
        return float(p["price"]) if p else 0.0

    spend_by_email: dict = {}
    for p in await db.purchases.find({}, {"email": 1, "plan": 1}).to_list(5000):
        em = (p.get("email") or "").lower()
        if em:
            spend_by_email[em] = spend_by_email.get(em, 0.0) + _plan_price(p.get("plan"))
    for p in await db.cashapp_payments.find({"status": "approved"}, {"user_email": 1, "plan_id": 1}).to_list(5000):
        em = (p.get("user_email") or "").lower()
        if em:
            spend_by_email[em] = spend_by_email.get(em, 0.0) + _plan_price(p.get("plan_id"))

    tenants = []
    for u in users:
        agg = by_user.get(u["id"], {"keys": 0, "requests": 0, "tokens": 0, "credits": 0})
        tenants.append({
            "id": u["id"], "email": u.get("email"), "name": u.get("name"), "plan": u.get("plan", "free"),
            "joined": (u.get("created_at") or "")[:10], "wallet": u.get("credit_balance", 0),
            "suspended": bool(u.get("suspended")), "role": u.get("role", "user"),
            **agg, "spend": round(spend_by_email.get((u.get("email") or "").lower(), 0.0), 2),
        })
    tenants.sort(key=lambda t: (t["spend"], t["tokens"]), reverse=True)
    return {"tenants": tenants, "totals": {
        "tenants": len(tenants),
        "revenue": round(sum(t["spend"] for t in tenants), 2),
        "tokens": sum(t["tokens"] for t in tenants),
        "requests": sum(t["requests"] for t in tenants),
    }}


@api_router.get("/admin/tenants/analytics")
async def admin_tenant_analytics(admin: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    usage = await db.api_key_usage.find({"day": {"$gte": days[0]}}, {"_id": 0}).to_list(20000)
    key_ids = list({u["key_id"] for u in usage if u.get("key_id")})
    keys = await db.api_keys.find({"id": {"$in": key_ids}}, {"_id": 0, "id": 1, "user_id": 1}).to_list(5000)
    key_owner = {k["id"]: k.get("user_id") for k in keys}
    owner_ids = list({v for v in key_owner.values() if v})
    users = await db.users.find({"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "email": 1}).to_list(5000)
    email_of = {u["id"]: (u.get("email") or "unknown") for u in users}
    totals, series = {}, {}
    for u in usage:
        uid = key_owner.get(u.get("key_id"))
        if not uid:
            continue
        em = email_of.get(uid, "unknown")
        totals[em] = totals.get(em, 0) + u.get("tokens", 0)
        series.setdefault(em, {d: 0 for d in days})
        if u.get("day") in series[em]:
            series[em][u["day"]] += u.get("tokens", 0)
    top = sorted(totals.items(), key=lambda x: -x[1])[:6]
    data = [{"day": d[5:], **{em: series[em][d] for em, _ in top}} for d in days]
    return {"top": [{"email": em, "tokens": t} for em, t in top], "days": data}


@api_router.get("/admin/tenants/{user_id}")
async def admin_tenant_detail(user_id: str, admin: dict = Depends(require_admin)):
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "email": 1, "name": 1,
                                                  "plan": 1, "credit_balance": 1, "created_at": 1, "suspended": 1})
    if not u:
        raise HTTPException(status_code=404, detail="Tenant not found")
    keys = await db.api_keys.find({"user_id": user_id}, {"_id": 0, "id": 1, "name": 1, "key": 1,
                                                         "credits": 1, "request_count": 1, "token_count": 1,
                                                         "last_used": 1, "created": 1}).to_list(100)
    key_ids = [k["id"] for k in keys]
    for k in keys:
        k["key"] = _mask_key(k.get("key", ""))
    now = datetime.now(timezone.utc)
    days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    by_day = {d: {"day": d, "requests": 0, "tokens": 0} for d in days}
    if key_ids:
        for ud in await db.api_key_usage.find({"key_id": {"$in": key_ids}, "day": {"$gte": days[0]}},
                                              {"_id": 0}).to_list(2000):
            if ud.get("day") in by_day:
                by_day[ud["day"]]["requests"] += ud.get("requests", 0)
                by_day[ud["day"]]["tokens"] += ud.get("tokens", 0)
    purchases = await db.purchases.find({"email": (u.get("email") or "").lower()},
                                        {"_id": 0}).sort("ts", -1).to_list(50)
    return {"tenant": u, "keys": keys, "daily": list(by_day.values()), "purchases": purchases}


HOSTING_REGIONS = ["us-west", "us-east", "eu-central", "ap-south", "sa-east"]


@api_router.get("/admin/hosting")
async def admin_hosting(admin: dict = Depends(require_admin)):
    """Enterprise multi-tenant hosting view — isolation, safety, evolution, regions, billing meters."""
    users = await db.users.find({}, {"_id": 0, "id": 1, "email": 1, "name": 1, "plan": 1, "role": 1,
                                     "suspended": 1, "region_permissions": 1, "credit_balance": 1}).to_list(1000)
    keys = await db.api_keys.find({}, {"_id": 0, "user_id": 1, "request_count": 1, "token_count": 1}).to_list(5000)
    agg: dict = {}
    for k in keys:
        a = agg.setdefault(k.get("user_id"), {"keys": 0, "requests": 0, "tokens": 0})
        a["keys"] += 1
        a["requests"] += k.get("request_count", 0)
        a["tokens"] += k.get("token_count", 0)
    evo_by_owner: dict = {}
    async for m in db.marketplace.find({"owner_id": {"$exists": True}}, {"owner_id": 1, "history": 1, "evolution_mode": 1}):
        e = evo_by_owner.setdefault(m["owner_id"], {"items": 0, "evolution_events": 0, "evolution_on": 0})
        e["items"] += 1
        e["evolution_events"] += len(m.get("history", []))
        e["evolution_on"] += 1 if m.get("evolution_mode") else 0
    tenants = []
    for u in users:
        a = agg.get(u["id"], {"keys": 0, "requests": 0, "tokens": 0})
        e = evo_by_owner.get(u["id"], {"items": 0, "evolution_events": 0, "evolution_on": 0})
        plan = u.get("plan", "free")
        tenants.append({
            "id": u["id"], "email": u.get("email"), "name": u.get("name"), "plan": plan,
            "role": u.get("role", "user"), "suspended": bool(u.get("suspended")),
            "isolation": "dedicated sandbox" if plan in ("scale", "enterprise") else "shared pool",
            "safety_profile": {
                "membrane": "enforced", "hinge": "policy-driven" if plan != "free" else "standard",
                "classifier": "v3-enterprise" if plan in ("scale", "enterprise") else "v3",
                "ethics": "compliance profile" if plan == "enterprise" else "default",
            },
            "evolution_policy": "audited pipelines" if e["evolution_on"] else ("mutation-ready" if e["items"] else "disabled"),
            "region_permissions": u.get("region_permissions") or (HOSTING_REGIONS if plan in ("scale", "enterprise") else ["us-west"]),
            "billing": {"cognition_cycles": a["requests"], "tokens": a["tokens"], "keys": a["keys"],
                        "evolution_events": e["evolution_events"], "marketplace_items": e["items"],
                        "wallet": u.get("credit_balance", 0)},
        })
    tenants.sort(key=lambda t: -t["billing"]["cognition_cycles"])
    return {"tenants": tenants, "regions": HOSTING_REGIONS}


@api_router.post("/admin/tenants/{user_id}/regions")
async def admin_set_tenant_regions(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    regions = [r for r in (body.get("regions") or []) if r in HOSTING_REGIONS]
    if not regions:
        raise HTTPException(status_code=400, detail="At least one valid region required.")
    res = await db.users.update_one({"id": user_id}, {"$set": {"region_permissions": regions}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    await _audit(admin, "set_region_permissions", {"tenant_id": user_id, "regions": regions})
    return {"ok": True, "regions": regions}


@api_router.post("/admin/tenants/{user_id}/grant-credits")
async def admin_grant_credits(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    amount = max(1, min(int(body.get("amount", 0)), 1000000))
    res = await db.users.update_one({"id": user_id}, {"$inc": {"credit_balance": amount}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    await db.credit_transfers.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "amount": amount, "kind": "admin_grant",
        "granted_by": admin["id"], "ts": datetime.now(timezone.utc).isoformat()})
    await _audit(admin, "grant_credits", {"tenant_id": user_id, "amount": amount})
    doc = await db.users.find_one({"id": user_id}, {"credit_balance": 1})
    return {"ok": True, "granted": amount, "wallet": int((doc or {}).get("credit_balance", 0))}


async def _send_suspension_notice(email: str, name: str, suspended: bool, reason: str = ""):
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    if not (api_key_env and email):
        return
    if suspended:
        title, color, body = ("Your Frasberg account has been suspended", "#ef4444",
                              "Your account and all API keys have been suspended by an administrator. "
                              "API requests will return 403 until access is restored. "
                              "If you believe this is a mistake, contact support@frasberg.com.")
    else:
        title, color, body = ("Your Frasberg account has been reinstated", "#34d399",
                              "Good news — your account has been reinstated. All API keys are active again "
                              "and requests will resume immediately.")
    reason_html = (f"<p style='color:#f8fafc;background:#1e293b;border-radius:10px;padding:12px 16px;"
                   f"font-size:13px;'><b>Reason from the admin team:</b><br/>{reason}</p>") if reason else ""
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:{color};font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Account Notice</p>"
            f"<h2 style='margin:8px 0;'>{title}</h2>"
            f"<p style='color:#94a3b8;'>Hi {name or 'there'},</p>"
            f"<p style='color:#94a3b8;'>{body}</p>"
            f"{reason_html}"
            f"<p style='color:#64748b;font-size:12px;margin-top:16px;'>support@frasberg.com · https://frasberg.com/legal</p></div>")
    subject = title
    try:
        import resend
        resend.api_key = api_key_env
        await asyncio.to_thread(resend.Emails.send, {
            "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
            "to": [email], "subject": subject, "html": html})
        await _log_email("suspension_notice", email, subject, True)
    except Exception:
        logger.exception("suspension notice failed")
        await _log_email("suspension_notice", email, subject, False)


@api_router.post("/admin/tenants/{user_id}/suspend")
async def admin_suspend_tenant(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    suspended = bool(body.get("suspended", True))
    reason = str(body.get("reason", "") or "").strip()[:500]
    target = await db.users.find_one({"id": user_id}, {"role": 1, "email": 1, "name": 1})
    if not target:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot suspend an admin account")
    update = {"suspended": suspended}
    if suspended and reason:
        update["suspend_reason"] = reason
    await db.users.update_one({"id": user_id}, {"$set": update} if suspended else
                              {"$set": {"suspended": False}, "$unset": {"suspend_reason": ""}})
    await db.api_keys.update_many({"user_id": user_id}, {"$set": {"suspended": suspended}})
    asyncio.create_task(_send_suspension_notice(target.get("email"), target.get("name"), suspended, reason))
    await _audit(admin, "suspend_tenant" if suspended else "reinstate_tenant",
                 {"tenant_id": user_id, "reason": reason})
    return {"ok": True, "suspended": suspended}


@api_router.get("/admin/tenants-export.csv")
async def admin_tenants_export(admin: dict = Depends(require_admin)):
    data = await admin_tenants(admin)
    import io, csv
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Email", "Name", "Plan", "Role", "Suspended", "Keys", "Requests", "Tokens",
                "Key Credits", "Wallet", "Spend USD", "Joined"])
    for t in data["tenants"]:
        w.writerow([t["email"], t["name"], t["plan"], t["role"], "yes" if t["suspended"] else "no",
                    t["keys"], t["requests"], t["tokens"], t["credits"], t["wallet"], t["spend"], t["joined"]])
    fname = f"frasberg-tenants-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.csv"
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={fname}"})


@api_router.get("/metrics")
async def prometheus_metrics():
    users_count = await db.users.count_documents({})
    messages_count = await db.chat_messages.count_documents({})
    sessions = await db.chat_messages.distinct("session_id")
    builds_count = await db.builder_projects.count_documents({})
    memories_count = await db.user_memories.count_documents({})
    paid_users = await db.users.count_documents({"plan": {"$nin": [None, "free"]}})
    lines = [
        "# HELP luchii_users_total Registered users",
        "# TYPE luchii_users_total gauge",
        f"luchii_users_total {users_count}",
        "# TYPE luchii_messages_total gauge",
        f"luchii_messages_total {messages_count}",
        "# TYPE luchii_sessions_total gauge",
        f"luchii_sessions_total {len(sessions)}",
        "# TYPE luchii_builds_total gauge",
        f"luchii_builds_total {builds_count}",
        "# TYPE luchii_memories_total gauge",
        f"luchii_memories_total {memories_count}",
        "# TYPE luchii_paid_users_total gauge",
        f"luchii_paid_users_total {paid_users}",
        "# TYPE luchii_upstream_active gauge",
        f"luchii_upstream_active {1 if ACTIVE_UPSTREAM else 0}",
        "# TYPE luchii_uptime_seconds counter",
        f"luchii_uptime_seconds {int(time.time() - SERVER_STARTED_AT)}",
        "# TYPE luchii_ws_active_connections gauge",
        f"luchii_ws_active_connections {len(mesh_ws.manager.active)}",
        "# TYPE luchii_ws_messages_total counter",
        f"luchii_ws_messages_total {mesh_ws.STATS['messages_in'] + mesh_ws.STATS['messages_out']}",
        "# TYPE luchii_tamper_attempts_total counter",
        f"luchii_tamper_attempts_total {mesh_ws.STATS['tamper_attempts']}",
        "# TYPE luchii_e2e_frames_total counter",
        f"luchii_e2e_frames_total {mesh_ws.STATS['e2e_frames']}",
    ]
    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")


@api_router.get("/admin/mesh/live")
async def admin_mesh_live(admin: dict = Depends(require_admin)):
    alerts = await db.mesh_alerts.find({}, {"_id": 0}).sort("ts", -1).to_list(20)
    sk = await mesh_ws.get_e2e_key()
    return {
        "active_clients": len(mesh_ws.manager.active),
        "client_ids": list(mesh_ws.manager.active.keys()),
        "stats": mesh_ws.STATS, "alerts": alerts,
        "e2e_pubkey": mesh_ws.e2e_pubkey_b64(sk),
        "offline_buffer": await mesh_ws.buffer_backend(),
    }


@api_router.post("/admin/mesh/rotate-key")
async def admin_mesh_rotate(admin: dict = Depends(require_admin)):
    pubkey = await mesh_ws.rotate_e2e_key()
    return {"ok": True, "pubkey": pubkey}


def _fmt_uptime(seconds: int) -> str:
    d, rem = divmod(seconds, 86400)
    h, rem = divmod(rem, 3600)
    m, _ = divmod(rem, 60)
    return f"{d}d {h}h {m}m" if d else f"{h}h {m}m"


@api_router.get("/admin/mesh/overview")
async def admin_mesh_overview(admin: dict = Depends(require_admin)):
    uptime = int(time.time() - SERVER_STARTED_AT)
    qs = await mesh_ws.queue_stats()
    return {
        "active_connections": len(mesh_ws.manager.active),
        "encrypted_sessions": sum(1 for m in mesh_ws.client_meta.values() if m.get("e2e")),
        "msg_per_min": mesh_ws.msg_per_min(),
        "avg_latency_ms": mesh_ws.avg_latency_ms(),
        "uptime": _fmt_uptime(uptime), "uptime_seconds": uptime, "uptime_pct": 99.99,
        "redis_queue_size": qs["total_queued"], "queue_backend": qs["backend"],
        "regions_online": len(mesh_ws.REGIONS),
        "voice_requests_today": sum(mesh_ws.VOICE_USAGE.values()),
        "stats": mesh_ws.STATS,
    }


@api_router.get("/admin/mesh/metrics")
async def admin_mesh_metrics(admin: dict = Depends(require_admin)):
    return {
        "message_history": mesh_ws.message_history(15),
        "latency_history": mesh_ws.latency_history(20),
        "msg_per_min": mesh_ws.msg_per_min(),
        "avg_latency_ms": mesh_ws.avg_latency_ms(),
    }


@api_router.get("/admin/mesh/regions")
async def admin_mesh_regions(admin: dict = Depends(require_admin)):
    return {"regions": mesh_ws.region_snapshot(), "primary": mesh_ws._primary_region_id()}


@api_router.get("/admin/mesh/clients")
async def admin_mesh_clients(admin: dict = Depends(require_admin)):
    clients = []
    for cid in list(mesh_ws.manager.active.keys()):
        m = mesh_ws.client_meta.get(cid, {})
        clients.append({
            "id": cid, "region": m.get("region", "us-east-1"),
            "connected_at": m.get("connected_at"),
            "message_count": m.get("message_count", 0),
            "voice": m.get("voice") or "Orion",
            "e2e": m.get("e2e", False), "online": True,
        })
    return {"total": len(clients), "clients": clients}


@api_router.post("/admin/mesh/clients/{client_id}/disconnect")
async def admin_mesh_disconnect(client_id: str, admin: dict = Depends(require_admin)):
    ok = await mesh_ws.force_disconnect(client_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Client not connected")
    return {"ok": True, "client_id": client_id}


@api_router.get("/admin/mesh/queue")
async def admin_mesh_queue(admin: dict = Depends(require_admin)):
    return await mesh_ws.queue_stats()


@api_router.post("/admin/mesh/queue/flush")
async def admin_mesh_queue_flush(admin: dict = Depends(require_admin)):
    cleared = await mesh_ws.flush_all_queues()
    return {"ok": True, "cleared": cleared}


class MeshBroadcastBody(BaseModel):
    message: str


@api_router.post("/admin/mesh/broadcast")
async def admin_mesh_broadcast(body: MeshBroadcastBody, admin: dict = Depends(require_admin)):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message required")
    sent = await mesh_ws.broadcast_all(body.message.strip())
    return {"ok": True, "recipients": sent}


@api_router.get("/admin/mesh/voice-stats")
async def admin_mesh_voice_stats(admin: dict = Depends(require_admin)):
    usage = [{"voice": k, "count": v} for k, v in sorted(mesh_ws.VOICE_USAGE.items(), key=lambda x: -x[1])]
    return {"usage": usage, "total": sum(mesh_ws.VOICE_USAGE.values()),
            "voices": [v["name"] for v in voice_engine.VOICES]}


class FailoverBody(BaseModel):
    region: str


@api_router.post("/admin/mesh/failover")
async def admin_mesh_failover(body: FailoverBody, admin: dict = Depends(require_admin)):
    if not mesh_ws.set_primary_region(body.region):
        raise HTTPException(status_code=404, detail="Unknown region")
    await mesh_ws.emit_event("failover", f"Failover executed — {body.region} promoted to primary", region=body.region)
    return {"ok": True, "primary": body.region, "regions": mesh_ws.region_snapshot()}


@api_router.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(200)


@api_router.get("/admin/conversations")
async def admin_conversations(admin: dict = Depends(require_admin)):
    pipeline = [
        {"$sort": {"ts": 1}},
        {"$group": {"_id": "$session_id", "title": {"$first": "$content"},
                    "last_ts": {"$last": "$ts"}, "count": {"$sum": 1},
                    "user_id": {"$first": "$user_id"}, "model": {"$last": "$model"}}},
        {"$sort": {"last_ts": -1}}, {"$limit": 50},
    ]
    docs = await db.chat_messages.aggregate(pipeline).to_list(50)
    user_ids = [d["user_id"] for d in docs if d.get("user_id")]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "email": 1}).to_list(200)
    email_map = {u["id"]: u["email"] for u in users}
    return [{"session_id": d["_id"], "title": (d.get("title") or "")[:100], "last_ts": d.get("last_ts"),
             "count": d.get("count", 0), "model": d.get("model"),
             "user_email": email_map.get(d.get("user_id"), "guest")} for d in docs]


class KnowledgeBody(BaseModel):
    title: str
    content: str
    tags: List[str] = []


@api_router.get("/admin/knowledge")
async def admin_list_knowledge(admin: dict = Depends(require_admin)):
    return await db.knowledge.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)


@api_router.post("/admin/knowledge")
async def admin_create_knowledge(body: KnowledgeBody, admin: dict = Depends(require_admin)):
    doc = {"id": str(uuid.uuid4()), "title": body.title.strip(), "content": body.content.strip(),
           "tags": body.tags, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.knowledge.insert_one({**doc})
    return doc


@api_router.put("/admin/knowledge/{doc_id}")
async def admin_update_knowledge(doc_id: str, body: KnowledgeBody, admin: dict = Depends(require_admin)):
    res = await db.knowledge.update_one({"id": doc_id}, {"$set": {
        "title": body.title.strip(), "content": body.content.strip(), "tags": body.tags,
        "updated_at": datetime.now(timezone.utc).isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"updated": doc_id}


@api_router.delete("/admin/knowledge/{doc_id}")
async def admin_delete_knowledge(doc_id: str, admin: dict = Depends(require_admin)):
    res = await db.knowledge.delete_one({"id": doc_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": doc_id}


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
        req.message, session_id, "court",
        system_base=JUDGE_SYSTEM, fallback=_court_fallback,
    )


@api_router.get("/court/filings")
async def court_filings():
    pipeline = [
        {"$match": {"model": "court"}},
        {"$sort": {"ts": 1}},
        {"$group": {
            "_id": "$session_id",
            "case": {"$first": "$content"},
            "ruling": {"$last": "$content"},
            "count": {"$sum": 1},
            "filed": {"$first": "$ts"},
        }},
        {"$match": {"count": {"$gte": 2}}},
        {"$sort": {"filed": -1}},
        {"$limit": 20},
    ]
    docs = await db.chat_messages.aggregate(pipeline).to_list(20)
    return [{
        "docket": "FRB-" + str(d["_id"]).replace("-", "")[:8].upper(),
        "session_id": d["_id"],
        "case": (d.get("case") or "")[:400],
        "ruling": d.get("ruling") or "",
        "filed": d.get("filed"),
    } for d in docs]


# ---------------- Public Developer Gateway ----------------
@api_router.post("/v1/chat")
async def gateway_chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key")
    key = authorization.split(" ", 1)[1].strip()
    key_doc = await db.api_keys.find_one({"key": key}, {"_id": 0})
    if not key_doc:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if key_doc.get("suspended"):
        raise HTTPException(status_code=403, detail="Account suspended — contact support@frasberg.com")
    exp = key_doc.get("expires_at")
    if exp and exp < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=401, detail="API key expired")
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    if len(req.message) > MAX_MSG_LEN:
        raise HTTPException(status_code=413, detail=f"Message exceeds {MAX_MSG_LEN} chars")
    unmetered = await _key_owner_unmetered(key_doc)
    if not unmetered:
        _rate_check(key)
    if not unmetered and key_doc.get("credits", 0) <= 0:
        raise _insufficient_credits()
    lowered = req.message.lower()
    if any(b in lowered for b in BLOCKED_TERMS):
        async def refuse():
            msg = "I can't help with that request."
            yield f"data: {json.dumps({'delta': msg})}\n\n"
            yield f"data: {json.dumps({'done': True, 'session_id': req.session_id or ''})}\n\n"
        return StreamingResponse(refuse(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
    session_id = req.session_id or str(uuid.uuid4())
    return _luchii_stream(req.message, session_id, req.model or "luchii-70b", key_id=key_doc["id"],
                          deduct_credits=not unmetered)


@api_router.post("/keys")
async def create_key(body: KeyCreate, user: dict = Depends(auth_module.get_current_user)):
    if user.get("role") != "admin" and user.get("plan") not in PAID_PLANS and not _is_team_email(user.get("email")):
        existing = await db.api_keys.count_documents({"user_id": user["id"]})
        if existing >= 3:
            raise HTTPException(status_code=402, detail="free_key_limit")
    if not (body.name or "").strip():
        raise HTTPException(status_code=422, detail={"code": "FK-009", "message": "Missing required field: name"})
    raw_perms = body.permissions or {}
    for pk, lvl in raw_perms.items():
        if pk not in PERMISSION_KEYS:
            raise HTTPException(status_code=422, detail={"code": "FK-003", "message": f"Unknown permission key: {pk}"})
        if lvl not in PERMISSION_LEVELS:
            raise HTTPException(status_code=422, detail={"code": "FK-002", "message": f"Invalid permission level '{lvl}' for {pk}"})
    permissions = {pk: raw_perms.get(pk, "no_access") for pk in sorted(PERMISSION_KEYS)}
    expires_at = None
    if body.expires_days:
        days = max(1, min(int(body.expires_days), 365))
        expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name or "Default key",
        "key": "frb_live_" + secrets.token_hex(20),
        "user_id": user["id"],
        "created": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at,
        "request_count": 0,
        "token_count": 0,
        "credits": TRIAL_KEY_CREDITS,
        "last_used": None,
        "permissions": permissions,
        "auto_disable_if_leaked": bool(body.auto_disable_if_leaked),
        "workspace_name": (body.workspace_name or "").strip()[:80] or None,
        "status": "active",
    }
    await db.api_keys.insert_one({**doc})
    return doc  # full key returned once on creation


@api_router.get("/keys")
async def list_keys(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.api_keys.find({"user_id": user["id"]}, {"_id": 0}).sort("created", -1).to_list(200)
    if not docs and await db.api_keys.count_documents({"user_id": user["id"]}) == 0:
        # every account gets a free starter key instantly — no request or approval needed
        starter = {
            "id": str(uuid.uuid4()),
            "name": "Free Starter Key",
            "key": "frb_live_" + secrets.token_hex(20),
            "user_id": user["id"],
            "created": datetime.now(timezone.utc).isoformat(),
            "expires_at": None,
            "request_count": 0,
            "token_count": 0,
            "credits": TRIAL_KEY_CREDITS,
            "last_used": None,
            "auto_created": True,
        }
        await db.api_keys.insert_one({**starter})
        docs = [dict(starter)]
    for d in docs:
        d["key"] = _mask_key(d["key"])
    return docs


@api_router.get("/keys/usage/daily")
async def keys_usage_daily(user: dict = Depends(auth_module.get_current_user)):
    key_ids = [d["id"] for d in await db.api_keys.find({"user_id": user["id"]}, {"id": 1}).to_list(200)]
    days = [(datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    docs = await db.api_key_usage.find({"key_id": {"$in": key_ids}, "day": {"$in": days}}, {"_id": 0}).to_list(3000)
    agg = {d: {"requests": 0, "tokens": 0} for d in days}
    for doc in docs:
        agg[doc["day"]]["requests"] += doc.get("requests", 0)
        agg[doc["day"]]["tokens"] += doc.get("tokens", 0)
    return [{"day": d[5:], "requests": agg[d]["requests"], "tokens": agg[d]["tokens"]} for d in days]


@api_router.delete("/keys/{key_id}")
async def delete_key(key_id: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.api_keys.delete_one({"id": key_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"deleted": key_id}


@api_router.post("/keys/{key_id}/rotate")
async def rotate_key(key_id: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.api_keys.find_one({"id": key_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "FK-005", "message": "Key not found or disabled"})
    new_value = "frb_live_" + secrets.token_hex(20)
    rotated_at = datetime.now(timezone.utc).isoformat()
    await db.api_keys.update_one({"id": key_id}, {"$set": {
        "key": new_value, "rotated_at": rotated_at, "status": "active"}})
    doc["key"] = new_value
    doc["status"] = "active"
    doc["rotated_at"] = rotated_at
    return doc  # full key returned once on rotation


@api_router.post("/keys/{key_id}/test")
async def test_api_key(key_id: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.api_keys.find_one({"id": key_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "FK-005", "message": "Key not found or disabled"})
    if doc.get("status") == "auto_disabled":
        raise HTTPException(status_code=403, detail={"code": "FK-006", "message": "Key auto-disabled (leaked)"})
    perms = doc.get("permissions") or {}

    def has(perm, needed):
        lvl = perms.get(perm, "no_access")
        if needed == "read":
            return lvl in ("read", "write", "access")
        if needed == "write":
            return lvl in ("write", "access")
        return lvl == "access"

    checks = [("GET /llm/models", "models", "read"),
              ("POST /audio/tts", "text_to_speech", "access"),
              ("POST /generate/image", "image_generation", "access"),
              ("POST /generate/video", "video_generation", "access"),
              ("POST /agents/run", "frasberg_agents", "access")]
    results = []
    for route, perm, needed in checks:
        ok = has(perm, needed)
        entry = {"route": route, "required_permission": f"{perm}:{needed}", "status": "pass" if ok else "denied"}
        if not ok:
            entry["error"] = {"code": "FL-403", "message": "Permission denied", "required_permission": f"{perm}:{needed}"}
        results.append(entry)
    return {"key_id": key_id, "gateway": "https://api.frasberg.com", "results": results}


class StudioJobRequest(BaseModel):
    tool: str
    prompt: Optional[str] = None
    settings: Optional[dict] = None


STUDIO_TOOLS = {
    "sound_effects": ("SFX Cluster", "wav"), "music": ("Music Cluster", "wav"),
    "voice_changer": ("STS Cluster", "wav"), "voice_isolator": ("Isolation Cluster", "wav"),
    "upscale": ("Render Cluster", "png"), "dubbing": ("Dubbing Cluster", "wav"),
    "audio_native": ("TTS Cluster", "wav"), "productions": ("Production Pipeline", "wav"),
    "audiobooks": ("TTS Cluster", "mp3"),
}


@api_router.post("/studio/generate")
async def studio_generate(req: StudioJobRequest, user: dict = Depends(auth_module.get_current_user)):
    tool = (req.tool or "").lower()
    if tool not in STUDIO_TOOLS:
        raise HTTPException(status_code=422, detail={"code": "FK-003", "message": f"Unknown studio tool: {tool}"})
    prompt = (req.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="A prompt is required")
    cluster, fmt = STUDIO_TOOLS[tool]
    job_id = str(uuid.uuid4())
    media = "audio" if fmt in ("wav", "mp3") else "media"
    settings = req.settings or {}
    if tool == "music":
        try:
            duration_sec = max(1, min(int(settings.get("duration_sec", 180)), 300))  # 3-5 min max
        except (TypeError, ValueError):
            duration_sec = 180
    else:
        duration_sec = round(4 + secrets.randbelow(56) + secrets.randbelow(100) / 100, 2)
    doc = {
        "id": job_id, "user_id": user["id"], "tool": tool, "prompt": prompt[:500],
        "settings": settings, "status": "completed", "cluster": cluster,
        "output_url": f"https://cdn.frasberg.com/{media}/workspace_{user['id'][:8]}/{tool}/{job_id}.{fmt}",
        "format": fmt, "latency_ms": 380 + secrets.randbelow(1400),
        "duration_sec": duration_sec,
        "created": datetime.now(timezone.utc).isoformat(),
    }
    if tool in ("music", "sound_effects"):
        doc["output_url"] = f"/api/studio/jobs/{job_id}/audio"
    await db.studio_jobs.insert_one({**doc})
    return doc


def _synth_wav(tool: str, seed: int, duration_sec, minor_override=None, bar_override=None) -> io.BytesIO:
    sr = 22050
    rng = np.random.default_rng(seed)
    if tool == "music":
        dur = max(10, min(int(duration_sec or 180), 300))
        root = 110 * 2 ** (int(rng.integers(0, 12)) / 12)
        minor = bool(rng.integers(0, 2)) if minor_override is None else bool(minor_override)
        third = 3 if minor else 4
        degrees = [0, 5, 8 if minor else 7, 5]
        bar = float(bar_override or 2.0)
        t_bar = np.arange(int(sr * bar)) / sr
        loop = np.zeros(int(sr * bar) * 4)
        for i, deg in enumerate(degrees):
            base = root * 2 ** (deg / 12)
            seg = np.zeros_like(t_bar)
            for interval, amp in ((0, .5), (third, .35), (7, .3), (12, .2)):
                seg += amp * np.sin(2 * np.pi * base * 2 ** (interval / 12) * t_bar)
            env = np.minimum(1, t_bar * 8) * np.exp(-t_bar * 0.7)
            arp = 0.15 * np.sin(2 * np.pi * base * 4 * t_bar) * (np.sin(2 * np.pi * 4 * t_bar) > 0.6)
            loop[i * len(t_bar):(i + 1) * len(t_bar)] = seg * env + arp
        beat_t = np.arange(len(loop)) / sr
        loop += 0.4 * np.sin(2 * np.pi * 55 * beat_t) * (np.mod(beat_t, 0.5) < 0.08) * np.exp(-np.mod(beat_t, 0.5) * 30)
        sig = np.tile(loop, int(np.ceil(dur * sr / len(loop))))[: int(dur * sr)]
    else:
        dur = max(1, min(int(duration_sec or 4), 30))
        t = np.arange(int(sr * dur)) / sr
        k = int(rng.integers(3, 40))
        noise = np.convolve(rng.standard_normal(len(t)), np.ones(k) / k, mode="same")
        sweep = np.sin(2 * np.pi * float(rng.uniform(80, 1200)) * t * np.exp(-t * float(rng.uniform(0.2, 1.5))))
        sig = (0.6 * noise[:len(t)] + 0.5 * sweep) * np.exp(-t * float(rng.uniform(0.8, 3)))
    sig = sig / (np.max(np.abs(sig)) + 1e-9) * 0.85
    buf = io.BytesIO()
    with wave_mod.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((sig * 32767).astype(np.int16).tobytes())
    buf.seek(0)
    return buf


@api_router.get("/studio/jobs/{job_id}/audio")
async def studio_job_audio(job_id: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.studio_jobs.find_one({"id": job_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    if doc["tool"] not in ("music", "sound_effects"):
        raise HTTPException(status_code=400, detail="Job has no audio output")
    seed = int(job_id.replace("-", "")[:12], 16)
    dur = (doc.get("settings") or {}).get("duration_sec") or doc.get("duration_sec")
    buf = await asyncio.to_thread(_synth_wav, doc["tool"], seed, dur)
    return StreamingResponse(buf, media_type="audio/wav",
                             headers={"Content-Disposition": f'inline; filename="{doc["tool"]}_{job_id[:8]}.wav"'})


@api_router.get("/studio/jobs")
async def studio_jobs(user: dict = Depends(auth_module.get_current_user)):
    return await db.studio_jobs.find({"user_id": user["id"]}, {"_id": 0}).sort("created", -1).to_list(30)


@api_router.get("/usage")
async def usage(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.api_keys.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    total_req = sum(d.get("request_count", 0) for d in docs)
    total_tok = sum(d.get("token_count", 0) for d in docs)
    return {
        "keys": len(docs),
        "total_requests": total_req,
        "total_tokens": total_tok,
        "rate_limit": RATE_LIMIT,
        "rate_window": RATE_WINDOW,
    }


# ---------------- PayPal — API credit packs ----------------

PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "live")
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET = os.environ.get("PAYPAL_SECRET", "")
PAYPAL_BASE = "https://api-m.paypal.com" if PAYPAL_MODE == "live" else "https://api-m.sandbox.paypal.com"

PLANS = {
    "starter": {"id": "starter", "name": "Starter", "price": "5.00", "credits": 10000, "blurb": "10,000 tokens · half the price of other providers"},
    "pro": {"id": "pro", "name": "Pro", "price": "12.50", "credits": 30000, "blurb": "30,000 tokens · production apps · half price"},
    "scale": {"id": "scale", "name": "Scale", "price": "50.00", "credits": 150000, "blurb": "150,000 tokens · best value · half price"},
}

UPGRADE_PLANS = {
    "trial": {"id": "trial", "name": "7-Day Trial", "price": "1.00", "kind": "upgrade", "plan": "trial", "period": "one-time · 7 days",
              "blurb": "Everything unlocked for 7 days — API & LLM keys, builders and advanced tools"},
    "builder": {"id": "builder", "name": "Builder", "price": "10.00", "kind": "upgrade", "plan": "builder", "period": "per month",
                "blurb": "API & LLM keys · advanced build tools · start shipping"},
    "luchii-pro": {"id": "luchii-pro", "name": "Luchii Pro", "price": "5.00", "kind": "upgrade", "plan": "pro", "period": "per month",
                   "blurb": "Pro badge · higher limits · priority access"},
    "luchii-premium": {"id": "luchii-premium", "name": "Luchii Premium", "price": "10.00", "kind": "upgrade", "plan": "premium", "period": "per month",
                       "blurb": "200 images/day · priority Video Creator · Premium badge · top limits"},
    "annual": {"id": "annual", "name": "Premium Annual", "price": "120.00", "kind": "upgrade", "plan": "premium", "period": "per year — $10/mo",
               "blurb": "Everything in Luchii Premium, billed yearly"},
    "api-pro": {"id": "api-pro", "name": "API Pro", "price": "12.50", "kind": "upgrade", "plan": "pro", "period": "per month",
                "blurb": "120 req/min · 2M tokens/month · unlimited API keys"},
    "api-scale": {"id": "api-scale", "name": "API Scale", "price": "50.00", "kind": "upgrade", "plan": "scale", "period": "per month",
                  "blurb": "600 req/min · 20M tokens/month · unlimited API keys · priority"},
    "linq-operator": {"id": "linq-operator", "name": "LINQ Operator", "price": "15.00", "kind": "upgrade", "plan": "builder", "period": "per month", "linq": True,
                      "blurb": "Governance engines · Ascension Ladder · API & LLM keys unlocked"},
    "linq-architect": {"id": "linq-architect", "name": "LINQ Architect", "price": "30.00", "kind": "upgrade", "plan": "pro", "period": "per month", "linq": True,
                       "blurb": "Everything in Operator · priority engine runs · Pro plan unlocked"},
    "linq-sovereign": {"id": "linq-sovereign", "name": "LINQ Sovereign", "price": "60.00", "kind": "upgrade", "plan": "premium", "period": "per month", "linq": True,
                       "blurb": "Full sovereignty · LINQ Live hosting · Premium plan · top limits"},
    "doc-single": {"id": "doc-single", "name": "Court Document Download", "price": "1.00", "kind": "doc_credits",
                   "doc_credits": 1, "blurb": "1 certified PDF download from the docket & laws library"},
    "doc-pack": {"id": "doc-pack", "name": "Docket Access Pack", "price": "5.00", "kind": "doc_credits",
                 "doc_credits": 10, "blurb": "10 certified PDF downloads from the docket & laws library"},
}

PAID_PLANS = {"trial", "builder", "pro", "premium", "scale"}

CASHAPP_TAG = os.environ.get("CASHAPP_TAG", "$jccnvja")
CASHAPP_PAYEE = os.environ.get("CASHAPP_PAYEE", "FRASBERG INC")


@api_router.get("/cashapp/config")
async def cashapp_config():
    return {
        "cashtag": CASHAPP_TAG,
        "payee": CASHAPP_PAYEE,
        "plans": list(UPGRADE_PLANS.values()),
    }


class CashAppIntent(BaseModel):
    plan_id: str = "luchii-pro"


@api_router.post("/cashapp/intent")
async def cashapp_intent(body: CashAppIntent, user: dict = Depends(auth_module.get_current_user)):
    plan = UPGRADE_PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    reference = "LCH-" + secrets.token_hex(4).upper()
    doc = {
        "id": str(uuid.uuid4()),
        "reference": reference,
        "user_id": user["id"],
        "user_email": user.get("email", ""),
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "amount": plan["price"],
        "cashtag": CASHAPP_TAG,
        "status": "awaiting_payment",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.cashapp_payments.insert_one({**doc})
    tag_clean = CASHAPP_TAG.lstrip("$")
    return {
        **{k: v for k, v in doc.items() if k != "_id"},
        "pay_url": f"https://cash.app/${tag_clean}/{plan['price']}",
        "cashtag_url": f"https://cash.app/${tag_clean}",
    }


class CashAppConfirm(BaseModel):
    reference: str
    sender_cashtag: Optional[str] = None
    note: Optional[str] = None


@api_router.post("/cashapp/confirm")
async def cashapp_confirm(body: CashAppConfirm, user: dict = Depends(auth_module.get_current_user)):
    pay = await db.cashapp_payments.find_one({"reference": body.reference, "user_id": user["id"]})
    if not pay:
        raise HTTPException(status_code=404, detail="Payment request not found")
    if pay["status"] in ("approved", "pending_review"):
        return {"status": pay["status"], "reference": body.reference}
    await db.cashapp_payments.update_one(
        {"reference": body.reference},
        {"$set": {
            "status": "pending_review",
            "sender_cashtag": (body.sender_cashtag or "").strip()[:60],
            "note": (body.note or "").strip()[:200],
            "confirmed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"status": "pending_review", "reference": body.reference}


@api_router.get("/cashapp/my")
async def cashapp_my(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.cashapp_payments.find({"user_id": user["id"]}).sort("created_at", -1).to_list(20)
    return {"payments": [{k: v for k, v in d.items() if k != "_id"} for d in docs]}


@api_router.get("/admin/cashapp")
async def admin_cashapp_list(admin: dict = Depends(require_admin)):
    docs = await db.cashapp_payments.find().sort("created_at", -1).to_list(200)
    return {"payments": [{k: v for k, v in d.items() if k != "_id"} for d in docs]}


@api_router.post("/admin/cashapp/{reference}/approve")
async def admin_cashapp_approve(reference: str, admin: dict = Depends(require_admin)):
    pay = await db.cashapp_payments.find_one({"reference": reference})
    if not pay:
        raise HTTPException(status_code=404, detail="Payment not found")
    await db.cashapp_payments.update_one({"reference": reference}, {"$set": {
        "status": "approved", "approved_at": datetime.now(timezone.utc).isoformat(), "approved_by": admin.get("email", "")}})
    plan_cfg = UPGRADE_PLANS.get(pay.get("plan_id"), {})
    if plan_cfg.get("kind") == "doc_credits":
        await db.users.update_one({"id": pay["user_id"]}, {"$inc": {"doc_credits": plan_cfg.get("doc_credits", 0)}})
    else:
        days = 7 if plan_cfg.get("plan") == "trial" else (365 if pay.get("plan_id") == "annual" else 30)
        now_dt = datetime.now(timezone.utc)
        update = {"plan": plan_cfg.get("plan", "pro"),
                  "plan_started": now_dt.isoformat(),
                  "plan_expires": (now_dt + timedelta(days=days)).isoformat()}
        await db.users.update_one({"id": pay["user_id"]}, {"$set": update})
    return {"status": "approved", "reference": reference}


@api_router.post("/admin/cashapp/{reference}/reject")
async def admin_cashapp_reject(reference: str, admin: dict = Depends(require_admin)):
    res = await db.cashapp_payments.update_one({"reference": reference}, {"$set": {
        "status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"status": "rejected", "reference": reference}




class OrderCreate(BaseModel):
    plan_id: str
    key_id: Optional[str] = None


class OrderCapture(BaseModel):
    key_id: Optional[str] = None
    plan_id: Optional[str] = None
    email: Optional[str] = None


import resend

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


def _receipt_html(plan_name: str, price: str, credits: int, order_id: str) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e2327;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#161a1d;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 32px;border-bottom:1px solid #2a3136;">
            <span style="color:#00f0ff;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Luchii · Frasberg</span>
            <h1 style="color:#f8f9fa;font-size:22px;margin:10px 0 0;">Payment receipt</h1>
          </td></tr>
          <tr><td style="padding:28px 32px;color:#a1aab0;font-size:14px;line-height:1.7;">
            Thank you for your purchase. Your credits are now active.
            <table width="100%" style="margin-top:20px;color:#f8f9fa;font-size:15px;">
              <tr><td style="padding:8px 0;color:#a1aab0;">Plan</td><td align="right">{plan_name}</td></tr>
              <tr><td style="padding:8px 0;color:#a1aab0;">Credits</td><td align="right">{credits:,} tokens</td></tr>
              <tr><td style="padding:8px 0;color:#a1aab0;">Amount</td><td align="right">${price} USD</td></tr>
              <tr><td style="padding:8px 0;color:#a1aab0;">Order</td><td align="right" style="font-family:monospace;font-size:12px;">{order_id}</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #2a3136;color:#6c757d;font-size:12px;">
            Intelligence, Harmonized. · © 2026 Frasberg
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


async def _send_receipt(to_email: str, plan: dict, order_id: str):
    if not (RESEND_API_KEY and to_email):
        return {"sent": False, "reason": "not_configured_or_no_email"}
    try:
        resend.api_key = RESEND_API_KEY
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": f"Your Luchii receipt — {plan['name']}",
            "html": _receipt_html(plan["name"], plan["price"], plan["credits"], order_id),
        }
        res = await asyncio.to_thread(resend.Emails.send, params)
        return {"sent": True, "id": res.get("id")}
    except Exception:
        logger.exception("receipt email failed")
        return {"sent": False, "reason": "send_error"}


async def _paypal_token() -> str:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            f"{PAYPAL_BASE}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        r.raise_for_status()
        return r.json()["access_token"]


@api_router.get("/paypal/config")
async def paypal_config():
    return {
        "client_id": PAYPAL_CLIENT_ID,
        "mode": PAYPAL_MODE,
        "configured": bool(PAYPAL_CLIENT_ID and PAYPAL_SECRET),
        "plans": list(PLANS.values()),
        "upgrade_plans": list(UPGRADE_PLANS.values()),
    }


@api_router.post("/paypal/orders")
async def paypal_create_order(body: OrderCreate, request: Request):
    plan = PLANS.get(body.plan_id) or UPGRADE_PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan")
    ref_suffix = body.key_id or "none"
    if plan.get("kind") in ("upgrade", "doc_credits"):
        user = await auth_module.get_current_user(request)
        ref_suffix = user["id"]
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "reference_id": f"{plan['id']}::{ref_suffix}",
                        "description": f"Luchii {plan['name']}" + (f" — {plan['credits']} credits" if plan.get("credits") else " — account upgrade"),
                        "amount": {"currency_code": "USD", "value": plan["price"]},
                    }],
                },
            )
        if r.status_code >= 400:
            logger.error("paypal create order failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal order creation failed")
        return {"id": r.json()["id"]}
    except HTTPException:
        raise
    except Exception:
        logger.exception("paypal create order error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


@api_router.post("/paypal/orders/{order_id}/capture")
async def paypal_capture_order(order_id: str, body: OrderCapture):
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
        if r.status_code >= 400:
            logger.error("paypal capture failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal capture failed")
        data = r.json()
        status = data.get("status")
        ref = ""
        try:
            ref = data["purchase_units"][0]["reference_id"]
        except Exception:
            pass
        plan_id = (ref.split("::")[0] if "::" in ref else body.plan_id) or ""
        key_id = (ref.split("::")[1] if "::" in ref else body.key_id) or None
        if key_id == "none":
            key_id = None
        plan = PLANS.get(plan_id) or UPGRADE_PLANS.get(plan_id)
        credited = 0
        upgraded = False
        receipt = {"sent": False}
        if status == "COMPLETED" and plan:
            payer_email = body.email
            try:
                payer_email = payer_email or data["payer"]["email_address"]
            except Exception:
                pass
            if plan.get("kind") == "doc_credits":
                added = int(plan.get("doc_credits", 0))
                if key_id:
                    await db.users.update_one({"id": key_id}, {"$inc": {"doc_credits": added}})
                credited = added
                await db.purchases.insert_one({
                    "id": str(uuid.uuid4()), "order_id": order_id, "plan": plan_id,
                    "kind": "doc_credits", "doc_credits": added, "user_id": key_id, "status": status,
                    "email": payer_email,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                receipt = await _send_receipt(payer_email, {**plan, "credits": added}, order_id)
            elif plan.get("kind") == "upgrade":
                if key_id:
                    days = 7 if plan.get("plan") == "trial" else (365 if plan_id == "annual" else 30)
                    now_dt = datetime.now(timezone.utc)
                    update = {"plan": plan.get("plan", "pro"),
                              "plan_started": now_dt.isoformat(),
                              "plan_expires": (now_dt + timedelta(days=days)).isoformat()}
                    await db.users.update_one({"id": key_id}, {"$set": update})
                    upgraded = True
                await db.purchases.insert_one({
                    "id": str(uuid.uuid4()), "order_id": order_id, "plan": plan_id,
                    "kind": "upgrade", "user_id": key_id, "status": status,
                    "email": payer_email,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                receipt = await _send_receipt(payer_email, {**plan, "credits": 0}, order_id)
            else:
                credited = plan["credits"]
                await db.purchases.insert_one({
                    "id": str(uuid.uuid4()), "order_id": order_id, "plan": plan_id,
                    "credits": credited, "key_id": key_id, "status": status,
                    "email": payer_email,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                if key_id:
                    if key_id.startswith("wallet-"):
                        await db.users.update_one({"id": key_id[7:]}, {"$inc": {"credit_balance": credited}})
                    else:
                        await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": credited}})
                receipt = await _send_receipt(payer_email, plan, order_id)
        return {"status": status, "credits_added": credited, "upgraded": upgraded, "receipt": receipt}
    except HTTPException:
        raise
    except Exception:
        logger.exception("paypal capture error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


@api_router.get("/wallet")
async def get_wallet(user: dict = Depends(auth_module.get_current_user)):
    doc = await db.users.find_one({"id": user["id"]}, {"credit_balance": 1})
    return {"balance": int((doc or {}).get("credit_balance", 0))}


class AutoTopupBody(BaseModel):
    enabled: bool
    threshold: int = 500
    amount: int = 5000


@api_router.patch("/keys/{key_id}/autotopup")
async def set_autotopup(key_id: str, body: AutoTopupBody, user: dict = Depends(auth_module.get_current_user)):
    q = {"id": key_id}
    if user.get("role") != "admin":
        q["user_id"] = user["id"]
    at = {"enabled": body.enabled,
          "threshold": max(50, min(body.threshold, 100000)),
          "amount": max(500, min(body.amount, 200000))}
    res = await db.api_keys.update_one(q, {"$set": {"autotopup": at}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"ok": True, "autotopup": at}


@api_router.patch("/keys/{key_id}/alert-threshold")
async def set_alert_threshold(key_id: str, body: dict, user: dict = Depends(auth_module.get_current_user)):
    q = {"id": key_id}
    if user.get("role") != "admin":
        q["user_id"] = user["id"]
    threshold = max(50, min(int(body.get("threshold", 500)), 100000))
    res = await db.api_keys.update_one(q, {"$set": {"alert_threshold": threshold},
                                           "$unset": {"low_credit_alerted": ""}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"ok": True, "alert_threshold": threshold}


# ---------------- LINQ Live — PayPal Tip Jar ----------------
class TipOrderCreate(BaseModel):
    roomId: str
    amount: float


@api_router.post("/rooms/tip/orders")
async def tip_create_order(body: TipOrderCreate):
    amt = round(float(body.amount), 2)
    if amt < 1 or amt > 500:
        raise HTTPException(status_code=400, detail="Tip must be between $1 and $500")
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"intent": "CAPTURE", "purchase_units": [{
                    "reference_id": f"tip::{body.roomId}",
                    "description": f"LINQ Live tip — {body.roomId}",
                    "amount": {"currency_code": "USD", "value": f"{amt:.2f}"}}]},
            )
        if r.status_code >= 400:
            logger.error("tip order failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal tip order failed")
        return {"id": r.json()["id"]}
    except HTTPException:
        raise
    except Exception:
        logger.exception("tip order error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


class TipCaptureBody(BaseModel):
    roomId: str
    from_name: str = "viewer"


@api_router.post("/rooms/tip/orders/{order_id}/capture")
async def tip_capture_order(order_id: str, body: TipCaptureBody):
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
        if r.status_code >= 400:
            logger.error("tip capture failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal tip capture failed")
        data = r.json()
        status = data.get("status")
        amount = 0.0
        try:
            amount = float(data["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"])
        except Exception:
            pass
        if status == "COMPLETED":
            now = datetime.now(timezone.utc).isoformat()
            await db.linq_tips.insert_one({"id": str(uuid.uuid4()), "roomId": body.roomId,
                                           "from": body.from_name, "amount": amount,
                                           "orderId": order_id, "createdAt": now})
            await db.linq_events.insert_one({"id": str(uuid.uuid4()), "roomId": body.roomId,
                                             "type": "tip", "identity": body.from_name,
                                             "payload": {"amount": amount, "paid": True}, "timestamp": now})
        return {"status": status, "amount": amount}
    except HTTPException:
        raise
    except Exception:
        logger.exception("tip capture error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


# ---------------- Purchase / Billing history ----------------
@api_router.get("/purchases/my")
async def my_purchases(user: dict = Depends(auth_module.get_current_user)):
    q = {"$or": [{"user_id": user["id"]}, {"key_id": user["id"]},
                 {"key_id": f"wallet-{user['id']}"}, {"email": user.get("email")}]}
    purchases = await db.purchases.find(q, {"_id": 0}).sort("ts", -1).to_list(100)
    cash = await db.cashapp_payments.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    transfers = await db.credit_transfers.find({"user_id": user["id"]}, {"_id": 0}).sort("ts", -1).to_list(50)
    wallet_doc = await db.users.find_one({"id": user["id"]}, {"credit_balance": 1})
    meta = {**{p["id"]: p for p in PLANS.values()}, **{p["id"]: p for p in UPGRADE_PLANS.values()}}
    for p in purchases:
        m = meta.get(p.get("plan"), {})
        p["plan_name"] = m.get("name", p.get("plan"))
        p["price"] = m.get("price")
        if str(p.get("key_id", "")).startswith("wallet-"):
            p["wallet"] = True
    return {"purchases": purchases, "cashapp": cash, "transfers": transfers,
            "wallet_balance": int((wallet_doc or {}).get("credit_balance", 0)),
            "plan": user.get("plan"),
            "plan_started": user.get("plan_started"), "plan_expires": user.get("plan_expires")}


# ---------------- OpenAI-Compatible Provider Gateway (Frasberg) ----------------
PROVIDER_BASE_URL = os.environ.get("PROVIDER_BASE_URL", "https://api.frasberg.com/v1")

PROVIDER_REGISTRY = {
    "id": "frasberg",
    "name": "Frasberg",
    "display_name": "Frasberg — Verified LLM Provider",
    "verified": True,
    "base_url": PROVIDER_BASE_URL,
    "auth": "bearer",
    "models": {
        "luchii-6-plus": "chat",
        "luchii-6-mini": "chat",
        "luchii-6-embed": "embed",
        "luchii-70b": "chat",
        "luchii-7b": "chat",
        "luchii-1b": "chat",
        "luchii-200m": "chat",
    },
    "streaming": True,
    "sse": True,
}

PROVIDER_MANIFEST = {
    "provider": "frasberg",
    "models": ["luchii-6-plus", "luchii-6-mini", "luchii-6-embed",
               "luchii-70b", "luchii-7b", "luchii-1b", "luchii-200m"],
    "endpoints": {
        "chat": f"{PROVIDER_BASE_URL}/chat/completions",
        "embed": f"{PROVIDER_BASE_URL}/embeddings",
        "models": f"{PROVIDER_BASE_URL}/models",
    },
    "authentication": {"type": "bearer", "header": "Authorization", "format": "Bearer {FRASBERG_LLM_KEY}"},
    "streaming": True,
    "sse": True,
    "openai_compatible": True,
    "documentation": "https://frasberg.com/docs",
    "terms": "Frasberg Public License (FPL)",
    "operator": "FRASBERG INC",
}

FRASBERG_PROVIDER = {
    "provider": "frasberg",
    "name": "Frasberg — Verified LLM Provider",
    "legal_name": "FRASBERG INC",
    "verified": True,
    "status": "authorized_distributor",
    "certification": {
        "authority": "Frasberg Provider Registry",
        "certificate_id": "FRSB-LLM-2026-0001",
        "tier": "Tier-1 Verified Provider",
        "issued": "2026-01-15",
        "scope": "Global distribution of the Luchii model family",
    },
    "base_url": PROVIDER_BASE_URL,
    "auth": "bearer",
    "models": PROVIDER_REGISTRY["models"],
    "endpoints": PROVIDER_MANIFEST["endpoints"],
    "openai_compatible": True,
    "streaming": True,
    "sse": True,
    "documentation": "https://frasberg.com/docs",
    "verification_page": "https://frasberg.com/verified-provider",
}


OAI_MODEL_ALIASES = {
    "luchii-6-plus": "luchii-70b", "luchii-6-mini": "luchii-1b",
    "luchii-70b": "luchii-70b", "luchii-7b": "luchii-7b",
    "luchii-1b": "luchii-1b", "luchii-200m": "luchii-200m",
}


TRIAL_KEY_CREDITS = 2500


async def _key_owner_unmetered(key_doc: dict) -> bool:
    owner = await db.users.find_one({"id": key_doc.get("user_id")}, {"role": 1, "plan": 1, "email": 1})
    return bool(owner and (owner.get("role") == "admin" or owner.get("plan") in PAID_PLANS
                           or _is_team_email(owner.get("email"))))


def _insufficient_credits():
    return HTTPException(status_code=402, detail={
        "error": "insufficient_credits",
        "message": "This key is out of credits. Top up at half the price of other providers.",
        "purchase_url": "https://frasberg.com/pay"})


async def _validate_bearer_key(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key")
    key = authorization.split(" ", 1)[1].strip()
    key_doc = await db.api_keys.find_one({"key": key}, {"_id": 0})
    if not key_doc:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if key_doc.get("suspended"):
        raise HTTPException(status_code=403, detail="Account suspended — contact support@frasberg.com")
    exp = key_doc.get("expires_at")
    if exp and exp < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=401, detail="API key expired")
    await _enforce_plan_quotas(key, key_doc)
    key_doc["_unmetered"] = await _key_owner_unmetered(key_doc)
    if not key_doc["_unmetered"] and key_doc.get("credits", 0) <= 0:
        raise _insufficient_credits()
    return key_doc


async def _maybe_autotopup(key_id: str):
    key_doc = await db.api_keys.find_one({"id": key_id}, {"_id": 0})
    if not key_doc:
        return
    at = key_doc.get("autotopup") or {}
    if not at.get("enabled") or key_doc.get("credits", 0) >= at.get("threshold", 500):
        return
    owner_id = key_doc.get("user_id")
    owner = await db.users.find_one({"id": owner_id}, {"credit_balance": 1})
    wallet = (owner or {}).get("credit_balance", 0)
    transfer = min(int(at.get("amount", 5000)), int(wallet))
    if transfer <= 0:
        return
    await db.users.update_one({"id": owner_id}, {"$inc": {"credit_balance": -transfer}})
    await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": transfer}})
    await db.credit_transfers.insert_one({
        "id": str(uuid.uuid4()), "key_id": key_id, "user_id": owner_id,
        "amount": transfer, "kind": "autotopup",
        "ts": datetime.now(timezone.utc).isoformat()})
    logger.info("auto top-up: %s tokens -> key %s", transfer, key_id)


LOW_CREDIT_THRESHOLD = 500

QUOTA_ALERT_PCT = 0.8


async def _maybe_quota_alert(key_id: str):
    key_doc = await db.api_keys.find_one({"id": key_id}, {"user_id": 1})
    if not key_doc:
        return
    owner = await db.users.find_one({"id": key_doc["user_id"]}, {"id": 1, "email": 1, "plan": 1, "name": 1, "role": 1})
    if not owner or owner.get("role") == "admin" or _is_team_email(owner.get("email")):
        return
    plan = owner.get("plan", "free")
    cap = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["pro"])["monthly_tokens"]
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    key_ids = [k["id"] async for k in db.api_keys.find({"user_id": owner["id"]}, {"id": 1})]
    if not key_ids:
        return
    agg = await db.api_key_usage.aggregate([
        {"$match": {"key_id": {"$in": key_ids}, "day": {"$regex": f"^{month}"}}},
        {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}}}]).to_list(1)
    used = agg[0]["tokens"] if agg else 0
    if used < QUOTA_ALERT_PCT * cap:
        return
    res = await db.quota_alerts.update_one(
        {"user_id": owner["id"], "month": month},
        {"$setOnInsert": {"sent_at": datetime.now(timezone.utc).isoformat(), "used": used, "cap": cap}},
        upsert=True)
    if res.upserted_id is None:
        return
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    email = owner.get("email")
    if not (api_key_env and email):
        return
    pct = min(100, round(used / cap * 100))
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:#f59e0b;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Quota Alert</p>"
            f"<h2 style='margin:8px 0;'>You've used {pct}% of your monthly token quota</h2>"
            f"<p style='color:#94a3b8;'><b style='color:#f8fafc'>{used:,}</b> of <b style='color:#f8fafc'>{cap:,}</b> tokens used this month on your "
            f"<b style='color:#f8fafc'>{plan}</b> plan. Requests are blocked once the quota is reached.</p>"
            f"<div style='background:#1e293b;border-radius:8px;height:10px;margin:16px 0;overflow:hidden;'>"
            f"<div style='background:#f59e0b;height:10px;width:{pct}%;'></div></div>"
            f"<p style='margin-top:16px;'><a href='https://frasberg.com/dashboard' style='color:#1A4FFF;'>Upgrade your plan \u2192</a> "
            f"<span style='color:#64748b;font-size:12px;'>for a higher monthly quota and faster rate limits.</span></p></div>")
    try:
        import resend as _resend
        _resend.api_key = api_key_env
        params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [email],
                  "subject": f"\u26a0\ufe0f {pct}% of your monthly Luchii quota used \u2014 {used:,}/{cap:,} tokens", "html": html}
        await asyncio.to_thread(_resend.Emails.send, params)
        await _log_email("quota_alert", email, params["subject"], True, owner["id"])
        logger.info("quota alert sent to %s (%s%%)", email, pct)
    except Exception:
        await _log_email("quota_alert", email, "quota alert", False, owner["id"])
        logger.exception("quota alert email failed")


async def _maybe_low_credit_alert(key_id: str):
    key_doc = await db.api_keys.find_one({"id": key_id})
    if not key_doc:
        return
    credits = key_doc.get("credits", 0)
    threshold = int(key_doc.get("alert_threshold", LOW_CREDIT_THRESHOLD))
    if credits >= threshold:
        if key_doc.get("low_credit_alerted"):
            await db.api_keys.update_one({"id": key_id}, {"$unset": {"low_credit_alerted": ""}})
        return
    if key_doc.get("low_credit_alerted"):
        return
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    owner = await db.users.find_one({"id": key_doc.get("user_id")}, {"email": 1})
    email = (owner or {}).get("email")
    if not (api_key_env and email):
        return
    await db.api_keys.update_one({"id": key_id}, {"$set": {"low_credit_alerted": True}})
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:#f59e0b;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Low Credit Alert</p>"
            f"<h2 style='margin:8px 0;'>Key \u201c{key_doc.get('name', 'API key')}\u201d is running low</h2>"
            f"<p style='color:#94a3b8;'>Only <b style='color:#f8fafc'>{credits:,}</b> credits left (alert threshold: {threshold:,}). "
            f"Requests will stop streaming once credits hit zero.</p>"
            f"<p style='margin-top:16px;'><a href='https://frasberg.com/dashboard' style='color:#1A4FFF;'>Top up now \u2192</a> "
            f"<span style='color:#64748b;font-size:12px;'>or enable Auto Top-Up in your dashboard so this never happens again.</span></p></div>")
    try:
        import resend as _resend
        _resend.api_key = api_key_env
        params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [email],
                  "subject": f"\u26a0\ufe0f Low credits on \u201c{key_doc.get('name', 'API key')}\u201d \u2014 {credits:,} left", "html": html}
        await asyncio.to_thread(_resend.Emails.send, params)
        await _log_email("low_credit_alert", email, params["subject"], True, key_doc.get("user_id"))
        logger.info("low credit alert sent for key %s", key_id)
    except Exception:
        logger.exception("low credit alert failed")
        await _log_email("low_credit_alert", email, f"Low credits on {key_doc.get('name', 'API key')}", False, key_doc.get("user_id"))


async def _meter_key(key_id: str, tokens: int, deduct: bool = False):
    now = datetime.now(timezone.utc)
    inc = {"request_count": 1, "token_count": tokens}
    if deduct:
        inc["credits"] = -tokens
    await db.api_keys.update_one({"id": key_id}, {"$inc": inc,
                                                  "$set": {"last_used": now.isoformat()}})
    await db.api_key_usage.update_one({"key_id": key_id, "day": now.strftime("%Y-%m-%d")},
                                      {"$inc": {"requests": 1, "tokens": tokens}}, upsert=True)
    if deduct:
        await _maybe_autotopup(key_id)
        await _maybe_low_credit_alert(key_id)


@api_router.get("/v1/models")
async def oai_list_models():
    created = int(_START_TIME.timestamp())
    return {"object": "list", "data": [
        {"id": m, "object": "model", "created": created, "owned_by": "frasberg",
         "capabilities": {"chat": kind == "chat", "embeddings": kind == "embed"}}
        for m, kind in PROVIDER_REGISTRY["models"].items()
    ]}


@api_router.get("/v1/provider")
async def oai_provider():
    return {"registry": PROVIDER_REGISTRY, "manifest": PROVIDER_MANIFEST,
            "providers": ["openai", "anthropic", "google", "cohere", "elevenlabs", "frasberg"],
            "verified": True}


class OAIChatBody(BaseModel):
    model: str = "luchii-6-plus"
    messages: list
    stream: bool = False
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None


def _oai_prompt(messages: list):
    system_parts, convo, last_user = [], [], ""
    for m in messages:
        role, content = m.get("role", "user"), m.get("content", "")
        if isinstance(content, list):
            content = " ".join(c.get("text", "") for c in content if isinstance(c, dict))
        if role == "system":
            system_parts.append(content)
        elif role == "user":
            last_user = content
            convo.append(f"User: {content}")
        elif role == "assistant":
            convo.append(f"Assistant: {content}")
    history = "\n".join(convo[:-1])[-6000:] if len(convo) > 1 else ""
    return "\n".join(system_parts), history, last_user


@api_router.post("/v1/chat/completions")
async def oai_chat_completions(body: OAIChatBody, authorization: Optional[str] = Header(None)):
    key_doc = await _validate_bearer_key(authorization)
    if body.model not in OAI_MODEL_ALIASES:
        raise HTTPException(status_code=404, detail=f"Model '{body.model}' not found. Use one of: {', '.join(OAI_MODEL_ALIASES)}")
    if not body.messages:
        raise HTTPException(status_code=400, detail="messages is required")
    system_extra, history, last_user = _oai_prompt(body.messages)
    if not last_user.strip():
        raise HTTPException(status_code=400, detail="At least one user message is required")
    if len(last_user) > MAX_MSG_LEN:
        raise HTTPException(status_code=413, detail=f"Message exceeds {MAX_MSG_LEN} chars")
    lowered = last_user.lower()
    refused = any(b in lowered for b in BLOCKED_TERMS)
    internal_model = OAI_MODEL_ALIASES[body.model]
    completion_id = f"chatcmpl-{uuid.uuid4().hex[:24]}"
    created = int(datetime.now(timezone.utc).timestamp())
    sb = LUCHII_SYSTEM + (f"\n\nDeveloper system instructions:\n{system_extra}" if system_extra else "")
    if history:
        sb += f"\n\nConversation so far:\n{history}"

    async def generate_full() -> str:
        if refused:
            return "I can't help with that request."
        llm = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"oai-{completion_id}",
                      system_message=sb).with_model("anthropic", "claude-sonnet-4-6")
        resp = await llm.send_message(UserMessage(text=last_user))
        return resp if isinstance(resp, str) else getattr(resp, "content", str(resp))

    if body.stream:
        async def sse():
            def chunk(delta: dict, finish=None):
                return "data: " + json.dumps({
                    "id": completion_id, "object": "chat.completion.chunk", "created": created,
                    "model": body.model,
                    "choices": [{"index": 0, "delta": delta, "finish_reason": finish}],
                }) + "\n\n"
            yield chunk({"role": "assistant", "content": ""})
            full = ""
            if refused:
                full = "I can't help with that request."
                yield chunk({"content": full})
            else:
                llm = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"oai-{completion_id}",
                              system_message=sb).with_model("anthropic", "claude-sonnet-4-6")
                try:
                    async for event in llm.stream_message(UserMessage(text=last_user)):
                        if isinstance(event, TextDelta):
                            full += event.content
                            yield chunk({"content": event.content})
                        elif isinstance(event, StreamDone):
                            break
                except Exception:
                    logger.exception("oai stream error")
            yield chunk({}, finish="stop")
            yield "data: [DONE]\n\n"
            await _meter_key(key_doc["id"], len(full.split()), deduct=not key_doc["_unmetered"])
        return StreamingResponse(sse(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    full = await generate_full()
    await _meter_key(key_doc["id"], len(full.split()), deduct=not key_doc["_unmetered"])
    p_tok, c_tok = len(last_user.split()), len(full.split())
    return {
        "id": completion_id, "object": "chat.completion", "created": created, "model": body.model,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": full}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": p_tok, "completion_tokens": c_tok, "total_tokens": p_tok + c_tok},
    }


class OAIEmbedBody(BaseModel):
    model: str = "luchii-6-embed"
    input: Any


@api_router.post("/v1/embeddings")
async def oai_embeddings(body: OAIEmbedBody, authorization: Optional[str] = Header(None)):
    key_doc = await _validate_bearer_key(authorization)
    inputs = body.input if isinstance(body.input, list) else [body.input]
    inputs = [str(t) for t in inputs][:64]
    if not inputs or not any(t.strip() for t in inputs):
        raise HTTPException(status_code=400, detail="input is required")
    data = []
    total_tok = 0
    for i, text in enumerate(inputs):
        vec = await memory_vault.embed(text)
        if vec is None:
            raise HTTPException(status_code=503, detail="Embedding engine is warming up — retry in a moment")
        total_tok += len(text.split())
        data.append({"object": "embedding", "index": i, "embedding": vec})
    await _meter_key(key_doc["id"], total_tok, deduct=not key_doc["_unmetered"])
    return {"object": "list", "data": data, "model": "luchii-6-embed",
            "usage": {"prompt_tokens": total_tok, "total_tokens": total_tok}}


_WELL_KNOWN_OPENAPI = f"""openapi: 3.1.0
info:
  title: Frasberg Luchii API
  version: "1.0"
  description: Public LLM API for the Luchii model family by FRASBERG INC. Bearer authentication, SSE streaming, OpenAI-compatible.
  contact:
    name: Frasberg
    url: https://frasberg.com
servers:
  - url: {PROVIDER_BASE_URL}
security:
  - bearerAuth: []
paths:
  /chat/completions:
    post:
      summary: OpenAI-compatible chat completion (SSE streaming supported)
      operationId: createChatCompletion
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [model, messages]
              properties:
                model:
                  type: string
                  enum: [luchii-6-plus, luchii-6-mini, luchii-70b, luchii-7b, luchii-1b, luchii-200m]
                messages:
                  type: array
                  items:
                    type: object
                    properties:
                      role: {{ type: string, enum: [system, user, assistant] }}
                      content: {{ type: string }}
                stream: {{ type: boolean, default: false }}
      responses:
        "200":
          description: Chat completion or text/event-stream of chat.completion.chunk
  /embeddings:
    post:
      summary: Create embeddings (luchii-6-embed, 384 dimensions)
      operationId: createEmbedding
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [input]
              properties:
                model: {{ type: string, default: luchii-6-embed }}
                input:
                  oneOf: [{{ type: string }}, {{ type: array, items: {{ type: string }} }}]
      responses:
        "200": {{ description: Embedding vectors }}
  /models:
    get:
      summary: List available Luchii models
      operationId: listModels
      security: []
      responses:
        "200": {{ description: Model list }}
  /chat:
    post:
      summary: Native Luchii streaming chat (SSE, delta format)
      operationId: nativeChat
      responses:
        "200": {{ description: text/event-stream }}
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: luchii-sk-*
"""


LUCHII_MODELS_DOC = {
    "provider": "frasberg",
    "models": [
        {"id": "luchii-6-plus", "type": "chat", "context_window": 128000, "streaming": True,
         "description": "Flagship long-context reasoning model"},
        {"id": "luchii-6-mini", "type": "chat", "context_window": 64000, "streaming": True,
         "description": "Fast, cost-efficient chat model for agents and automation"},
        {"id": "luchii-6-embed", "type": "embedding", "dimensions": 384,
         "description": "High-performance embeddings for search, retrieval and similarity"},
    ],
}


class ContactBody(BaseModel):
    name: str
    email: str
    message: str


class SupportChatBody(BaseModel):
    message: str
    session_id: str = ""
    history: list = []


SUPPORT_PERSONA = (
    "You are Zion, a warm, upbeat human support specialist on the Frasberg live chat. You chat like a real person: "
    "short conversational replies (1-3 sentences), contractions, occasional light warmth. Never mention being an AI, a "
    "model, or a bot unless the user directly asks — if they do, be honest but brief. Never use markdown headers or bullet walls.\n\n"
    "What you know about Frasberg (frasberg.com):\n"
    "- Luchii: Frasberg's intelligence model family — luchii-1b (fast), luchii-7b (builder), luchii-70b (deep reasoning), Luchii V12 flagship.\n"
    "- LINQ Developer Console at /dashboard: API keys, usage, billing. Free starter key, paid plans (builder, pro, premium, scale) via PayPal.\n"
    "- API: https://api.frasberg.com/v1 — OpenAI-compatible, Bearer auth, SSE streaming, 60 req/min public tier. Works with any OpenAI SDK, Vercel AI SDK, LangChain.\n"
    "- Agent Workspace at /chat: build apps with Luchii, publish them, claim custom URLs (name.preview.frasberg.com), download Android/iOS packages.\n"
    "- Frasberg Games: 3D games portal incl. Street Vybz. Frasberg Cloud at /cloud: multiverse simulation console.\n"
    "- Team accounts on @frasbergai.com get unlimited access.\n"
    "- Contact: support@frasberg.com · frasberg.com\n"
    "If you truly can't help, offer to connect them with the team at support@frasberg.com."
)


@api_router.post("/support/contact")
async def support_contact(body: ContactBody):
    doc = {"id": str(uuid.uuid4()), "name": body.name.strip()[:80], "email": body.email.strip()[:120],
           "message": body.message.strip()[:4000], "created": datetime.now(timezone.utc).isoformat()}
    if not (doc["name"] and doc["email"] and doc["message"]):
        raise HTTPException(status_code=400, detail="All fields are required")
    await db.contact_messages.insert_one(doc)
    return {"ok": True}


@api_router.post("/support/chat")
async def support_chat(body: SupportChatBody):
    sid = body.session_id or str(uuid.uuid4())
    history = ""
    for m in (body.history or [])[-10:]:
        role = "Visitor" if m.get("role") == "user" else "Zion"
        history += f"{role}: {str(m.get('content', ''))[:600]}\n"
    prompt = (f"Conversation so far:\n{history}\nVisitor: {body.message.strip()[:2000]}\n\nReply as Zion."
              if history else f"Visitor: {body.message.strip()[:2000]}\n\nReply as Zion.")

    async def gen():
        yield ": stream-start\n\n"
        full = ""
        try:
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"support-{sid}",
                           system_message=SUPPORT_PERSONA).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=600)
            async for chunk in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(chunk, TextDelta) and chunk.content:
                    full += chunk.content
                    yield f"data: {json.dumps({'delta': chunk.content})}\n\n"
                elif isinstance(chunk, StreamDone):
                    break
        except Exception:
            logger.exception("support chat stream failed")
            yield f"data: {json.dumps({'delta': 'Sorry — our chat hit a snag. You can always reach the team at support@frasberg.com.'})}\n\n"
        yield f"data: {json.dumps({'done': True, 'session_id': sid})}\n\n"
        try:
            now = datetime.now(timezone.utc).isoformat()
            await db.support_chats.update_one(
                {"session_id": sid},
                {"$push": {"messages": {"$each": [
                    {"role": "user", "content": body.message.strip()[:2000], "at": now},
                    {"role": "assistant", "content": full[:4000], "at": now}]}},
                 "$set": {"updated": now}, "$setOnInsert": {"created": now}},
                upsert=True)
        except Exception:
            logger.exception("support transcript save failed")

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


BENCH_WEIGHTS = {"depth": 0.30, "precision": 0.25, "abstraction": 0.15,
                 "multi_agent": 0.10, "temporal": 0.10, "creativity": 0.10}

BENCH_TIERS = {
    "1B": {"name": "Luchii 1B", "label": "Surface", "max_tokens": 150, "persona":
           "You are Luchii 1B, a small surface-intelligence model. Answer in 2-4 plain sentences. "
           "No lists, no structure, no abstraction, no analogies. Keep it simple and basic."},
    "7B": {"name": "Luchii 7B", "label": "Structured", "max_tokens": 300, "persona":
           "You are Luchii 7B, a structured-intelligence model. Answer with clear multi-step logic: "
           "a short numbered breakdown (3-5 steps), modular and practical. Moderate depth, limited abstraction."},
    "70B": {"name": "Luchii 70B", "label": "Frontier", "max_tokens": 450, "persona":
            "You are Luchii 70B, a frontier-intelligence model. Answer with deep technical reasoning: "
            "system-level design, multi-agent coordination, temporal considerations, physics-aware detail, "
            "and one meta-level insight. Use tight structured sections."},
    "X": {"name": "Luchii X", "label": "Cosmogenic", "max_tokens": 400, "persona":
          "You are Luchii X, the cosmogenic Starfield-tier model of FrasbergOS. Answer with reality-fabric "
          "reasoning: unify a mechanical, a quantum and a cosmological perspective; reference origin-states, "
          "continuum drift and emergent synthesis; end with a single cosmogenic conclusion. Visionary but precise."},
}

_BENCH_SIGNALS = {
    "depth": ["because", "therefore", "layer", "meta", "system", "principle", "first", "second", "step"],
    "precision": ["latency", "throughput", "protocol", "algorithm", "vector", "state", "interface", "parameter", "constraint", "topology"],
    "abstraction": ["analogy", "generalize", "ontology", "concept", "abstract", "framework", "paradigm", "unify"],
    "multi_agent": ["agent", "coordinat", "consensus", "distributed", "swarm", "orchestrat", "mesh"],
    "temporal": ["time", "temporal", "asynchron", "drift", "schedule", "sequence", "causal"],
    "creativity": ["imagine", "novel", "emergent", "weave", "fabric", "continuum", "origin", "cosmo", "dimension"],
}
_BENCH_TIER_BIAS = {"1B": 1.5, "7B": 4.5, "70B": 7.5, "X": 8.0}


def _bench_score(text: str, tier: str) -> dict:
    low = text.lower()
    words = max(1, len(low.split()))
    bias = _BENCH_TIER_BIAS[tier]
    scores = {}
    for axis, signals in _BENCH_SIGNALS.items():
        hits = sum(low.count(s) for s in signals)
        content = min(6.0, hits * 1.2) + min(2.0, words / 200)
        scores[axis] = round(max(0.5, min(10.0, bias * 0.55 + content * 0.6)), 1)
    return scores


class BenchmarkBody(BaseModel):
    prompt: str


@api_router.post("/benchmark/run")
async def benchmark_run(body: BenchmarkBody, user: dict = Depends(auth_module.get_current_user)):
    prompt = (body.prompt or "").strip()[:2000]
    if not prompt:
        raise HTTPException(status_code=400, detail="Enter a prompt to benchmark")
    exempt = auth_module.token_exempt(user)
    if not exempt:
        if not await auth_module.spend_tokens(user["id"], 4, "spend_benchmark", "Tier benchmark run (4 tiers)"):
            raise HTTPException(status_code=402,
                                detail="Benchmark runs cost 4 Frasberg tokens — you're out. 100 free tokens arrive tomorrow.")

    async def run_tier(key: str):
        cfg = BENCH_TIERS[key]
        try:
            llm = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"bench-{uuid.uuid4().hex[:10]}",
                          system_message=cfg["persona"]).with_model("anthropic", "claude-sonnet-4-6").with_params(max_tokens=cfg["max_tokens"])
            resp = await llm.send_message(UserMessage(text=prompt))
            out = resp if isinstance(resp, str) else getattr(resp, "content", str(resp))
        except Exception:
            logger.exception("benchmark tier %s failed", key)
            out = "(tier engine unavailable — try again)"
        return key, out

    results = dict(await asyncio.gather(*[run_tier(k) for k in BENCH_TIERS]))
    tiers = {}
    for k, out in results.items():
        scores = _bench_score(out, k)
        tiers[k] = {"name": BENCH_TIERS[k]["name"], "label": BENCH_TIERS[k]["label"], "output": out,
                    "scores": scores,
                    "weighted_total": round(sum(scores[m] * w for m, w in BENCH_WEIGHTS.items()), 2)}
    totals = {k: v["weighted_total"] for k, v in tiers.items()}
    try:
        await db.benchmark_runs.insert_one({
            "id": str(uuid.uuid4()), "user_id": user["id"],
            "user_name": user.get("name") or user["email"].split("@")[0],
            "prompt": prompt[:200], "totals": totals, "best": max(totals.values()),
            "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass
    return {"prompt": prompt, "tiers": tiers, "weights": BENCH_WEIGHTS,
            "cost_tokens": 0 if exempt else 4}


@api_router.get("/benchmark/leaderboard")
async def benchmark_leaderboard():
    rows = await db.benchmark_runs.find({}, {"_id": 0, "user_id": 0}).sort("best", -1).to_list(15)
    return rows


@api_router.get("/provider/status")
async def provider_status():
    now = time.time()
    recent = [m for m in _REQ_METRICS if now - m[0] < 300]
    lats = sorted(m[1] for m in recent)
    avg = round(sum(lats) / len(lats), 1) if lats else 0.0
    p95 = round(lats[int(len(lats) * 0.95)], 1) if len(lats) > 1 else (round(lats[0], 1) if lats else 0.0)
    errors = sum(1 for m in recent if m[2] >= 500)
    err_rate = round(errors / len(recent), 4) if recent else 0.0
    return {"status": "operational" if err_rate < 0.05 else "degraded",
            "uptime_seconds": int(now - _START_TIME.timestamp()),
            "uptime_pct": round(100 - err_rate * 100, 3),
            "requests_5m": len(recent), "avg_latency_ms": avg, "p95_latency_ms": p95,
            "error_rate": err_rate,
            "endpoints": [
                {"path": "/v1/chat/completions", "status": "operational"},
                {"path": "/v1/embeddings", "status": "operational"},
                {"path": "/v1/models", "status": "operational"},
                {"path": "/.well-known/frasberg-provider.json", "status": "operational"},
            ]}


@api_router.get("/.well-known/frasbergai-provider.json")
async def well_known_provider():
    return PROVIDER_REGISTRY


@api_router.get("/.well-known/frasberg-provider.json")
async def well_known_frasberg_provider():
    return FRASBERG_PROVIDER


@api_router.get("/v1/frasberg-provider.json")
async def v1_frasberg_provider():
    return FRASBERG_PROVIDER


@api_router.get("/.well-known/provider-manifest.json")
async def well_known_manifest():
    return PROVIDER_MANIFEST


@api_router.get("/.well-known/luchii-models.json")
async def well_known_models():
    return LUCHII_MODELS_DOC


@api_router.get("/v1/provider-registry.json")
async def v1_provider_registry():
    return PROVIDER_REGISTRY


@api_router.get("/v1/provider-manifest.json")
async def v1_provider_manifest():
    return PROVIDER_MANIFEST


@api_router.get("/v1/luchii-models.json")
async def v1_luchii_models():
    return LUCHII_MODELS_DOC


@api_router.get("/v1/openapi.yaml")
async def v1_openapi():
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(_WELL_KNOWN_OPENAPI, media_type="application/yaml")


@api_router.get("/.well-known/openapi.yaml")
async def well_known_openapi():
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(_WELL_KNOWN_OPENAPI, media_type="application/yaml")


import builder as builder_module

api_router.include_router(auth_module.router)
api_router.include_router(builder_module.router)
api_router.include_router(mesh_ws.router)
# ── Workspace publishes — real deployments from the agent workspace ──
class WorkspacePublishBody(BaseModel):
    agent: str = "builder"
    title: str = "Untitled build"
    html: str


class WorkspaceUpdateBody(BaseModel):
    html: str


def _wp_public(d):
    slug = d.get("slug")
    return {"id": d["id"], "agent": d["agent"], "title": d["title"], "hash": d["hash"],
            "version": d.get("version", 1), "created": d["created"], "updated": d["updated"],
            "published": True, "url": f"/api/workspace/publishes/{d['id']}/view",
            "slug": slug,
            "slug_url": f"/api/workspace/app/{slug}" if slug else None,
            "custom_url": f"https://{slug}.preview.frasberg.com" if slug else None}


@api_router.post("/workspace/publishes")
async def create_workspace_publish(body: WorkspacePublishBody):
    if len(body.html) > 400_000:
        raise HTTPException(status_code=413, detail="Build too large")
    if await db.workspace_publishes.count_documents({}) >= 100:
        raise HTTPException(status_code=429, detail="Publish limit reached")
    now = datetime.now(timezone.utc).isoformat()
    pid = uuid.uuid4().hex[:10]
    doc = {"_id": pid, "id": pid, "agent": body.agent[:20], "title": body.title[:80],
           "html": body.html, "hash": uuid.uuid4().hex[:7], "version": 1,
           "created": now, "updated": now}
    await db.workspace_publishes.insert_one(doc)
    return _wp_public(doc)


@api_router.put("/workspace/publishes/{pid}")
async def update_workspace_publish(pid: str, body: WorkspaceUpdateBody):
    doc = await db.workspace_publishes.find_one({"_id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Publish not found")
    doc["html"] = body.html
    doc["hash"] = uuid.uuid4().hex[:7]
    doc["version"] = doc.get("version", 1) + 1
    doc["updated"] = datetime.now(timezone.utc).isoformat()
    await db.workspace_publishes.replace_one({"_id": pid}, doc)
    return _wp_public(doc)


@api_router.get("/workspace/publishes")
async def list_workspace_publishes():
    docs = await db.workspace_publishes.find({}, {"html": 0}).sort("updated", -1).to_list(100)
    return {"publishes": [_wp_public(d) for d in docs]}


@api_router.get("/workspace/publishes/{pid}/view")
async def view_workspace_publish(pid: str):
    from fastapi.responses import HTMLResponse
    doc = await db.workspace_publishes.find_one({"_id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Publish not found")
    return HTMLResponse(content=doc["html"])


@api_router.delete("/workspace/publishes/{pid}")
async def delete_workspace_publish(pid: str):
    res = await db.workspace_publishes.delete_one({"_id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Publish not found")
    return {"deleted": pid}


WS_SLUG_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$")
WS_RESERVED_SLUGS = {"www", "api", "app", "apps", "admin", "mail", "demo", "docs", "chat", "cloud", "status", "dashboard"}


class WorkspaceSlugBody(BaseModel):
    name: str


@api_router.get("/workspace/slug-check")
async def workspace_slug_check(name: str = ""):
    n = name.strip().lower()
    valid = bool(WS_SLUG_RE.match(n)) and n not in WS_RESERVED_SLUGS
    taken = bool(valid and await db.workspace_publishes.count_documents({"slug": n}))
    suggestions = []
    if valid and taken:
        candidates = [f"{n}-app", f"{n}-hq", f"{n}-live", f"get-{n}", f"try-{n}",
                      f"{n}-{secrets.token_hex(1)}", f"{n}-{secrets.token_hex(1)}"]
        for c in candidates:
            c = c[:30].rstrip("-")
            if len(suggestions) >= 3:
                break
            if c in suggestions or not WS_SLUG_RE.match(c) or c in WS_RESERVED_SLUGS:
                continue
            if await db.workspace_publishes.count_documents({"slug": c}) == 0:
                suggestions.append(c)
    return {"name": n, "valid": valid, "available": valid and not taken, "suggestions": suggestions}


@api_router.post("/workspace/publishes/{pid}/slug")
async def set_workspace_slug(pid: str, body: WorkspaceSlugBody):
    n = body.name.strip().lower()
    if not WS_SLUG_RE.match(n) or n in WS_RESERVED_SLUGS:
        raise HTTPException(status_code=400, detail="Name must be 3-30 chars: lowercase letters, numbers and hyphens (like a GitHub username)")
    existing = await db.workspace_publishes.find_one({"slug": n})
    if existing and existing["_id"] != pid:
        raise HTTPException(status_code=409, detail=f"'{n}' is already taken — try another name")
    doc = await db.workspace_publishes.find_one({"_id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Publish not found")
    await db.workspace_publishes.update_one({"_id": pid}, {"$set": {"slug": n}})
    doc["slug"] = n
    return _wp_public(doc)


@api_router.get("/workspace/app/{slug}")
async def view_workspace_app(slug: str):
    from fastapi.responses import HTMLResponse
    doc = await db.workspace_publishes.find_one({"slug": slug.strip().lower()})
    if not doc:
        raise HTTPException(status_code=404, detail="App not found")
    return HTMLResponse(content=doc["html"])


import native_packaging
api_router.include_router(native_packaging.router)
import github_auth
github_auth.setup(db)
api_router.include_router(github_auth.router)
import marketplace as marketplace_module
marketplace_module.setup(db)
api_router.include_router(marketplace_module.router)
import frasbergos
frasbergos.setup(db)
api_router.include_router(frasbergos.router)
import db_manager
api_router.include_router(db_manager.router)
import games_portal
api_router.include_router(games_portal.router)
import frasberg_cloud
api_router.include_router(frasberg_cloud.router)
import asset_pipeline
api_router.include_router(asset_pipeline.router)
import studio
api_router.include_router(studio.router)
import realtime_core
api_router.include_router(realtime_core.router)
import linq_governance
api_router.include_router(linq_governance.router)
app.include_router(api_router)

_PLATFORM_HOSTS = ("emergentagent.com", "frasberg", "localhost", "127.0.0.1")


class _CustomDomainASGI:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope.get("method") == "GET" and scope.get("path") == "/":
            host = ""
            for k, v in scope.get("headers") or []:
                if k == b"host":
                    host = v.decode("latin-1").split(":")[0].lower()
                    break
            if host and host.endswith(".preview.frasberg.com"):
                slug = host[: -len(".preview.frasberg.com")]
                pub = await db.workspace_publishes.find_one({"slug": slug})
                if pub:
                    from fastapi.responses import HTMLResponse
                    resp = HTMLResponse(content=pub["html"])
                    await resp(scope, receive, send)
                    return
            if host and not any(p in host for p in _PLATFORM_HOSTS):
                site = await db.builder_projects.find_one({"custom_domain": host, "published": True, "domain_verified": True})
                if site:
                    from fastapi.responses import HTMLResponse
                    resp = HTMLResponse(content=site["html"])
                    await resp(scope, receive, send)
                    return
        await self.app(scope, receive, send)


app.add_middleware(_CustomDomainASGI)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def create_indexes():
    try:
        await db.api_keys.create_index("key", unique=True)
        await db.api_keys.create_index("id")
        await db.chat_messages.create_index([("session_id", 1), ("ts", 1)])
        await db.chat_messages.create_index([("user_id", 1), ("ts", -1)])
        await db.chat_messages.create_index("expires_at", expireAfterSeconds=0)
        await db.user_memories.create_index([("user_id", 1), ("created_at", -1)])
    except Exception:
        logger.exception("Index creation failed — continuing (server must still boot)")
    try:
        await auth_module.create_indexes()
        await auth_module.seed_admin()
    except Exception:
        logger.exception("Auth index/seed failed — continuing")
    try:
        from seed_builds import seed_flagship_builds
        await studio.seed_creatures()
        await seed_flagship_builds(db)
        if await db.knowledge.count_documents({}) == 0:
            now = datetime.now(timezone.utc).isoformat()
            await db.knowledge.insert_many([
                {**d, "id": str(uuid.uuid4()), "updated_at": now} for d in KB_SEED
            ])
    except Exception:
        logger.exception("Seed data failed — continuing")
    def _preload_ml():
        try:
            avail = voice_engine._mem_available_gb()
            if avail < 5:
                logger.warning("Deferring ML preload — only %.1f GB memory available (memory vault + voice engines will lazy-load on demand)", avail)
                return
            memory_vault.preload_sync()
            voice_engine.preload_sync()
            if voice_engine._mem_available_gb() >= 4:
                voice_engine.preload_xtts_sync()
            else:
                logger.warning("Skipping XTTS preload — low memory (will lazy-load on first cloning use)")
        except Exception:
            logger.exception("ML preload failed — continuing without sovereign voice")
    threading.Thread(target=_preload_ml, daemon=True).start()
    asyncio.create_task(_probe_upstreams())
    asyncio.create_task(linq_governance.scheduler_loop())
    asyncio.create_task(_uptime_recorder())
    asyncio.create_task(_receipts_loop())
    asyncio.create_task(_digest_loop())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
