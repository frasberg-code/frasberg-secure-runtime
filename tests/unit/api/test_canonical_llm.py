"""Unit tests for the canonical LLM endpoint (POST /api/llm/generate).

Tests cover:
- env-var parsing and model resolution
- provider routing via registry
- response normalisation
- graceful error handling when providers are unknown or governance-blocked
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure the backend package is importable regardless of where pytest is run
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../backend"))

from backend.app.integrations.llm.canonical import (
    GenerateRequest,
    GenerateResponse,
    Message,
    _resolve_model,
    generate,
)


# ── _resolve_model ─────────────────────────────────────────────────────────


def test_resolve_model_none_uses_env(monkeypatch):
    monkeypatch.setenv("FRASBERG_AI_MODEL", "my-model")
    assert _resolve_model(None) == "my-model"


def test_resolve_model_frasberg_ai_uses_env(monkeypatch):
    monkeypatch.setenv("FRASBERG_AI_MODEL", "llama3")
    assert _resolve_model("frasberg-ai") == "llama3"


def test_resolve_model_explicit_passes_through(monkeypatch):
    monkeypatch.setenv("FRASBERG_AI_MODEL", "llama3")
    assert _resolve_model("gpt-4o") == "gpt-4o"


def test_resolve_model_default_when_env_missing(monkeypatch):
    monkeypatch.delenv("FRASBERG_AI_MODEL", raising=False)
    assert _resolve_model(None) == "llama3"


# ── generate — unknown provider raises 400 via registry ───────────────────


@pytest.mark.asyncio
async def test_generate_unknown_provider_raises_400(monkeypatch):
    from fastapi import HTTPException

    monkeypatch.setenv("LLM_PROVIDER", "unknown_provider")

    req = GenerateRequest(messages=[Message(role="user", content="hello")])
    with pytest.raises(HTTPException) as exc_info:
        await generate(req)
    assert exc_info.value.status_code == 400
    assert "unknown_provider" in exc_info.value.detail


# ── generate — cloud provider blocked by governance raises 403 ─────────────


@pytest.mark.asyncio
async def test_generate_cloud_provider_disabled_raises_403(monkeypatch):
    from fastapi import HTTPException

    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.delenv("ENABLE_OPENAI", raising=False)

    req = GenerateRequest(messages=[Message(role="user", content="hello")])
    with pytest.raises(HTTPException) as exc_info:
        await generate(req)
    assert exc_info.value.status_code == 403
    assert "ENABLE_OPENAI" in exc_info.value.detail


# ── generate — local provider (default) ───────────────────────────────────


@pytest.mark.asyncio
async def test_generate_default_provider_is_local(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.setenv("FRASBERG_AI_MODEL", "llama3")

    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock(return_value=("Hello from Ollama", 5, 10))

    with patch(
        "backend.app.integrations.llm.canonical.get_active_provider",
        return_value=mock_provider,
    ), patch(
        "backend.app.integrations.llm.canonical._log_usage_to_supabase",
        new_callable=AsyncMock,
    ):
        req = GenerateRequest(messages=[Message(role="user", content="hello")])
        result = await generate(req)

    assert result.output == "Hello from Ollama"
    assert result.usage.input_tokens == 5
    assert result.usage.output_tokens == 10
    mock_provider.generate.assert_awaited_once()


# ── generate — openai routing (governance flag set) ────────────────────────


@pytest.mark.asyncio
async def test_generate_routes_to_openai(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("ENABLE_OPENAI", "true")
    monkeypatch.setenv("FRASBERG_AI_MODEL", "gpt-4.1")
    monkeypatch.setenv("FRASBERG_AI_TEMPERATURE", "0.2")
    monkeypatch.setenv("FRASBERG_AI_MAX_TOKENS", "4096")

    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock(return_value=("Hello from OpenAI", 10, 5))

    with patch(
        "backend.app.integrations.llm.canonical.get_active_provider",
        return_value=mock_provider,
    ), patch(
        "backend.app.integrations.llm.canonical._log_usage_to_supabase",
        new_callable=AsyncMock,
    ):
        req = GenerateRequest(
            model="frasberg-ai",
            messages=[Message(role="user", content="hello")],
        )
        result = await generate(req)

    assert isinstance(result, GenerateResponse)
    assert result.output == "Hello from OpenAI"
    assert result.usage.input_tokens == 10
    assert result.usage.output_tokens == 5
    mock_provider.generate.assert_awaited_once()
    # Verify the resolved model was passed
    call_args = mock_provider.generate.call_args
    assert call_args.args[0] == "gpt-4.1"


# ── generate — anthropic routing ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_generate_routes_to_anthropic(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "anthropic")
    monkeypatch.setenv("ENABLE_ANTHROPIC", "true")
    monkeypatch.setenv("FRASBERG_AI_MODEL", "claude-3-5-sonnet-20241022")

    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock(return_value=("Hello from Anthropic", 20, 8))

    with patch(
        "backend.app.integrations.llm.canonical.get_active_provider",
        return_value=mock_provider,
    ), patch(
        "backend.app.integrations.llm.canonical._log_usage_to_supabase",
        new_callable=AsyncMock,
    ):
        req = GenerateRequest(
            model="frasberg-ai",
            messages=[Message(role="user", content="hi")],
        )
        result = await generate(req)

    assert result.output == "Hello from Anthropic"
    assert result.usage.input_tokens == 20
    mock_provider.generate.assert_awaited_once()


# ── generate — explicit model override ────────────────────────────────────


@pytest.mark.asyncio
async def test_generate_explicit_model_overrides_env(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("ENABLE_OPENAI", "true")
    monkeypatch.setenv("FRASBERG_AI_MODEL", "llama3")

    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock(return_value=("output", 1, 1))

    with patch(
        "backend.app.integrations.llm.canonical.get_active_provider",
        return_value=mock_provider,
    ), patch(
        "backend.app.integrations.llm.canonical._log_usage_to_supabase",
        new_callable=AsyncMock,
    ):
        req = GenerateRequest(
            model="gpt-4o",
            messages=[Message(role="user", content="test")],
        )
        await generate(req)

    call_args = mock_provider.generate.call_args
    assert call_args.args[0] == "gpt-4o"


# ── _log_usage_to_supabase — no Supabase configured ───────────────────────


@pytest.mark.asyncio
async def test_log_usage_skips_when_supabase_not_configured(monkeypatch, caplog):
    import logging

    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_KEY", raising=False)

    from backend.app.integrations.llm.canonical import _log_usage_to_supabase

    with caplog.at_level(logging.DEBUG, logger="backend.app.integrations.llm.canonical"):
        await _log_usage_to_supabase("local", "llama3", 10, 5)

    assert "Supabase not configured" in caplog.text


# ── HTTP endpoint integration ─────────────────────────────────────────────


def test_canonical_endpoint_unknown_provider_returns_400(monkeypatch):
    """Verify the FastAPI route returns 400 for unknown provider."""
    monkeypatch.setenv("LLM_PROVIDER", "bogus")

    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from backend.app.integrations.llm.canonical import router as canonical_router

    _app = FastAPI()
    _app.include_router(canonical_router)

    client = TestClient(_app, raise_server_exceptions=False)
    response = client.post(
        "/api/llm/generate",
        json={
            "model": "frasberg-ai",
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert response.status_code == 400


def test_canonical_endpoint_cloud_disabled_returns_403(monkeypatch):
    """Verify the FastAPI route returns 403 when cloud provider governance blocks the request."""
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.delenv("ENABLE_OPENAI", raising=False)

    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from backend.app.integrations.llm.canonical import router as canonical_router

    _app = FastAPI()
    _app.include_router(canonical_router)

    client = TestClient(_app, raise_server_exceptions=False)
    response = client.post(
        "/api/llm/generate",
        json={
            "model": "frasberg-ai",
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert response.status_code == 403
