import asyncio
import logging
import threading

logger = logging.getLogger(__name__)

_model = None
_state = {"status": "idle"}


def _load():
    global _model
    try:
        _state["status"] = "loading"
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
        _state["status"] = "ready"
        logger.info("Memory Vault embedder ready")
    except Exception:
        logger.exception("Memory Vault embedder failed to load")
        _state["status"] = "unavailable"


def preload():
    if _state["status"] == "idle":
        threading.Thread(target=_load, daemon=True).start()


def preload_sync():
    if _state["status"] in ("idle", "unavailable"):
        _load()


def ready() -> bool:
    return _state["status"] == "ready"


def status() -> dict:
    return {"model": "all-MiniLM-L6-v2", "status": _state["status"]}


async def embed(text: str):
    if not ready() or not text:
        if not ready():
            logger.warning("embed skipped — vault status: %s", _state["status"])
        return None
    def run():
        return _model.encode(text[:1000], normalize_embeddings=True).tolist()
    try:
        return await asyncio.to_thread(run)
    except Exception:
        logger.exception("embedding failed")
        return None
