import time
from datetime import datetime, timezone

from fastapi import FastAPI
from pydantic import BaseModel

from luchii import LuchiiModel


app = FastAPI(title="Luchii API", version="1.0.0")
model = LuchiiModel.load("genesis-prime")


class GenerateRequest(BaseModel):
    prompt: str
    model_name: str | None = None
    max_tokens: int = 256
    temperature: float = 0.7


class GenerateResponse(BaseModel):
    output: str
    usage: dict


class ModelTokenRequest(BaseModel):
    model_name: str


class ModelTokenResponse(BaseModel):
    token: str
    model_name: str
    backend: str
    issued_at: datetime


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    active_model = model if req.model_name is None else LuchiiModel.load(req.model_name)
    out = active_model.generate(
        req.prompt,
        max_tokens=req.max_tokens,
        temperature=req.temperature,
    )
    usage = {
        "tokens": len(out.split()),
        "request_id": f"req-{int(time.time())}",
        "backend": active_model.backend_name,
    }
    return GenerateResponse(output=out, usage=usage)


@app.post("/model/token", response_model=ModelTokenResponse)
def create_model_token(req: ModelTokenRequest) -> ModelTokenResponse:
    active_model = model if req.model_name is None else LuchiiModel.load(req.model_name)
    token_data = active_model.issue_model_token(req.model_name)
    return ModelTokenResponse(
        token=token_data["token"],
        model_name=token_data["model_name"],
        backend=token_data["backend"],
        issued_at=datetime.now(timezone.utc),
    )


@app.get("/health")
def health() -> dict:
    return {"status": "healthy"}
