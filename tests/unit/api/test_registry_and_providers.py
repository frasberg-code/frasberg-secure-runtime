"""Unit tests for the provider registry and individual providers.

Tests cover:
- registry governance: default is local, cloud providers blocked without flag
- registry: known/unknown providers
- ollama provider: payload uses options with num_predict
- v3 delegation path
- v5.1 delegation path (including cloud override rejection)
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../backend"))


# ── Registry: default provider is local ───────────────────────────────────


def test_registry_default_provider_is_local(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)

    from backend.app.integrations.llm.registry import get_active_provider
    from backend.app.integrations.llm.providers.ollama import OllamaProvider

    provider = get_active_provider()
    assert isinstance(provider, OllamaProvider)


def test_registry_local_explicit(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "local")

    from backend.app.integrations.llm.registry import get_active_provider
    from backend.app.integrations.llm.providers.ollama import OllamaProvider

    provider = get_active_provider()
    assert isinstance(provider, OllamaProvider)


# ── Registry: governance blocks cloud by default ──────────────────────────


def test_registry_openai_blocked_without_flag(monkeypatch):
    from fastapi import HTTPException

    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.delenv("ENABLE_OPENAI", raising=False)

    from backend.app.integrations.llm.registry import get_active_provider

    with pytest.raises(HTTPException) as exc_info:
        get_active_provider()
    assert exc_info.value.status_code == 403
    assert "ENABLE_OPENAI" in exc_info.value.detail


def test_registry_anthropic_blocked_without_flag(monkeypatch):
    from fastapi import HTTPException

    monkeypatch.setenv("LLM_PROVIDER", "anthropic")
    monkeypatch.delenv("ENABLE_ANTHROPIC", raising=False)

    from backend.app.integrations.llm.registry import get_active_provider

    with pytest.raises(HTTPException) as exc_info:
        get_active_provider()
    assert exc_info.value.status_code == 403
    assert "ENABLE_ANTHROPIC" in exc_info.value.detail


def test_registry_openai_enabled_by_flag(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    monkeypatch.setenv("ENABLE_OPENAI", "true")

    from backend.app.integrations.llm.registry import get_active_provider
    from backend.app.integrations.llm.providers.openai import OpenAIProvider

    provider = get_active_provider()
    assert isinstance(provider, OpenAIProvider)


def test_registry_anthropic_enabled_by_flag(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "anthropic")
    monkeypatch.setenv("ENABLE_ANTHROPIC", "true")

    from backend.app.integrations.llm.registry import get_active_provider
    from backend.app.integrations.llm.providers.anthropic import AnthropicProvider

    provider = get_active_provider()
    assert isinstance(provider, AnthropicProvider)


# ── Registry: unknown provider raises 400 ─────────────────────────────────


def test_registry_unknown_provider_raises_400(monkeypatch):
    from fastapi import HTTPException

    monkeypatch.setenv("LLM_PROVIDER", "foobar")

    from backend.app.integrations.llm.registry import get_active_provider

    with pytest.raises(HTTPException) as exc_info:
        get_active_provider()
    assert exc_info.value.status_code == 400
    assert "foobar" in exc_info.value.detail


# ── Registry: list_providers includes enabled status ──────────────────────


def test_list_providers_cloud_disabled_by_default(monkeypatch):
    monkeypatch.delenv("ENABLE_OPENAI", raising=False)
    monkeypatch.delenv("ENABLE_ANTHROPIC", raising=False)

    from backend.app.integrations.llm.registry import list_providers

    providers = list_providers()
    names = {p["name"]: p["enabled"] for p in providers}
    assert names["local"] is True
    assert names["openai"] is False
    assert names["anthropic"] is False


def test_list_providers_cloud_enabled_by_flag(monkeypatch):
    monkeypatch.setenv("ENABLE_OPENAI", "true")
    monkeypatch.setenv("ENABLE_ANTHROPIC", "true")

    from backend.app.integrations.llm.registry import list_providers

    providers = list_providers()
    names = {p["name"]: p["enabled"] for p in providers}
    assert names["openai"] is True
    assert names["anthropic"] is True


# ── Ollama provider: payload structure ────────────────────────────────────


@pytest.mark.asyncio
async def test_ollama_payload_uses_options_and_num_predict(monkeypatch):
    monkeypatch.setenv("OLLAMA_ENDPOINT", "http://localhost:11434/api/chat")

    import httpx

    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = {
        "message": {"content": "test output"},
        "prompt_eval_count": 7,
        "eval_count": 13,
    }

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=mock_resp)

    with patch("backend.app.integrations.llm.providers.ollama.httpx.AsyncClient", return_value=mock_client):
        from backend.app.integrations.llm.providers.ollama import OllamaProvider

        provider = OllamaProvider()
        output, input_tokens, output_tokens = await provider.generate(
            model="llama3",
            messages=[{"role": "user", "content": "hi"}],
            temperature=0.5,
            max_tokens=256,
        )

    assert output == "test output"
    assert input_tokens == 7
    assert output_tokens == 13

    call_kwargs = mock_client.post.call_args
    payload = call_kwargs.kwargs.get("json") or call_kwargs.args[1]
    assert payload["model"] == "llama3"
    assert "options" in payload
    assert payload["options"]["temperature"] == 0.5
    assert payload["options"]["num_predict"] == 256
    assert payload["stream"] is False


# ── v5.1 endpoint: cloud override rejected ────────────────────────────────


def test_v51_rejects_cloud_provider_override():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from backend.app.integrations.llm import router as v51_router

    app = FastAPI()
    app.include_router(v51_router)

    client = TestClient(app, raise_server_exceptions=False)

    for cloud in ("openai", "anthropic"):
        response = client.post(
            "/api/v5.1/llm/generate",
            json={"prompt": "hello", "provider": cloud},
        )
        assert response.status_code == 403, f"Expected 403 for provider={cloud}"


# ── v5.1 endpoint: delegates to canonical ─────────────────────────────────


@pytest.mark.asyncio
async def test_v51_delegates_to_canonical(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "local")
    monkeypatch.setenv("FRASBERG_MODEL", "llama3")

    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock(return_value=("v51 output", 3, 7))

    with patch(
        "backend.app.integrations.llm.canonical.get_active_provider",
        return_value=mock_provider,
    ), patch(
        "backend.app.integrations.llm.canonical._log_usage_to_supabase",
        new_callable=AsyncMock,
    ):
        from backend.app.integrations.llm import router as v51_router

        app = FastAPI()
        app.include_router(v51_router)
        client = TestClient(app, raise_server_exceptions=True)

        response = client.post(
            "/api/v5.1/llm/generate",
            json={"prompt": "hello", "provider": "local"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "v51 output"
    assert data["usage"]["input_tokens"] == 3
    assert data["usage"]["output_tokens"] == 7


# ── v3 endpoint: delegates to canonical ───────────────────────────────────


@pytest.mark.asyncio
async def test_v3_delegates_to_canonical(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "local")
    monkeypatch.setenv("FRASBERG_MODEL", "llama3")

    mock_provider = MagicMock()
    mock_provider.generate = AsyncMock(return_value=("v3 output", 4, 8))

    with patch(
        "backend.app.integrations.llm.canonical.get_active_provider",
        return_value=mock_provider,
    ), patch(
        "backend.app.integrations.llm.canonical._log_usage_to_supabase",
        new_callable=AsyncMock,
    ):
        from backend.app.ai.llm.providers import generate_response, LLMRequest

        req = LLMRequest(prompt="test prompt")
        result = await generate_response(req)

    assert result.response == "v3 output"
    assert result.tokens_used == 12  # 4 + 8
    assert result.provider == "local"
    mock_provider.generate.assert_awaited_once()
