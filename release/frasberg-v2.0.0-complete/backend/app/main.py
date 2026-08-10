"""Frasberg v2.0.0 - Main FastAPI Application with Voice & Governance."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from voice import voice_router
from governance import governance_router

app = FastAPI(
    title="Frasberg v2.0.0",
    description="Institution-Grade Operational Intelligence with Voice & Governance",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v2.0.0 routers
app.include_router(voice_router)
app.include_router(governance_router)

@app.get("/")
async def root():
    return {
        "name": "Frasberg",
        "type": "Institution-Grade Operational Intelligence",
        "version": "2.0.0",
        "status": "operational",
        "new_features": [
            "Voice system (TTS/STT, WebRTC, 11 languages)",
            "Governance system (hash-chained audit, Rule 902)",
            "Expert witness mode",
            "Voice fingerprinting (non-biometric)",
            "Real-time streaming"
        ],
        "limitations": [
            "no intent",
            "no discretion",
            "no legal conclusions",
            "no medical diagnosis",
            "no biometric identification",
            "voice fingerprints are audit-only (not identification)"
        ]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "canonical-core",
        "version": "2.0.0"
    }

@app.get("/api/v2/capabilities")
async def get_capabilities():
    return {
        "version": "2.0.0",
        "capabilities": {
            "voice_synthesis": {
                "enabled": True,
                "languages": 11,
                "emotions": 6,
                "speakers": 4
            },
            "speech_recognition": {
                "enabled": True,
                "languages": 11,
                "real_time": True
            },
            "audit_logging": {
                "enabled": True,
                "hash_chained": True,
                "rule_902_compliant": True
            },
            "expert_witness": {
                "enabled": True,
                "court_ready": True
            },
            "voice_fingerprinting": {
                "enabled": True,
                "biometric": False,
                "audit_only": True
            }
        }
    }
