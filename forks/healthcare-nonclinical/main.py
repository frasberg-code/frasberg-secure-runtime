from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Frasberg AI - Healthcare Fork (Non-Clinical)",
    description="Patient interaction simulations - NO DIAGNOSIS, NO TREATMENT",
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
        "fork": "healthcare-nonclinical",
        "version": "v1.0.0",
        "status": "operational",
        "port": 8002,
        "scope": "Non-clinical patient interaction simulations",
        "critical_limits": "NO DIAGNOSIS | NO TREATMENT | NO MEDICAL DECISIONS"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "healthcare-fork"}

@app.get("/api/v1/personas")
def list_personas():
    return {
        "personas": [
            {"id": "intake", "name": "Intake Coordinator", "language": "en", "scope": "administrative"},
            {"id": "bedside", "name": "Bedside Support", "language": "en", "scope": "non-clinical"},
            {"id": "concierge", "name": "Patient Concierge", "language": "en", "scope": "administrative"}
        ]
    }

@app.get("/api/v1/simulations")
def list_simulations():
    return {
        "simulations": [
            {"id": "intake", "name": "Patient Intake (Administrative)", "clinical": False},
            {"id": "bedside", "name": "Bedside Communication (Non-Clinical)", "clinical": False},
            {"id": "discharge", "name": "Discharge Planning (Administrative)", "clinical": False}
        ]
    }

@app.get("/api/v1/scope-limits")
def scope_limits():
    return {
        "prohibited": [
            "Medical diagnosis",
            "Treatment recommendations",
            "Medication advice",
            "Clinical decision-making",
            "Symptom assessment for diagnostic purposes"
        ],
        "allowed": [
            "Administrative intake",
            "Non-clinical bedside support",
            "Comfort and communication",
            "Discharge coordination (administrative)"
        ]
    }

@app.get("/api/v1/status")
def status():
    return {
        "fork": "healthcare-nonclinical",
        "isolation": "enforced",
        "core_access": "read-only",
        "clinical_capabilities": "NONE - strictly non-clinical",
        "compliance": "scope-limited by design"
    }
