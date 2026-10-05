"""Ollama (local) LLM provider."""

import logging
import os
from typing import List, Tuple

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

_DEFAULT_ENDPOINT = "http://localhost:11434/api/chat"


class OllamaProvider:
    """Calls the local Ollama /api/chat endpoint."""

    async def generate(
        self,
        model: str,
        messages: List[dict],
        temperature: float,
        max_tokens: int,
    ) -> Tuple[str, int, int]:
        endpoint = os.getenv("OLLAMA_ENDPOINT", _DEFAULT_ENDPOINT)
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        timeout = httpx.Timeout(connect=10.0, read=180.0, write=10.0, pool=10.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(endpoint, json=payload)
                resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.error("Ollama HTTP error: %s %s", exc.response.status_code, exc.request.url)
            raise HTTPException(status_code=502, detail="Ollama request failed") from exc
        except httpx.RequestError as exc:
            logger.error("Ollama connection error: %s", type(exc).__name__)
            raise HTTPException(status_code=502, detail="Ollama connection error") from exc

        data = resp.json()
        output: str = data.get("message", {}).get("content", "")
        input_tokens: int = data.get("prompt_eval_count", 0)
        output_tokens: int = data.get("eval_count", 0)
        return output, input_tokens, output_tokens
