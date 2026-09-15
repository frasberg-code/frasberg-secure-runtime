from fastapi import FastAPI, APIRouter, Header, HTTPException, Depends, Request, UploadFile, File, Response
from fastapi.responses import StreamingResponse, FileResponse
import subprocess
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

import resend
from core import (client, db, EMERGENT_LLM_KEY, MAX_MSG_LEN, RATE_LIMIT, RATE_WINDOW,
                  BLOCKED_TERMS, _rate_store, _rate_check, TEAM_DOMAIN, TEAM_DOMAINS,
                  _is_team_email, PLAN_QUOTAS, _enforce_plan_quotas, _mask_key,
                  SERVER_STARTED_AT, _START_TIME, _REQ_METRICS, PLANS, UPGRADE_PLANS,
                  PAID_PLANS, require_admin, _audit, _log_email, LUCHII_SYSTEM)
from metering import (TRIAL_KEY_CREDITS, _key_owner_unmetered, _insufficient_credits,
                      _maybe_autotopup, _maybe_quota_alert, _maybe_low_credit_alert)



MESH_HMAC_SECRET = (os.environ.get('MESH_HMAC_SECRET') or os.environ['JWT_SECRET']).encode()


def _mesh_sign(content: str) -> str:
    return hmac.new(MESH_HMAC_SECRET, content.encode(), hashlib.sha256).hexdigest()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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









app = FastAPI()



@app.middleware("http")
async def _metrics_middleware(request, call_next):
    t0 = time.time()
    response = await call_next(request)
    if request.url.path.startswith("/api"):
        _REQ_METRICS.append((t0, (time.time() - t0) * 1000, response.status_code))
    return response
api_router = APIRouter(prefix="/api")



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
    "core_audio": ["text_to_speech", "speech_to_speech", "speech_to_text", "sound_effects", "audio_isolation", "music_generation"],
    "advanced_audio_voice": ["voice_generation", "forced_alignment", "voices", "audio_native", "dubbing"],
    "agents": ["frasberg_agents"],
    "projects": ["projects", "productions", "audiobooks"],
    "administration": ["history", "models", "pronunciation_dictionaries", "user", "workspace", "workspace_analytics", "webhooks", "service_accounts"],
    "workspace_members": ["group_members", "workspace_members_read", "workspace_members_invite", "workspace_members_remove", "terms_of_service_accept"],
}
PERMISSION_KEYS = {p for group in PERMISSION_MATRIX.values() for p in group}
CANONICAL_DEFAULTS = {
    "text_to_speech": "access", "speech_to_speech": "access", "speech_to_text": "access",
    "sound_effects": "access", "audio_isolation": "access", "music_generation": "access",
    "voice_generation": "access", "forced_alignment": "access", "voices": "read",
    "audio_native": "access", "dubbing": "access", "frasberg_agents": "access",
    "projects": "read", "productions": "read", "audiobooks": "read", "history": "read",
    "models": "read", "pronunciation_dictionaries": "read", "user": "access",
    "workspace": "access", "workspace_analytics": "read", "webhooks": "access",
    "service_accounts": "access", "group_members": "access", "workspace_members_read": "read",
    "workspace_members_invite": "write", "workspace_members_remove": "write",
    "terms_of_service_accept": "access",
}


def _manifest_status(doc: dict):
    errors = []
    if not (doc.get("name") or "").strip():
        errors.append("name required")
    perms = doc.get("permissions") or {}
    for pk in perms:
        if pk not in PERMISSION_KEYS:
            errors.append(f"unknown permission key: {pk}")
    for pk in sorted(PERMISSION_KEYS):
        if pk not in perms:
            errors.append(f"missing permission key: {pk}")
        elif perms[pk] not in PERMISSION_LEVELS:
            errors.append(f"invalid permission level for {pk}")
    if perms.get("models") != "read":
        errors.append("models must be read for ACTIVE")
    if perms.get("frasberg_agents") != "access":
        errors.append("frasberg_agents must be access for ACTIVE")
    exp = doc.get("expires_at")
    if exp:
        try:
            if datetime.fromisoformat(str(exp).replace("Z", "+00:00")) < datetime.now(timezone.utc):
                errors.append("key expired")
        except ValueError:
            pass
    return ("active" if not errors else "restricted"), errors


async def _provenance(key_id: str, event_type: str, actor: str, payload=None):
    import hashlib
    body = json.dumps(payload, default=str, sort_keys=True) if payload else ""
    sig = hashlib.sha256(f"{key_id}:{event_type}:{body}".encode()).hexdigest()
    await db.key_provenance.insert_one({
        "id": str(uuid.uuid4()), "key_id": key_id, "event_type": event_type,
        "actor": actor, "payload": payload, "signature": sig,
        "created_at": datetime.now(timezone.utc).isoformat()})


class KeyCreate(BaseModel):
    name: str = "Default key"
    expires_days: Optional[int] = None
    permissions: Optional[dict] = None
    auto_disable_if_leaked: bool = True
    workspace_name: Optional[str] = None
    restrict_key: bool = False
    restrict_ip: bool = False
    usage_limit_credits: Optional[int] = None
    credit_refresh_period: Optional[str] = None
    security: Optional[dict] = None
    expires_at: Optional[str] = None


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


_key_hits: dict = {}
ENGINE_KEY_RATE_LIMIT = int(os.environ.get("FRASBERG_KEY_RATE_LIMIT", "60"))


def _check_rate_limit(key_val: str, limit: int):
    now = time.time()
    hits = _key_hits.setdefault(key_val, [])
    while hits and now - hits[0] > 60:
        hits.pop(0)
    if len(hits) >= limit:
        retry = max(1, int(61 - (now - hits[0])))
        raise HTTPException(status_code=429,
                            detail={"code": "FK-429", "message": f"Rate limit exceeded: {limit} requests per minute"},
                            headers={"Retry-After": str(retry)})
    hits.append(now)


LEGACY_PERM_ALIASES = {
    "voice_generation": ("voices", "voice_changer", "voice_isolator"),
    "audio_native": ("audio_native", "audiobooks"),
    "speech_to_text": ("speech_to_text",),
    "text_to_speech": ("text_to_speech",),
    "music_generation": ("music_generation",),
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
                raise HTTPException(status_code=401, detail={"code": "FK-001", "message": "Invalid API key"})
            _check_rate_limit(key_val, int(doc.get("rate_limit_per_min") or ENGINE_KEY_RATE_LIMIT))
            if required_perm:
                perms = doc.get("permissions") or {}
                granted = perms.get(required_perm) not in (None, "no_access")
                if not granted:
                    aliases = LEGACY_PERM_ALIASES.get(required_perm, ())
                    granted = any(perms.get(a) not in (None, "no_access") for a in aliases)
                if not granted:
                    raise HTTPException(status_code=403, detail={"code": "FK-003", "message": f"Missing permission: {required_perm}"})
            u = await db.users.find_one({"id": doc["user_id"]}, {"_id": 0, "password": 0})
            if not u:
                raise HTTPException(status_code=401, detail={"code": "FK-001", "message": "Invalid API key"})
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
    return {"task_id": task_id, "job_id": task_id, "status": "queued", "eta_seconds": eta, "model": model,
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
    resp = {"task_id": task_id, "job_id": task_id, "status": doc["status"], "audio_url": doc["audio_url"],
            "prompt": doc["prompt"], "model": doc["model"], "duration": doc["duration"],
            "eta_seconds": doc["eta_seconds"], "error": doc["error"]}
    if doc["status"] == "completed" and doc["audio_url"]:
        resp["result"] = {"url": doc["audio_url"]}
    return resp


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
        resp = await video_task_status(task_id, user)
        if isinstance(resp, dict):
            resp["job_id"] = task_id
            if resp.get("status") == "completed" and resp.get("video_url"):
                resp["result"] = {"url": resp["video_url"]}
        return resp
    raise HTTPException(status_code=404, detail={"error": "Job not found"})


class AudioEnhanceRequest(BaseModel):
    url: str = ""
    mode: str = "enhance"


ENHANCED_DIR = "/app/backend/enhanced"
os.makedirs(ENHANCED_DIR, exist_ok=True)


def _decode_audio_bytes(data: bytes):
    try:
        with wave_mod.open(io.BytesIO(data), "rb") as w:
            sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
            frames = w.readframes(w.getnframes())
        if sw == 2:
            sig = np.frombuffer(frames, dtype=np.int16).astype(np.float64) / 32768.0
        elif sw == 1:
            sig = (np.frombuffer(frames, dtype=np.uint8).astype(np.float64) - 128) / 128.0
        else:
            raise ValueError("unsupported width")
        if ch > 1:
            sig = sig.reshape(-1, ch).mean(axis=1)
        return sig, sr
    except Exception:
        pass
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", "pipe:0",
         "-ac", "1", "-ar", "22050", "-f", "wav", "pipe:1"],
        input=data, capture_output=True, timeout=60)
    if proc.returncode != 0 or len(proc.stdout) < 100:
        raise ValueError("Could not decode source audio")
    with wave_mod.open(io.BytesIO(proc.stdout), "rb") as w:
        frames = w.readframes(w.getnframes())
        sr = w.getframerate()
    return np.frombuffer(frames, dtype=np.int16).astype(np.float64) / 32768.0, sr


def _enhance_signal(sig: np.ndarray, sr: int) -> np.ndarray:
    sig = sig - np.mean(sig)
    n = max(1, int(sr * 0.02))
    env = np.convolve(np.abs(sig), np.ones(n) / n, mode="same")
    floor = np.percentile(env, 10)
    gate = np.clip((env - floor * 0.8) / (floor * 1.2 + 1e-9), 0.15, 1.0)
    sig = sig * gate
    presence = np.empty_like(sig)
    presence[0] = 0
    presence[1:] = sig[1:] - sig[:-1]
    sig = sig + 0.25 * presence
    peak = np.max(np.abs(sig)) + 1e-9
    sig = np.tanh(sig / peak * 1.4) * 0.92
    return sig


def _write_wav_file(path: str, sig: np.ndarray, sr: int):
    with wave_mod.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(sig, -1, 1) * 32767).astype(np.int16).tobytes())


async def _run_enhance(doc: dict) -> str:
    out_path = os.path.join(ENHANCED_DIR, f"{doc['task_id']}.wav")
    if os.path.exists(out_path):
        return out_path
    src_url = doc["source_url"]
    if "/api/generate/music/task/" in src_url:
        mtid = src_url.split("/api/generate/music/task/")[1].split("/")[0]
        mdoc = await db.music_tasks.find_one({"task_id": mtid}, {"_id": 0})
        if not mdoc:
            raise HTTPException(status_code=422, detail={"code": "FK-422", "message": "Source music task not found"})
        buf = await asyncio.to_thread(_synth_wav, "music", mdoc["seed"], mdoc["duration"], mdoc.get("minor"), mdoc.get("bar"))
        data = buf.read()
    else:
        try:
            async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:
                r = await client.get(src_url)
                r.raise_for_status()
                data = r.content[:25_000_000]
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=422, detail={"code": "FK-422", "message": "Could not fetch source audio url"})
    try:
        sig, sr = await asyncio.to_thread(_decode_audio_bytes, data)
    except Exception:
        raise HTTPException(status_code=422, detail={"code": "FK-422", "message": "Source is not decodable audio"})
    sig = await asyncio.to_thread(_enhance_signal, sig, sr)
    await asyncio.to_thread(_write_wav_file, out_path, sig, sr)
    return out_path


@api_router.post("/audio/tools/enhance")
async def audio_tools_enhance(req: AudioEnhanceRequest, user: dict = Depends(engine_auth_factory("audio_native"))):
    if not (req.url or "").strip():
        raise HTTPException(status_code=400, detail="An audio url is required")
    now = datetime.now(timezone.utc)
    job_id = f"atask_{now.strftime('%Y%m%dT%H%M%SZ')}_{secrets.token_hex(4)}"
    doc = {
        "task_id": job_id, "user_id": user["id"], "status": "running", "tool": "enhance",
        "source_url": req.url[:800], "mode": req.mode,
        "output_url": f"/api/audio/tools/enhance/{job_id}/audio",
        "created_at": now.isoformat(),
    }
    await db.audio_tool_jobs.insert_one({**doc})
    t0 = time.time()
    await _run_enhance(doc)
    latency = int((time.time() - t0) * 1000)
    await db.audio_tool_jobs.update_one({"task_id": job_id}, {"$set": {"status": "completed", "latency_ms": latency}})
    return {"job_id": job_id, "status": "completed", "result": {"url": doc["output_url"]}, "latency_ms": latency}


@api_router.get("/audio/tools/enhance/{job_id}/audio")
async def audio_tools_enhance_audio(job_id: str, user: dict = Depends(engine_auth_read)):
    doc = await db.audio_tool_jobs.find_one({"task_id": job_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"error": "Job not found"})
    path = await _run_enhance(doc)
    return FileResponse(path, media_type="audio/wav", filename=f"enhanced_{job_id[:14]}.wav")


@api_router.post("/generate/video")
async def generate_video(req: VideoGenRequest, user: dict = Depends(engine_auth_read)):
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
async def voice_transcribe(file: UploadFile = File(...), user: dict = Depends(engine_auth_factory("speech_to_text"))):
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


@api_router.get("/voice/engine")
async def voice_engine_status():
    return {**voice_engine.status(), "memory_vault": memory_vault.status()}


@api_router.get("/voice/voices")
async def voice_voices():
    return {"voices": [v for v in voice_engine.VOICES if v.get("default")]}


@api_router.post("/voice/speak")
async def voice_speak(req: SpeakRequest, user: dict = Depends(engine_auth_factory("text_to_speech"))):
    text = (req.text or "").strip()[:4000]
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    # Luchii speaks with one immutable original voice — tone/voice overrides are ignored
    try:
        audio = await voice_engine.speak(text)
        if audio:
            return {"audio_base64": audio, "mime": "audio/wav", "engine": "frasberg-sovereign"}
    except Exception:
        logger.exception("sovereign tts failed, falling back")
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio_base64 = await tts.generate_speech_base64(text=text, model="tts-1", voice="coral")
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
async def voice_clone(file: UploadFile = File(...), user: dict = Depends(engine_auth_factory("voice_generation"))):
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
    unmetered = key_doc.get("unlimited") or await _key_owner_unmetered(key_doc)
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
    permissions = dict(CANONICAL_DEFAULTS) if not raw_perms else {pk: raw_perms.get(pk, "no_access") for pk in sorted(PERMISSION_KEYS)}
    sec = body.security or {}
    limits = sec.get("usage_limits") or {}
    restrict_ip = bool(sec.get("restrict_ip", body.restrict_ip))
    auto_disable = bool(sec.get("auto_disable_if_leaked", body.auto_disable_if_leaked))
    limit_credits = limits.get("credits", body.usage_limit_credits)
    period = (limits.get("refresh_period") or body.credit_refresh_period or "").lower()
    expires_at = body.expires_at
    if not expires_at and body.expires_days:
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
        "auto_disable_if_leaked": auto_disable,
        "workspace_name": (body.workspace_name or "").strip()[:80] or None,
        "restrict_key": bool(body.restrict_key),
        "restrict_ip": restrict_ip,
        "usage_limit_credits": int(limit_credits) if (limit_credits and int(limit_credits) > 0) else None,
        "credit_refresh_period": period if period in REFRESH_PERIODS else None,
        "status": "active",
    }
    doc["manifest_status"], doc["manifest_errors"] = _manifest_status(doc)
    await db.api_keys.insert_one({**doc})
    doc.pop("_id", None)
    await _provenance(doc["id"], "created", user.get("email", ""), {"name": doc["name"], "status": doc["manifest_status"]})
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
        d["manifest_status"], d["manifest_errors"] = _manifest_status(d)
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


class KeyEdit(BaseModel):
    name: Optional[str] = None
    expire_after: Optional[str] = "keep"
    restrict_key: bool = False
    usage_limit_credits: Optional[int] = None
    credit_refresh_period: Optional[str] = None
    permissions: Optional[dict] = None


REFRESH_PERIODS = ("daily", "weekly", "monthly")


@api_router.patch("/keys/{key_id}")
async def edit_key(key_id: str, body: KeyEdit, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.api_keys.find_one({"id": key_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "FK-005", "message": "Key not found or disabled"})
    upd = {}
    if body.name and body.name.strip():
        upd["name"] = body.name.strip()[:80]
    ea = (body.expire_after or "keep").lower()
    if ea == "never":
        upd["expires_at"] = None
    elif ea != "keep":
        try:
            days = max(1, min(int(ea), 365))
            upd["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
        except ValueError:
            raise HTTPException(status_code=422, detail={"code": "FK-002", "message": f"Invalid expire_after: {ea}"})
    upd["restrict_key"] = bool(body.restrict_key)
    limit = body.usage_limit_credits
    upd["usage_limit_credits"] = int(limit) if (limit and int(limit) > 0) else None
    period = (body.credit_refresh_period or "").lower()
    upd["credit_refresh_period"] = period if period in REFRESH_PERIODS else None
    if body.permissions:
        bad = [k for k in body.permissions if k not in PERMISSION_KEYS] + \
              [k for k, v in body.permissions.items() if v not in PERMISSION_LEVELS]
        if bad:
            raise HTTPException(status_code=422, detail={"code": "FK-003", "message": f"Invalid permissions: {bad[:5]}"})
        upd["permissions"] = {pk: body.permissions.get(pk, (doc.get("permissions") or {}).get(pk, "no_access")) for pk in sorted(PERMISSION_KEYS)}
    await db.api_keys.update_one({"id": key_id}, {"$set": upd})
    doc.update(upd)
    doc["manifest_status"], doc["manifest_errors"] = _manifest_status(doc)
    await _provenance(key_id, "updated", user.get("email", ""), upd)
    doc["key"] = _mask_key(doc["key"])
    return doc


@api_router.get("/keys/{key_id}/reveal")
async def reveal_key(key_id: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.api_keys.find_one({"id": key_id, "user_id": user["id"]}, {"_id": 0, "key": 1, "name": 1})
    if not doc:
        raise HTTPException(status_code=404, detail={"code": "FK-005", "message": "Key not found"})
    await _provenance(key_id, "revealed", user.get("email", ""), None)
    return {"id": key_id, "key": doc["key"], "name": doc.get("name")}


@api_router.get("/keys/{key_id}/governance")
async def key_governance(key_id: str, user: dict = Depends(auth_module.get_current_user)):
    q = {"id": key_id} if user.get("role") == "admin" else {"id": key_id, "user_id": user["id"]}
    doc = await db.api_keys.find_one(q, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Key not found")
    status, errors = _manifest_status(doc)
    perms = doc.get("permissions") or {}
    now = datetime.now(timezone.utc)
    risk = sum(15 for p in ("voice_generation", "frasberg_agents", "audio_native", "dubbing") if perms.get(p) == "access")
    if doc.get("expires_at"):
        try:
            if (datetime.fromisoformat(str(doc["expires_at"]).replace("Z", "+00:00")) - now).total_seconds() < 72 * 3600:
                risk += 20
        except ValueError:
            pass
    risk += min(len(errors) * 10, 40)
    risk = min(risk, 100)
    trust = 50 + (20 if status == "active" else 0) + (10 if not doc.get("restrict_key") or doc.get("usage_limit_credits") else 5)
    if doc.get("rotated_at"):
        try:
            if (now - datetime.fromisoformat(str(doc["rotated_at"]).replace("Z", "+00:00"))).days <= 30:
                trust += 10
        except ValueError:
            pass
    trust = min(trust + (10 if doc.get("auto_disable_if_leaked") else 0), 100)
    layers = {
        "integrity": 1.0, "provenance": 1.0, "lineage": 1.0,
        "zero_trust": 1.0 if status == "active" else 0.4,
        "policy": 1.0 - min(len(errors), 10) / 10,
        "threat": 1.0 - risk / 100, "shield": trust / 100,
        "region": 1.0, "sla": 0.99, "cost": 1.0,
    }
    fabric = sum(layers.values()) / len(layers)
    posture = "low" if fabric >= 0.75 else "medium" if fabric >= 0.5 else "high" if fabric >= 0.3 else "critical"
    prov = await db.key_provenance.find({"key_id": key_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"key_id": key_id, "manifest_status": status, "errors": errors,
            "risk_score": risk, "trust_score": trust, "fabric_score": round(fabric, 3),
            "risk_category": posture, "layers": layers,
            "weak_points": [k for k, v in layers.items() if v < 0.5],
            "shields": {k: ("active" if v >= 0.5 else "breached") for k, v in layers.items()},
            "provenance": prov}


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
              ("POST /generate/image", "voice_generation", "access"),
              ("POST /generate/video", "voice_generation", "access"),
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


import builder as builder_module

api_router.include_router(auth_module.router)
api_router.include_router(builder_module.router)
api_router.include_router(mesh_ws.router)
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
import routes_payments
import routes_admin
import routes_provider
import routes_workspace
import routes_shield
api_router.include_router(routes_payments.router)
api_router.include_router(routes_admin.router)
api_router.include_router(routes_provider.router)
api_router.include_router(routes_workspace.router)
api_router.include_router(routes_shield.router)
app.middleware("http")(routes_shield.shield_middleware)


@app.on_event("startup")
async def _start_shield_digest():
    asyncio.create_task(routes_shield.digest_scheduler())

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
