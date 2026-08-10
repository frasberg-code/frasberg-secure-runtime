from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Frasberg - Research Fork",
    description="Academic research and data analysis",
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
        "fork": "research",
        "version": "3.0.0",
        "status": "operational",
        "port": 8004,
        "scope": "Academic research, data analysis, literature review"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "research-fork"}

@app.get("/api/v3/research/tools")
def get_research_tools():
    return {
        "tools": [
            "Literature search and summarization",
            "Data analysis and visualization",
            "Citation management",
            "Research methodology guidance",
            "Statistical analysis"
        ]
    }
