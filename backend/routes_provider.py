import os
import time
import json
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse, PlainTextResponse
from pydantic import BaseModel

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

import auth as auth_module
import memory_vault
from core import db, EMERGENT_LLM_KEY, LUCHII_SYSTEM, MAX_MSG_LEN, BLOCKED_TERMS, _REQ_METRICS, _START_TIME
from metering import _validate_bearer_key, _meter_key

logger = logging.getLogger(__name__)
router = APIRouter()

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


@router.get("/v1/models")
async def oai_list_models():
    created = int(_START_TIME.timestamp())
    return {"object": "list", "data": [
        {"id": m, "object": "model", "created": created, "owned_by": "frasberg",
         "capabilities": {"chat": kind == "chat", "embeddings": kind == "embed"}}
        for m, kind in PROVIDER_REGISTRY["models"].items()
    ]}


@router.get("/v1/provider")
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


@router.post("/v1/chat/completions")
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


@router.post("/v1/embeddings")
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


@router.post("/support/contact")
async def support_contact(body: ContactBody):
    doc = {"id": str(uuid.uuid4()), "name": body.name.strip()[:80], "email": body.email.strip()[:120],
           "message": body.message.strip()[:4000], "created": datetime.now(timezone.utc).isoformat()}
    if not (doc["name"] and doc["email"] and doc["message"]):
        raise HTTPException(status_code=400, detail="All fields are required")
    await db.contact_messages.insert_one(doc)
    return {"ok": True}


@router.post("/support/chat")
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


@router.post("/benchmark/run")
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


@router.get("/benchmark/leaderboard")
async def benchmark_leaderboard():
    rows = await db.benchmark_runs.find({}, {"_id": 0, "user_id": 0}).sort("best", -1).to_list(15)
    return rows


@router.get("/provider/status")
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


@router.get("/.well-known/frasbergai-provider.json")
async def well_known_provider():
    return PROVIDER_REGISTRY


@router.get("/.well-known/frasberg-provider.json")
async def well_known_frasberg_provider():
    return FRASBERG_PROVIDER


@router.get("/v1/frasberg-provider.json")
async def v1_frasberg_provider():
    return FRASBERG_PROVIDER


@router.get("/.well-known/provider-manifest.json")
async def well_known_manifest():
    return PROVIDER_MANIFEST


@router.get("/.well-known/luchii-models.json")
async def well_known_models():
    return LUCHII_MODELS_DOC


@router.get("/v1/provider-registry.json")
async def v1_provider_registry():
    return PROVIDER_REGISTRY


@router.get("/v1/provider-manifest.json")
async def v1_provider_manifest():
    return PROVIDER_MANIFEST


@router.get("/v1/luchii-models.json")
async def v1_luchii_models():
    return LUCHII_MODELS_DOC


@router.get("/v1/openapi.yaml")
async def v1_openapi():
    return PlainTextResponse(_WELL_KNOWN_OPENAPI, media_type="application/yaml")


@router.get("/.well-known/openapi.yaml")
async def well_known_openapi():
    return PlainTextResponse(_WELL_KNOWN_OPENAPI, media_type="application/yaml")
