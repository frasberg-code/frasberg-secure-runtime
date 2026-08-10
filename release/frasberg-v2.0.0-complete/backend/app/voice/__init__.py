from fastapi import APIRouter
from .tts.engine import router as tts_router
from .stt.engine import router as stt_router
from .webrtc.streamer import router as webrtc_router
from .fingerprint.generator import router as fingerprint_router

voice_router = APIRouter()
voice_router.include_router(tts_router)
voice_router.include_router(stt_router)
voice_router.include_router(webrtc_router)
voice_router.include_router(fingerprint_router)

@voice_router.get("/api/v2/voice/status")
def voice_system_status():
    return {
        "voice_system": "operational",
        "version": "2.0.0",
        "capabilities": {
            "tts": True,
            "stt": True,
            "webrtc": True,
            "fingerprinting": True,
            "languages": 11,
            "emotions": 6
        }
    }
