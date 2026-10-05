"""OpenAI LLM provider."""

import logging
import os
from typing import List, Tuple

from fastapi import HTTPException

logger = logging.getLogger(__name__)


class OpenAIProvider:
    """Calls the OpenAI chat completions API."""

    async def generate(
        self,
        model: str,
        messages: List[dict],
        temperature: float,
        max_tokens: int,
    ) -> Tuple[str, int, int]:
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="OpenAI API key not configured. Set OPENAI_API_KEY or LLM_API_KEY.",
            )
        try:
            from openai import AsyncOpenAI  # type: ignore
        except ImportError as exc:
            raise HTTPException(
                status_code=503, detail="openai library not installed"
            ) from exc

        try:
            client = AsyncOpenAI(api_key=api_key)
            response = await client.chat.completions.create(
                model=model,
                messages=messages,  # type: ignore[arg-type]
                temperature=temperature,
                max_tokens=max_tokens,
            )
            output: str = response.choices[0].message.content or ""
            input_tokens: int = response.usage.prompt_tokens if response.usage else 0
            output_tokens: int = response.usage.completion_tokens if response.usage else 0
            return output, input_tokens, output_tokens
        except Exception as exc:
            logger.error("OpenAI API error", exc_info=True)
            raise HTTPException(status_code=502, detail="OpenAI request failed") from exc
