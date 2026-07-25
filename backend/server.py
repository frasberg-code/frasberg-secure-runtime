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
from datetime import datetime, timezone

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


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model: Optional[str] = "luchii-70b"
    attachment_base64: Optional[str] = None
    attachment_kind: Optional[str] = None
    attachment_name: Optional[str] = None


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
                   user_id: Optional[str] = None, attachment: Optional[dict] = None):
    async def event_generator():
        now = datetime.now(timezone.utc).isoformat()
        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()), "session_id": session_id, "user_id": user_id,
            "role": "user", "content": message, "model": model, "ts": now,
        })
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

        await db.chat_messages.insert_one({
            "id": str(uuid.uuid4()), "session_id": session_id, "user_id": user_id,
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
async def chat(req: ChatRequest, user: dict = Depends(auth_module.get_current_user)):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    if len(req.message) > MAX_MSG_LEN:
        raise HTTPException(status_code=413, detail=f"Message exceeds {MAX_MSG_LEN} chars")
    session_id = req.session_id or str(uuid.uuid4())
    attachment = None
    if req.attachment_base64:
        attachment = {"data": req.attachment_base64, "kind": req.attachment_kind or "text",
                      "name": req.attachment_name or "file"}
    return _luchii_stream(req.message, session_id, req.model or "luchii-70b",
                          user_id=user["id"], attachment=attachment)


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


@api_router.post("/generate/image")
async def generate_image(req: ImageGenRequest, user: dict = Depends(auth_module.get_current_user)):
    prompt = (req.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="A prompt is required")
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
        return {"image_base64": base64.b64encode(images[0]).decode("utf-8"), "session_id": session_id}
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


@api_router.post("/voice/speak")
async def voice_speak(req: SpeakRequest, user: dict = Depends(auth_module.get_current_user)):
    text = (req.text or "").strip()[:4000]
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_base64 = await tts.generate_speech_base64(text=text, model="tts-1", voice="coral")
        return {"audio_base64": audio_base64}
    except Exception:
        logger.exception("tts failed")
        raise HTTPException(status_code=502, detail="Voice generation failed")


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
    }


@api_router.post("/paypal/orders")
async def paypal_create_order(body: OrderCreate):
    plan = PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan")
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "reference_id": f"{plan['id']}::{body.key_id or 'none'}",
                        "description": f"Luchii {plan['name']} — {plan['credits']} credits",
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
        plan = PLANS.get(plan_id)
        credited = 0
        receipt = {"sent": False}
        if status == "COMPLETED" and plan:
            credited = plan["credits"]
            payer_email = body.email
            try:
                payer_email = payer_email or data["payer"]["email_address"]
            except Exception:
                pass
            await db.purchases.insert_one({
                "id": str(uuid.uuid4()), "order_id": order_id, "plan": plan_id,
                "credits": credited, "key_id": key_id, "status": status,
                "email": payer_email,
                "ts": datetime.now(timezone.utc).isoformat(),
            })
            if key_id:
                await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": credited}})
            receipt = await _send_receipt(payer_email, plan, order_id)
        return {"status": status, "credits_added": credited, "receipt": receipt}
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
    await auth_module.create_indexes()
    await auth_module.seed_admin()
    asyncio.create_task(_probe_upstreams())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
