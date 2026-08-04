"""Luchii Mesh — standalone WebSocket server (frasberg-secure-v1).
HMAC-SHA256 tamper verification, Redis offline buffering (Mongo fallback), real Luchii inference."""
import asyncio
import base64
import hashlib
import hmac
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from motor.motor_asyncio import AsyncIOMotorClient
from nacl.public import PrivateKey, SealedBox

import voice_engine
from dotenv import load_dotenv
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)
router = APIRouter()

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
MESH_HMAC_SECRET = (os.environ.get("MESH_HMAC_SECRET") or os.environ["JWT_SECRET"]).encode()
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


STATS = {"messages_in": 0, "messages_out": 0, "tamper_attempts": 0, "e2e_frames": 0}

client_voice: dict = {}

_e2e_sk = None


async def get_e2e_key() -> PrivateKey:
    global _e2e_sk
    if _e2e_sk is None:
        doc = await _db.mesh_keys.find_one({"id": "server-e2e"})
        if doc:
            _e2e_sk = PrivateKey(base64.b64decode(doc["sk"]))
        else:
            _e2e_sk = PrivateKey.generate()
            await _db.mesh_keys.insert_one({
                "id": "server-e2e", "sk": base64.b64encode(bytes(_e2e_sk)).decode(),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    return _e2e_sk


def e2e_pubkey_b64(sk: PrivateKey) -> str:
    return base64.b64encode(bytes(sk.public_key)).decode()


async def unseal(sealed_b64: str) -> dict:
    sk = await get_e2e_key()
    plain = SealedBox(sk).decrypt(base64.b64decode(sealed_b64))
    return json.loads(plain.decode())


async def _alert(atype: str, client_id: str, detail: str):
    try:
        await _db.mesh_alerts.insert_one({
            "id": str(uuid.uuid4()), "type": atype, "client_id": client_id,
            "detail": detail, "ts": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        logger.exception("mesh alert write failed")


async def rotate_e2e_key() -> str:
    global _e2e_sk
    _e2e_sk = PrivateKey.generate()
    await _db.mesh_keys.update_one({"id": "server-e2e"}, {"$set": {
        "sk": base64.b64encode(bytes(_e2e_sk)).decode(),
        "rotated_at": datetime.now(timezone.utc).isoformat(),
    }}, upsert=True)
    await _alert("key_rotation", "admin", "Mesh E2E server key rotated — new curve25519 keypair live")
    return e2e_pubkey_b64(_e2e_sk)


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
        sk = await get_e2e_key()
        await websocket.send_text(json.dumps(_signed({
            "event": "connected", "mesh": "frasberg-secure-v1",
            "client_id": client_id, "timestamp": time.time(),
            "e2e": "curve25519-sealed-box", "e2e_pubkey": e2e_pubkey_b64(sk),
        })))
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                await websocket.send_text(json.dumps({"error": "Malformed payload — expected JSON."}))
                continue
            if data.get("sealed"):
                try:
                    data = await unseal(data["sealed"])
                    STATS["e2e_frames"] += 1
                except Exception:
                    STATS["tamper_attempts"] += 1
                    await _alert("tamper", client_id, "Sealed payload could not be opened — possible forged E2E frame")
                    await websocket.send_text(json.dumps({"error": "Sealed payload could not be opened."}))
                    continue
            else:
                sig = data.pop("sig", "")
                if not verify(data, sig):
                    STATS["tamper_attempts"] += 1
                    await _alert("tamper", client_id, "HMAC signature invalid — payload rejected")
                    await websocket.send_text(json.dumps({"error": "Tamper detected — signature invalid."}))
                    continue
            if data.get("event") == "ping":
                await websocket.send_text(json.dumps(_signed({"event": "pong", "timestamp": time.time()})))
                continue
            if data.get("type") == "set_voice":
                requested = (data.get("voice") or "").strip()
                match = next((v for v in voice_engine.VOICES if v["name"].lower() == requested.lower() or v["id"] == requested), None)
                if match:
                    client_voice[client_id] = match["id"]
                    await websocket.send_text(json.dumps(_signed({"type": "voice_set", "voice": match["name"], "voice_id": match["id"], "status": "ok"})))
                else:
                    await websocket.send_text(json.dumps({"error": f"Unknown voice: {requested}"}))
                continue
            content = (data.get("content") or "").strip()
            if not content:
                await websocket.send_text(json.dumps({"error": "Empty message."}))
                continue
            STATS["messages_in"] += 1
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
                full = "Let's try that again — please resend your message."
            response = {"role": "assistant", "content": full, "mesh": "frasberg-secure-v1",
                        "timestamp": time.time()}
            STATS["messages_out"] += 1
            done_frame = {**_signed(response), "done": True}
            if data.get("speak"):
                try:
                    vid = client_voice.get(client_id)
                    audio = await voice_engine.speak(full[:600], "balanced", vid)
                    if audio:
                        done_frame.update({"audio": audio, "audio_format": "wav", "voice": vid or "default"})
                except Exception:
                    logger.exception("mesh voice synthesis failed")
            await websocket.send_text(json.dumps(done_frame))
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


@router.get("/mesh/pubkey")
async def mesh_pubkey():
    """Public curve25519 key — mobile clients seal payloads to this key (libsodium sealed box)."""
    sk = await get_e2e_key()
    return {"pubkey": e2e_pubkey_b64(sk), "algo": "curve25519-xsalsa20-poly1305 sealed box", "mesh": "frasberg-secure-v1"}


@router.get("/ws/mesh-status")
async def mesh_status():
    return {"mesh": "frasberg-secure-v1", "active_clients": len(manager.active),
            "offline_buffer": await buffer_backend(), "integrity": "hmac-sha256",
            "e2e": "curve25519-sealed-box", "stats": STATS}
