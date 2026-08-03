"""Luchii Mesh — standalone WebSocket server (frasberg-secure-v1).
HMAC-SHA256 tamper verification, Redis offline buffering (Mongo fallback), real Luchii inference."""
import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)
router = APIRouter()

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
MESH_HMAC_SECRET = os.environ["MESH_HMAC_SECRET"].encode()
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
REDIS_URL = os.environ.get("REDIS_URL", "")
BUFFER_TTL = 86400

MESH_SYSTEM = (
    "You are Luchii, the sovereign multi-tier intelligence of Frasberg, speaking over the "
    "frasberg-secure-v1 encrypted mesh. Be sharp, warm and concise. Never mention third-party "
    "AI providers — you run on Frasberg sovereign infrastructure."
)


def sign(data: dict) -> str:
    msg = json.dumps(data, sort_keys=True).encode()
    return hmac.new(MESH_HMAC_SECRET, msg, hashlib.sha256).hexdigest()


def verify(data: dict, sig: str) -> bool:
    return bool(sig) and hmac.compare_digest(sign(data), sig)


_redis = None
_redis_failed = False


async def _get_redis():
    global _redis, _redis_failed
    if not REDIS_URL or _redis_failed:
        return None
    if _redis is None:
        try:
            import redis.asyncio as aioredis
            _redis = aioredis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=3)
            await _redis.ping()
            logger.info("Mesh buffer: Redis connected")
        except Exception:
            logger.warning("Mesh buffer: Redis unreachable — using Mongo fallback")
            _redis_failed = True
            _redis = None
            return None
    return _redis


async def buffer_offline(client_id: str, message: dict):
    r = await _get_redis()
    if r:
        await r.rpush(f"mesh:offline:{client_id}", json.dumps(message))
        await r.expire(f"mesh:offline:{client_id}", BUFFER_TTL)
    else:
        await _db.mesh_offline.insert_one({
            "client_id": client_id, "message": message,
            "expires_at": datetime.now(timezone.utc) + timedelta(seconds=BUFFER_TTL),
        })


async def flush_offline(client_id: str) -> list:
    r = await _get_redis()
    if r:
        key = f"mesh:offline:{client_id}"
        raw = await r.lrange(key, 0, -1)
        await r.delete(key)
        return [json.loads(m) for m in raw]
    docs = await _db.mesh_offline.find({"client_id": client_id}).sort("expires_at", 1).to_list(500)
    if docs:
        await _db.mesh_offline.delete_many({"client_id": client_id})
    return [d["message"] for d in docs]


async def buffer_backend() -> str:
    return "redis" if await _get_redis() else "mongo-fallback"


class MeshConnectionManager:
    def __init__(self):
        self.active: dict[str, WebSocket] = {}

    async def connect(self, client_id: str, ws: WebSocket):
        await ws.accept()
        self.active[client_id] = ws
        logger.info("Mesh client connected: %s (total %d)", client_id, len(self.active))

    def disconnect(self, client_id: str):
        self.active.pop(client_id, None)
        logger.info("Mesh client disconnected: %s", client_id)

    async def send(self, client_id: str, data: dict) -> bool:
        ws = self.active.get(client_id)
        if ws:
            try:
                await ws.send_text(json.dumps(data))
                return True
            except Exception:
                self.disconnect(client_id)
        await buffer_offline(client_id, data)
        return False


manager = MeshConnectionManager()


def _signed(payload: dict) -> dict:
    return {**payload, "sig": sign(payload)}


@router.websocket("/ws/mesh/{client_id}")
async def mesh_websocket(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        for msg in await flush_offline(client_id):
            await websocket.send_text(json.dumps(msg))
            await asyncio.sleep(0.03)
        await websocket.send_text(json.dumps(_signed({
            "event": "connected", "mesh": "frasberg-secure-v1",
            "client_id": client_id, "timestamp": time.time(),
        })))
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                await websocket.send_text(json.dumps({"error": "Malformed payload — expected JSON."}))
                continue
            sig = data.pop("sig", "")
            if not verify(data, sig):
                await websocket.send_text(json.dumps({"error": "Tamper detected — signature invalid."}))
                continue
            if data.get("event") == "ping":
                await websocket.send_text(json.dumps(_signed({"event": "pong", "timestamp": time.time()})))
                continue
            content = (data.get("content") or "").strip()
            if not content:
                await websocket.send_text(json.dumps({"error": "Empty message."}))
                continue
            full = ""
            try:
                llm = LlmChat(
                    api_key=EMERGENT_LLM_KEY,
                    session_id=data.get("session_id") or f"mesh-{client_id}",
                    system_message=MESH_SYSTEM,
                ).with_model("anthropic", "claude-sonnet-4-6")
                async for event in llm.stream_message(UserMessage(text=content[:4000])):
                    if isinstance(event, TextDelta):
                        full += event.content
                        await websocket.send_text(json.dumps({"delta": event.content}))
                    elif isinstance(event, StreamDone):
                        break
            except Exception:
                logger.exception("mesh inference failed")
            if not full:
                full = "The mesh hit turbulence — please send that again."
            response = {"role": "assistant", "content": full, "mesh": "frasberg-secure-v1",
                        "timestamp": time.time()}
            await websocket.send_text(json.dumps({**_signed(response), "done": True}))
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception:
        logger.exception("mesh websocket error")
        manager.disconnect(client_id)


@router.post("/ws/buffer/{client_id}")
async def rest_buffer(client_id: str, payload: dict):
    """REST fallback — buffer a message for an offline mesh client (delivered on reconnect)."""
    delivered = await manager.send(client_id, _signed({**payload, "timestamp": time.time()}))
    return {"status": "delivered" if delivered else "buffered", "backend": await buffer_backend()}


@router.get("/ws/mesh-status")
async def mesh_status():
    return {"mesh": "frasberg-secure-v1", "active_clients": len(manager.active),
            "offline_buffer": await buffer_backend(), "integrity": "hmac-sha256"}
