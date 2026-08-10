from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Frasberg AI - Medical Research Fork",
    description="Non-clinical medical research support (v4.0.0)",
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
        "fork": "medical-research",
        "version": "4.0.0",
        "port": 8007,
        "status": "operational",
        "scope": "Non-clinical medical research, literature analysis, data support",
        "guardrails": [
            "NO CLINICAL DIAGNOSIS",
            "NO MEDICAL ADVICE",
            "NO TREATMENT RECOMMENDATIONS",
            "RESEARCH SUPPORT ONLY"
        ]
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "medical-research-fork",
        "version": "4.0.0"
    }

@app.get("/api/v4/medical-research/capabilities")
def medical_research_capabilities():
    return {
        "research_support": {
            "literature_search": True,
            "pubmed_integration": True,
            "clinical_trials_search": True,
            "meta_analysis_support": True,
            "citation_management": True
        },
        "data_analysis": {
            "statistical_analysis": True,
            "data_visualization": True,
            "epidemiological_modeling": True,
            "research_data_management": True
        },
        "collaboration": {
            "research_collaboration": True,
            "protocol_development": True,
            "grant_support": True,
            "publication_assistance": True
        },
        "strict_restrictions": [
            "NO clinical diagnosis",
            "NO medical advice to patients",
            "NO treatment recommendations",
            "Research support ONLY",
            "Non-clinical focus exclusively"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
