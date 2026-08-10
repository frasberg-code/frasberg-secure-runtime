"""Canonical LLM endpoint for Frasberg AI.

Reads LLM_PROVIDER (default: local), FRASBERG_AI_MODEL,
FRASBERG_AI_TEMPERATURE, and FRASBERG_AI_MAX_TOKENS to route requests to
the appropriate provider and return a normalised response.

Provider selection is env-driven; there is no automatic cloud failover.
Cloud providers are disabled unless explicitly enabled via governance flags
(ENABLE_OPENAI, ENABLE_ANTHROPIC).
"""

import logging
import os
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .registry import get_active_provider

logger = logging.getLogger(__name__)

# ── defaults read once at import time; endpoint re-reads per request so that
#    env vars set after import (e.g. in tests) are picked up correctly.
_DEFAULT_MODEL = "llama3"
_DEFAULT_TEMPERATURE = 0.2
_DEFAULT_MAX_TOKENS = 4096

router = APIRouter(prefix="/api/llm", tags=["llm-canonical"])


# ── Request / Response models ──────────────────────────────────────────────


class Message(BaseModel):
    role: str
    content: str


class GenerateRequest(BaseModel):
    model: Optional[str] = Field(
        default=None,
        description=(
            "Model to use for generation. Pass ``'frasberg-ai'`` or omit to use "
            "the ``FRASBERG_AI_MODEL`` environment variable (default: ``gpt-4.1``). "
            "Any other value is forwarded verbatim to the provider."
        ),
    )
    messages: List[Message]


class UsageInfo(BaseModel):
    input_tokens: int
    output_tokens: int


class GenerateResponse(BaseModel):
    output: str
    usage: UsageInfo


# ── Helpers ────────────────────────────────────────────────────────────────


def _resolve_model(requested: Optional[str]) -> str:
    """Return the concrete model name.

    Uses FRASBERG_AI_MODEL env var when the request model is ``"frasberg-ai"``
    or omitted.
    """
    if not requested or requested == "frasberg-ai":
        return os.getenv("FRASBERG_AI_MODEL", _DEFAULT_MODEL)
    return requested


async def _log_usage_to_supabase(
    provider: str, model: str, input_tokens: int, output_tokens: int
) -> None:
    """Fire-and-forget usage log to Supabase.

    Does **not** log prompt content or secrets.  Silently skips when
    SUPABASE_URL / SUPABASE_KEY are not configured.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        logger.debug("Supabase not configured; skipping usage logging.")
        return

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{supabase_url}/functions/v1/log-event",
                headers={
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "event_type": "llm_usage",
                    "data": {
                        "provider": provider,
                        "model": model,
                        "input_tokens": input_tokens,
                        "output_tokens": output_tokens,
                    },
                },
            )
    except Exception as exc:
        logger.warning("Usage logging to Supabase failed (non-fatal): %s", exc)


async def generate(request: GenerateRequest) -> GenerateResponse:
    """Core generation logic — shared by the HTTP endpoint and agent wrappers."""
    provider_name = os.getenv("LLM_PROVIDER", "local").lower()
    model = _resolve_model(request.model)

    try:
        temperature = float(os.getenv("FRASBERG_AI_TEMPERATURE", str(_DEFAULT_TEMPERATURE)))
        if not 0.0 <= temperature <= 2.0:
            raise ValueError
    except ValueError:
        logger.warning(
            "FRASBERG_AI_TEMPERATURE is invalid; falling back to %.1f", _DEFAULT_TEMPERATURE
        )
        temperature = _DEFAULT_TEMPERATURE

    try:
        max_tokens = int(os.getenv("FRASBERG_AI_MAX_TOKENS", str(_DEFAULT_MAX_TOKENS)))
        if max_tokens < 1:
            raise ValueError
    except ValueError:
        logger.warning(
            "FRASBERG_AI_MAX_TOKENS is invalid; falling back to %d", _DEFAULT_MAX_TOKENS
        )
        max_tokens = _DEFAULT_MAX_TOKENS

    messages = [m.model_dump() for m in request.messages]

    provider = get_active_provider()
    output, input_tokens, output_tokens = await provider.generate(
        model, messages, temperature, max_tokens
    )

    await _log_usage_to_supabase(provider_name, model, input_tokens, output_tokens)

    return GenerateResponse(
        output=output,
        usage=UsageInfo(input_tokens=input_tokens, output_tokens=output_tokens),
    )


# ── HTTP endpoint ──────────────────────────────────────────────────────────


@router.post("/generate", response_model=GenerateResponse)
async def canonical_generate(request: GenerateRequest) -> GenerateResponse:
    """Canonical LLM generation endpoint.

    Reads ``LLM_PROVIDER`` (default: ``local``) from the environment and
    routes the request to the appropriate provider via the registry.  Cloud
    providers are disabled unless the corresponding governance flag is set
    (``ENABLE_OPENAI``, ``ENABLE_ANTHROPIC``).  When ``model`` is
    ``"frasberg-ai"`` or omitted the defaults from ``FRASBERG_AI_MODEL``,
    ``FRASBERG_AI_TEMPERATURE``, and ``FRASBERG_AI_MAX_TOKENS`` are applied.
    """
    return await generate(request)
