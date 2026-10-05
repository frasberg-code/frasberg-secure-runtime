"""Anthropic LLM provider."""

import logging
import os
from typing import List, Tuple

from fastapi import HTTPException

logger = logging.getLogger(__name__)


class AnthropicProvider:
    """Calls the Anthropic messages API."""

    async def generate(
        self,
        model: str,
        messages: List[dict],
        temperature: float,
        max_tokens: int,
    ) -> Tuple[str, int, int]:
        api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("LLM_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="Anthropic API key not configured. Set ANTHROPIC_API_KEY or LLM_API_KEY.",
            )
        try:
            from anthropic import AsyncAnthropic  # type: ignore
        except ImportError as exc:
            raise HTTPException(
                status_code=503, detail="anthropic library not installed"
            ) from exc

        try:
            system_parts = [m["content"] for m in messages if m["role"] == "system"]
            user_messages = [m for m in messages if m["role"] != "system"]

            kwargs: dict = {
                "model": model,
                "messages": user_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if system_parts:
                kwargs["system"] = "\n\n".join(system_parts)

            client = AsyncAnthropic(api_key=api_key)
            response = await client.messages.create(**kwargs)
            output: str = response.content[0].text if response.content else ""
            input_tokens: int = response.usage.input_tokens if response.usage else 0
            output_tokens: int = response.usage.output_tokens if response.usage else 0
            return output, input_tokens, output_tokens
        except Exception as exc:
            logger.error("Anthropic API error", exc_info=True)
            raise HTTPException(status_code=502, detail="Anthropic request failed") from exc
