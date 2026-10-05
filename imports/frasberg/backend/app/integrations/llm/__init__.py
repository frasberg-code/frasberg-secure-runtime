"""LLM Integration Router for v5.1"""
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from .registry import get_active_provider, list_providers as _list_providers

router = APIRouter(prefix="/api/v5.1/llm", tags=["llm-real"])

_CLOUD_PROVIDERS = {"openai", "anthropic"}

class GenerateRequest(BaseModel):
    prompt: str
    provider: str = "local"
    model: Optional[str] = None
    max_tokens: int = 1000
    temperature: float = 0.7
    system_prompt: Optional[str] = None
    stream: bool = False

@router.post("/generate")
async def generate_real(request: GenerateRequest):
    """Generate using the canonical provider registry.

    Per-request cloud provider overrides are rejected (403) to enforce
    governance.  Provider selection is env-driven (LLM_PROVIDER).
    """
    if request.provider in _CLOUD_PROVIDERS:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Per-request cloud provider override ('{request.provider}') is not permitted. "
                "Set LLM_PROVIDER and the corresponding governance flag in the environment."
            ),
        )

    from .canonical import GenerateRequest as CanonicalRequest, Message, generate, _resolve_model

    messages = []
    if request.system_prompt:
        messages.append(Message(role="system", content=request.system_prompt))
    messages.append(Message(role="user", content=request.prompt))

    canonical_req = CanonicalRequest(model=request.model, messages=messages)
    result = await generate(canonical_req)

    return {
        "response": result.output,
        "provider": os.getenv("LLM_PROVIDER", "local"),
        "model": _resolve_model(request.model),
        "tokens_used": result.usage.input_tokens + result.usage.output_tokens,
        "usage": {"input_tokens": result.usage.input_tokens, "output_tokens": result.usage.output_tokens},
    }

@router.get("/providers")
async def list_providers_endpoint():
    """List available LLM providers and their governance status."""
    return {"providers": _list_providers()}
