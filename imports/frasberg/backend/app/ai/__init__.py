from fastapi import APIRouter
from .llm.providers import router as llm_router
from .orchestrator.engine import router as orchestrator_router
from .validation.detector import router as validation_router
from .prompts.templates import router as prompts_router
from .reasoning.chain import router as reasoning_router

ai_router = APIRouter()
ai_router.include_router(llm_router)
ai_router.include_router(orchestrator_router)
ai_router.include_router(validation_router)
ai_router.include_router(prompts_router)
ai_router.include_router(reasoning_router)

@ai_router.get("/api/v3/ai/status")
def ai_system_status():
    return {
        "ai_system": "operational",
        "version": "3.0.0",
        "capabilities": {
            "llm_providers": 5,
            "orchestration": True,
            "hallucination_detection": True,
            "prompt_engineering": True,
            "reasoning_chains": True,
            "explainable_ai": True
        }
    }
