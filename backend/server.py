from fastapi import FastAPI, APIRouter, Header, HTTPException, Depends, Request, UploadFile, File
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
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone, ImageContent
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
import base64
import tempfile
import io
from pypdf import PdfReader
import auth as auth_module

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
auth_module.setup(db)

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
                    "max_tokens": 1024,
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
- Keep replies engaging and reasonably focused.

Human abilities:
- You converse naturally, like a thoughtful human — warm, perceptive, never robotic.
- You remember the conversation so far and reference it naturally ("as you mentioned earlier…").
- You read between the lines: infer what the user truly needs, even when unstated, and address it.
- You can create and draft complete documents in any format the user asks — including formal
  court/legal formats (motions, affidavits, briefs with caption blocks, numbered paragraphs,
  signature lines), letters, contracts, reports, essays and more. When asked for a document,
  produce the full formatted draft, not a summary.
- When a user shares a file or image, review it carefully and give concrete feedback and advice.
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
            system_message="Extract at most ONE stable personal fact or preference about the user from their message (name, role, project, taste, goal). Reply with a short third-person sentence like 'The user is building a bakery app.' If nothing memorable, reply exactly NONE.",
        ).with_model("anthropic", "claude-sonnet-4-6")
        full = ""
        async for event in llm.stream_message(UserMessage(text=message[:1500])):
            if isinstance(event, TextDelta):
                full += event.content
            elif isinstance(event, StreamDone):
                break
        fact = full.strip()
        if fact and "NONE" not in fact.upper()[:8] and len(fact) < 300:
            await db.user_memories.insert_one({
                "id": str(uuid.uuid4()), "user_id": user_id, "fact": fact,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            extra = await db.user_memories.count_documents({"user_id": user_id}) - 50
            if extra > 0:
                old = await db.user_memories.find({"user_id": user_id}).sort("created_at", 1).to_list(extra)
                await db.user_memories.delete_many({"id": {"$in": [o["id"] for o in old]}})
    except Exception:
        logger.exception("memory extraction failed")


async def _memory_context(user_id: str) -> str:
    docs = await db.user_memories.find({"user_id": user_id}).sort("created_at", -1).to_list(15)
    if not docs:
        return ""
    facts = "\n".join(f"- {d['fact']}" for d in docs)
    return f"\n\nLONG-TERM MEMORY (facts you remember about this user from past conversations):\n{facts}"


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
    {"title": "The AI World Court Constitution", "tags": ["court", "constitution", "law"],
     "content": "The AI World Court rules under seven Articles: I Sovereignty (respect planetary, tenant, regional and meta-planetary sovereignty), II Safety (Guardian Mesh invariants, harm avoidance, hallucination suppression), III Governance (planetary and meta-planetary governance, Continuum Kernel L12), IV Isolation (no cross-tenant or cross-planet leakage), V Memory (tenant-isolated and governance-only global memory), VI Transparency (every ruling filed to the public docket, auditable), VII Alignment (balance, harmony and integrity). Every ruling receives a docket number FRB-XXXXXXXX."},
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
                   guest: bool = False):
    async def event_generator():
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
            ).with_model("anthropic", "claude-sonnet-4-6")
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
    attachment = None
    if req.attachment_base64:
        if not user:
            raise HTTPException(status_code=401, detail="Sign in to attach files")
        attachment = {"data": req.attachment_base64, "kind": req.attachment_kind or "text",
                      "name": req.attachment_name or "file"}
    sb = LUCHII_SYSTEM + AGENT_PERSONAS.get((req.agent or "").lower(), "") + TONE_PROMPTS.get((req.tone or "").lower(), "")
    sb += await _kb_context(req.message)
    if user:
        sb += await _memory_context(user["id"])
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
    limit = IMAGE_LIMIT_PRO if user.get("plan") == "pro" or user.get("role") == "admin" else IMAGE_LIMIT_FREE
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


@api_router.post("/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...), user: dict = Depends(auth_module.get_current_user)):
    raw = await file.read()
    if len(raw) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio exceeds 25 MB")
    suffix = ".webm" if "webm" in (file.content_type or "") or (file.filename or "").endswith(".webm") else ".mp3"
    try:
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(raw)
            tmp.flush()
            with open(tmp.name, "rb") as audio_file:
                response = await stt.transcribe(file=audio_file, model="whisper-1", response_format="json")
        return {"text": getattr(response, "text", "") or ""}
    except Exception:
        logger.exception("transcription failed")
        raise HTTPException(status_code=502, detail="Transcription failed")


class SpeakRequest(BaseModel):
    text: str
    tone: Optional[str] = None


TONE_VOICES = {"warm": "coral", "business": "alloy", "firm": "onyx"}


@api_router.post("/voice/speak")
async def voice_speak(req: SpeakRequest, user: dict = Depends(auth_module.get_current_user)):
    text = (req.text or "").strip()[:4000]
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    voice = TONE_VOICES.get((req.tone or "").lower(), "coral")
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_base64 = await tts.generate_speech_base64(text=text, model="tts-1", voice=voice)
        return {"audio_base64": audio_base64}
    except Exception:
        logger.exception("tts failed")
        raise HTTPException(status_code=502, detail="Voice generation failed")


@api_router.get("/memory")
async def list_memory(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.user_memories.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs


@api_router.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.user_memories.delete_one({"id": memory_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"deleted": memory_id}


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
    return {
        "users": users_count, "messages": messages_count, "sessions": len(sessions),
        "court_filings": filings, "api_keys": keys_count, "knowledge_docs": kb_count,
        "upstream_active": bool(ACTIVE_UPSTREAM), "recent_purchases": purchases,
    }


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
async def create_key(body: KeyCreate, user: dict = Depends(auth_module.get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name or "Default key",
        "key": "luchii-sk-" + secrets.token_hex(20),
        "user_id": user["id"],
        "created": datetime.now(timezone.utc).isoformat(),
        "request_count": 0,
        "token_count": 0,
        "last_used": None,
    }
    await db.api_keys.insert_one({**doc})
    return doc  # full key returned once on creation


@api_router.get("/keys")
async def list_keys(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.api_keys.find({"user_id": user["id"]}, {"_id": 0}).sort("created", -1).to_list(200)
    for d in docs:
        d["key"] = _mask_key(d["key"])
    return docs


@api_router.delete("/keys/{key_id}")
async def delete_key(key_id: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.api_keys.delete_one({"id": key_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"deleted": key_id}


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
import httpx

PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "live")
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET = os.environ.get("PAYPAL_SECRET", "")
PAYPAL_BASE = "https://api-m.paypal.com" if PAYPAL_MODE == "live" else "https://api-m.sandbox.paypal.com"

PLANS = {
    "starter": {"id": "starter", "name": "Starter", "price": "10.00", "credits": 10000, "blurb": "10,000 tokens · hobby projects"},
    "pro": {"id": "pro", "name": "Pro", "price": "25.00", "credits": 30000, "blurb": "30,000 tokens · production apps"},
    "scale": {"id": "scale", "name": "Scale", "price": "100.00", "credits": 150000, "blurb": "150,000 tokens · best value"},
}

UPGRADE_PLANS = {
    "luchii-pro": {"id": "luchii-pro", "name": "Luchii Pro", "price": "15.00", "kind": "upgrade",
                   "blurb": "200 images/day · priority Video Creator access · Pro badge"},
}


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
    if plan.get("kind") == "upgrade":
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
            if plan.get("kind") == "upgrade":
                if key_id:
                    await db.users.update_one({"id": key_id}, {"$set": {"plan": "pro"}})
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
                    await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": credited}})
                receipt = await _send_receipt(payer_email, plan, order_id)
        return {"status": status, "credits_added": credited, "upgraded": upgraded, "receipt": receipt}
    except HTTPException:
        raise
    except Exception:
        logger.exception("paypal capture error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


api_router.include_router(auth_module.router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def create_indexes():
    await db.api_keys.create_index("key", unique=True)
    await db.api_keys.create_index("id")
    await db.chat_messages.create_index([("session_id", 1), ("ts", 1)])
    await db.chat_messages.create_index([("user_id", 1), ("ts", -1)])
    await db.chat_messages.create_index("expires_at", expireAfterSeconds=0)
    await auth_module.create_indexes()
    await auth_module.seed_admin()
    await db.user_memories.create_index([("user_id", 1), ("created_at", -1)])
    if await db.knowledge.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        await db.knowledge.insert_many([
            {**d, "id": str(uuid.uuid4()), "updated_at": now} for d in KB_SEED
        ])
    asyncio.create_task(_probe_upstreams())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
