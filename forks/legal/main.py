from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Frasberg AI - Legal Fork",
    description="Litigation support, discovery, and exhibit preparation (NO LEGAL ADVICE)",
    version="3.0.0"
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
        "fork": "legal",
        "version": "3.0.0",
        "status": "operational",
        "port": 8003,
        "scope": "Litigation support and document analysis (NO LEGAL ADVICE)",
        "critical_limits": "NO LEGAL CONCLUSIONS | NO LEGAL ADVICE | TECHNICAL SUPPORT ONLY"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "legal-fork"}

@app.get("/api/v3/legal/capabilities")
def get_capabilities():
    return {
        "capabilities": [
            "Document analysis (technical)",
            "Discovery organization",
            "Exhibit preparation",
            "Timeline generation",
            "FRE Rule 902 certification"
        ],
        "prohibited": [
            "Legal advice",
            "Legal conclusions",
            "Case strategy",
            "Legal opinions"
        ]
    }
