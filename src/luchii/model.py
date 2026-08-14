from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from importlib import resources
import json
import logging
import secrets
from pathlib import Path
from typing import Any, Protocol


logger = logging.getLogger("luchii.model")


class TextGenerationBackend(Protocol):
    backend_name: str

    def generate(self, prompt: str, max_tokens: int, temperature: float) -> str:
        ...


@dataclass(slots=True)
class GenerationRequest:
    prompt: str
    max_tokens: int = 256
    temperature: float = 0.7


class TemplateBackend:
    backend_name = "template"

    def __init__(self, model_name: str):
        self.model_name = model_name

    def generate(self, prompt: str, max_tokens: int, temperature: float) -> str:
        clipped_prompt = prompt.strip().replace("\n", " ")
        return f"[{self.model_name}] Synthesized response: {clipped_prompt[:max_tokens]}"


class TransformersBackend:
    backend_name = "transformers"

    def __init__(self, model_source: str, model_name: str):
        from transformers import AutoModelForCausalLM, AutoTokenizer

        self.model_name = model_name
        self.model_source = model_source
        self.tokenizer = AutoTokenizer.from_pretrained(model_source)
        self.model = AutoModelForCausalLM.from_pretrained(model_source)

        if self.tokenizer.pad_token_id is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

    def generate(self, prompt: str, max_tokens: int, temperature: float) -> str:
        encoded = self.tokenizer(prompt, return_tensors="pt")
        output_ids = self.model.generate(  # type: ignore[misc]
            **encoded,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=temperature > 0,
            pad_token_id=self.tokenizer.pad_token_id,
        )
        decoded = str(self.tokenizer.decode(output_ids[0], skip_special_tokens=True))
        return (
            decoded[len(prompt):].strip()
            if decoded.startswith(prompt)
            else decoded.strip()
        )


class LuchiiModel:
    def __init__(self, config: dict[str, Any], backend: TextGenerationBackend):
        self.config = config
        self.backend = backend

    @classmethod
    def load(
        cls,
        model_name: str = "genesis-prime",
        model_source: str | None = None,
    ) -> "LuchiiModel":
        config = _load_default_config()
        config["model_name"] = model_name
        if model_source:
            config["model_source"] = model_source

        backend = _load_backend(config)
        return cls(config=config, backend=backend)

    @property
    def backend_name(self) -> str:
        return self.backend.backend_name

    def issue_model_token(self, model_name: str | None = None) -> dict[str, Any]:
        active_model_name = model_name or str(
            self.config.get("model_name", "genesis-prime")
        )
        return {
            "token": f"mdl_{secrets.token_urlsafe(32)}",
            "model_name": active_model_name,
            "backend": self.backend_name,
        }

    def generate(
        self,
        prompt: str,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        request = GenerationRequest(
            prompt=prompt,
            max_tokens=max_tokens or int(self.config.get("max_length", 256)),
            temperature=(
                temperature
                if temperature is not None
                else float(self.config.get("temperature", 0.7))
            ),
        )
        return self.backend.generate(
            request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

    def analyze_market(self, symbol: str, timeframe: str, risk_profile: str) -> dict[str, Any]:
        confidence = _stable_score(
            f"signal:{symbol}:{timeframe}:{risk_profile}:{self.config['model_name']}"
        )
        trend = "bullish" if confidence >= 0.5 else "bearish"
        signal = (
            "long" if confidence > 0.6 else "hold" if confidence > 0.4 else "short"
        )
        rationale = self.generate(
            (
                "Summarize a trading rationale in one sentence for "
                f"symbol={symbol}, timeframe={timeframe}, "
                f"risk_profile={risk_profile}, trend={trend}."
            ),
            max_tokens=48,
            temperature=0.2,
        )
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "trend": trend,
            "signal": signal,
            "confidence": confidence,
            "rationale": rationale,
        }

    def route_lead(self, lead_id: str, pressure: float) -> dict[str, Any]:
        destination = "enterprise" if pressure >= 0.7 else "smb"
        queue = "priority" if pressure >= 0.85 else "standard"
        priority = "high" if pressure >= 0.7 else "normal"
        return {
            "lead_id": lead_id,
            "destination": destination,
            "queue": queue,
            "priority": priority,
        }

    def coach_next_line(self, context: str, persona: str) -> dict[str, Any]:
        line = self.generate(
            f"Draft a concise next sales coaching line. Persona={persona}. Context={context}.",
            max_tokens=48,
            temperature=0.4,
        )
        return {
            "persona": persona,
            "line": line,
            "confidence": _stable_score(
                f"nextline:{persona}:{context}:{self.config['model_name']}"
            ),
        }

    def assist_rep(self, intent: str, context: str) -> dict[str, Any]:
        message = self.generate(
            f"Write a professional sales-assist response. Intent={intent}. Context={context}.",
            max_tokens=64,
            temperature=0.3,
        )
        return {
            "message": message,
            "tone": "professional",
        }

    def update_persona(self, persona_id: str, traits: dict[str, Any]) -> dict[str, Any]:
        summary = self.generate(
            f"Summarize persona {persona_id} with traits {json.dumps(traits, sort_keys=True)}.",
            max_tokens=48,
            temperature=0.2,
        )
        return {
            "persona_id": persona_id,
            "updated": True,
            "summary": summary,
        }


def _load_default_config() -> dict[str, Any]:
    with resources.files("luchii.config").joinpath("default.json").open(
        "r", encoding="utf-8"
    ) as handle:
        return json.load(handle)


def _load_backend(config: dict[str, Any]) -> TextGenerationBackend:
    model_name = str(config["model_name"])
    model_source = config.get("model_source")

    if not model_source or str(model_source).startswith("template:"):
        return TemplateBackend(model_name=model_name)

    local_path = Path(str(model_source))
    if local_path.exists() or "/" in str(model_source) or "\\" in str(model_source):
        try:
            return TransformersBackend(model_source=str(model_source), model_name=model_name)
        except Exception as exc:
            logger.warning("Falling back to template backend for %s: %s", model_name, exc)
            return TemplateBackend(model_name=model_name)

    try:
        return TransformersBackend(model_source=str(model_source), model_name=model_name)
    except Exception as exc:
        logger.warning("Falling back to template backend for %s: %s", model_name, exc)
        return TemplateBackend(model_name=model_name)


def _stable_score(seed: str) -> float:
    digest = sha256(seed.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16) / 0xFFFFFFFF
    return round(value, 3)
