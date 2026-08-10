from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Frasberg AI - Education Fork",
    description="Training and classroom simulation environment",
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
        "fork": "education",
        "version": "v1.0.0",
        "status": "operational",
        "port": 8001,
        "scope": "Training and classroom simulations"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "education-fork"}

@app.get("/api/v1/personas")
def list_personas():
    return {
        "personas": [
            {"id": "teacher", "name": "Classroom Teacher", "language": "en"},
            {"id": "tutor", "name": "Personal Tutor", "language": "en"},
            {"id": "trainer", "name": "Corporate Trainer", "language": "en"}
        ]
    }

@app.get("/api/v1/simulations")
def list_simulations():
    return {
        "simulations": [
            {"id": "classroom", "name": "Classroom Scenario", "active": True},
            {"id": "tutoring", "name": "One-on-One Tutoring", "active": True},
            {"id": "workshop", "name": "Group Workshop", "active": True}
        ]
    }

@app.get("/api/v1/status")
def status():
    return {
        "fork": "education",
        "isolation": "enforced",
        "core_access": "read-only",
        "scope_limits": "Non-clinical educational content only"
    }
