from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Frasberg - Government Fork",
    description="Public service support and policy analysis (v4.0.0)",
    version="4.0.0"
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
        "fork": "government",
        "version": "4.0.0",
        "port": 8006,
        "status": "operational",
        "scope": "Public service, policy analysis, civic technology",
        "guardrails": [
            "NO POLITICAL ADVOCACY",
            "NONPARTISAN ANALYSIS ONLY",
            "PUBLIC SERVICE FOCUSED"
        ]
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "government-fork",
        "version": "4.0.0"
    }

@app.get("/api/v4/government/capabilities")
def government_capabilities():
    return {
        "public_service": {
            "citizen_services": True,
            "case_management": True,
            "document_processing": True,
            "accessibility": True
        },
        "policy_analysis": {
            "policy_research": True,
            "impact_assessment": True,
            "data_analysis": True,
            "comparative_studies": True,
            "nonpartisan": True
        },
        "civic_technology": {
            "transparency_tools": True,
            "open_data_support": True,
            "civic_engagement": True,
            "digital_services": True
        },
        "restrictions": [
            "NO political advocacy",
            "Nonpartisan analysis ONLY",
            "Public service focused",
            "Strictly neutral stance"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
