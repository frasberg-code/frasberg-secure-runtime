# LEGACY MODULE — used only by deprecated endpoints.
# Do not extend. Do not use for canonical provider routing.
"""Legacy OpenAI client — hardened for Frasberg sovereign governance."""
import logging
import os
from typing import Any, Dict, Optional

from fastapi import HTTPException

try:
    from openai import AsyncOpenAI  # type: ignore
except ImportError:
    AsyncOpenAI = None  # type: ignore

logger = logging.getLogger(__name__)


class OpenAIClient:
    """Hardened legacy OpenAI client (deprecated)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key or AsyncOpenAI is None:
            raise HTTPException(status_code=503, detail="Provider not configured")
        self._client = AsyncOpenAI(api_key=self.api_key)

    async def generate(
        self,
        prompt: str,
        model: str = "gpt-4-turbo-preview",
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate a chat completion (non-streaming)."""
        messages: list = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self._client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return {
                "response": response.choices[0].message.content,
                "model": model,
                "provider": "openai",
                "tokens_used": response.usage.total_tokens,
                "finish_reason": response.choices[0].finish_reason,
            }
        except Exception:
            logger.error("Upstream OpenAI error", exc_info=True)
            raise HTTPException(status_code=502, detail="Upstream provider error")


def get_openai_client() -> OpenAIClient:
    """Get a hardened OpenAI client instance."""
    return OpenAIClient()
