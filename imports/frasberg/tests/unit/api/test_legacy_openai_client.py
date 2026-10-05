"""Unit tests for the hardened legacy OpenAI client.

Tests cover:
- Missing API key raises HTTPException 503
- Upstream provider exception raises HTTPException 502 without leaking details
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../backend"))


# ── Missing API key → 503 ─────────────────────────────────────────────────


def test_missing_api_key_raises_503(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    from backend.app.integrations.llm import openai_client as _mod

    with pytest.raises(HTTPException) as exc_info:
        _mod.OpenAIClient()
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Provider not configured"


def test_get_openai_client_missing_key_raises_503(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    from backend.app.integrations.llm.openai_client import get_openai_client

    with pytest.raises(HTTPException) as exc_info:
        get_openai_client()
    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "Provider not configured"


# ── Upstream provider error → 502 (no detail leakage) ────────────────────


@pytest.mark.asyncio
async def test_provider_error_raises_502_no_leakage(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

    secret_message = "secret internal error details"

    mock_async_openai = MagicMock()
    mock_chat = MagicMock()
    mock_completions = MagicMock()
    mock_completions.create = AsyncMock(side_effect=Exception(secret_message))
    mock_chat.completions = mock_completions
    mock_async_openai.return_value.chat = mock_chat

    with patch("backend.app.integrations.llm.openai_client.AsyncOpenAI", mock_async_openai):
        from backend.app.integrations.llm.openai_client import OpenAIClient

        client = OpenAIClient(api_key="sk-test-key")

        with pytest.raises(HTTPException) as exc_info:
            await client.generate(prompt="hello")

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Upstream provider error"
    assert secret_message not in exc_info.value.detail


# ── No mock mode ───────────────────────────────────────────────────────────


def test_no_mock_mode_attribute(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

    mock_async_openai = MagicMock()

    with patch("backend.app.integrations.llm.openai_client.AsyncOpenAI", mock_async_openai):
        from backend.app.integrations.llm.openai_client import OpenAIClient

        client = OpenAIClient(api_key="sk-test-key")
        assert not hasattr(client, "mock_mode")


# ── No streaming or embeddings ────────────────────────────────────────────


def test_no_generate_streaming_method(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

    mock_async_openai = MagicMock()

    with patch("backend.app.integrations.llm.openai_client.AsyncOpenAI", mock_async_openai):
        from backend.app.integrations.llm.openai_client import OpenAIClient

        client = OpenAIClient(api_key="sk-test-key")
        assert not hasattr(client, "generate_streaming")


def test_no_generate_embeddings_method(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

    mock_async_openai = MagicMock()

    with patch("backend.app.integrations.llm.openai_client.AsyncOpenAI", mock_async_openai):
        from backend.app.integrations.llm.openai_client import OpenAIClient

        client = OpenAIClient(api_key="sk-test-key")
        assert not hasattr(client, "generate_embeddings")
