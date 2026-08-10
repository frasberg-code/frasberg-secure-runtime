"""Sovereign provider registry for Frasberg AI.

Governance rules:
- Default provider is ``local`` (Ollama).
- Cloud providers are disabled unless explicitly enabled via env flags.
- No automatic cloud failover.
- Provider selection is env-driven; no per-request overrides.
"""

import os
from typing import List

from fastapi import HTTPException

# Cloud providers that require an explicit opt-in env flag.
_CLOUD_PROVIDERS: set = {"openai", "anthropic"}

# Maps cloud provider name → env var that enables it.
_GOVERNANCE_FLAGS: dict = {
    "openai": "ENABLE_OPENAI",
    "anthropic": "ENABLE_ANTHROPIC",
}

# Lazy factories — each entry is a zero-arg callable that creates a *new*
# provider instance on demand.  The lambdas ensure providers are not
# instantiated at import time (satisfying the lazy-factory requirement) and
# that each call to get_active_provider() returns a fresh instance.
_REGISTRY: dict = {
    "local": lambda: _make("local"),
    "openai": lambda: _make("openai"),
    "anthropic": lambda: _make("anthropic"),
}


def _make(name: str):
    if name == "local":
        from .providers.ollama import OllamaProvider

        return OllamaProvider()
    if name == "openai":
        from .providers.openai import OpenAIProvider

        return OpenAIProvider()
    if name == "anthropic":
        from .providers.anthropic import AnthropicProvider

        return AnthropicProvider()
    raise HTTPException(status_code=400, detail=f"Unknown provider '{name}'")


def get_active_provider():
    """Return a provider instance for the currently configured LLM_PROVIDER.

    Raises:
        HTTPException 400: if LLM_PROVIDER is unknown.
        HTTPException 403: if provider is a cloud provider not enabled by governance.
    """
    provider = os.getenv("LLM_PROVIDER", "local").lower()
    if provider not in _REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown LLM_PROVIDER '{provider}'. Supported values: {', '.join(_REGISTRY)}.",
        )
    if provider in _CLOUD_PROVIDERS:
        flag = _GOVERNANCE_FLAGS[provider]
        if os.getenv(flag, "false").lower() not in ("1", "true", "yes"):
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Provider '{provider}' is disabled by governance. "
                    f"Set {flag}=true to enable."
                ),
            )
    return _REGISTRY[provider]()


def list_providers() -> List[dict]:
    """Return registry entries with enabled status.

    Cloud providers are marked as not enabled unless the governance flag is set.
    """
    result = []
    for name in _REGISTRY:
        if name in _CLOUD_PROVIDERS:
            flag = _GOVERNANCE_FLAGS[name]
            enabled = os.getenv(flag, "false").lower() in ("1", "true", "yes")
        else:
            enabled = True
        result.append({"name": name, "enabled": enabled})
    return result
