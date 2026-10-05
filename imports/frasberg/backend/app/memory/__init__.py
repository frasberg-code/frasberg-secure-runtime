from fastapi import APIRouter
from .storage.engine import router as storage_router
from .context.manager import router as context_router

memory_router = APIRouter()
memory_router.include_router(storage_router)
memory_router.include_router(context_router)

@memory_router.get("/api/v3/memory/status")
def memory_system_status():
    return {
        "memory_system": "operational",
        "version": "3.0.0",
        "capabilities": {
            "long_term_storage": True,
            "context_windows": True,
            "privacy_safe": True,
            "importance_scoring": True,
            "memory_recall": True
        }
    }
