from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI(
    title="Frasberg - Analytics Dashboard",
    description="Cross-fork meta-only analytics (no content)",
    version="v1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "analytics",
        "version": "v1.0.0",
        "status": "operational",
        "port": 5000,
        "data_type": "meta-only (no content)"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "analytics-dashboard"}

@app.get("/api/v1/metrics")
def get_metrics():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "forks": {
            "canonical": {
                "requests": 42,
                "health_checks": 156,
                "uptime_seconds": 18720
            },
            "education": {
                "requests": 28,
                "simulations_started": 7,
                "uptime_seconds": 3600
            },
            "healthcare": {
                "requests": 15,
                "simulations_started": 3,
                "uptime_seconds": 3600
            }
        },
        "note": "All metrics are meta-only. No content, PII, or sensitive data collected."
    }

@app.get("/api/v1/usage")
def get_usage():
    return {
        "total_requests": 85,
        "forks_active": 3,
        "personas_available": 6,
        "simulations_available": 6,
        "languages": ["en"],
        "privacy": "meta-only, content-free"
    }

@app.get("/api/v1/status")
def status():
    return {
        "analytics": "operational",
        "data_retention": "meta-only",
        "content_captured": False,
        "pii_captured": False,
        "cross_fork": True
    }
