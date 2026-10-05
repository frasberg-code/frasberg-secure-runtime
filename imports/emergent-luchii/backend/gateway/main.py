import os
import time
import logging

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

FRB_LIVE_PREFIX = "frb_live_"
LUCHII_INTERNAL_URL = os.getenv("LUCHII_INTERNAL_URL", "https://frasberg.com/api").rstrip("/")
# Optional self-hosted image engine (OpenAI images-compatible). When set, image traffic
# never touches the Luchii platform engine — it runs fully on your own infrastructure.
FRB_IMAGE_ENGINE_URL = os.getenv("FRB_IMAGE_ENGINE_URL", "").rstrip("/")
FRB_IMAGE_ENGINE_KEY = os.getenv("FRB_IMAGE_ENGINE_KEY", "")

logger = logging.getLogger("frasberg-gateway")
app = FastAPI(title="Frasberg Gateway")


def validate_auth(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail={"error": "FK-001", "message": "missing bearer token"})
    token = auth[len("Bearer "):]
    if not token.startswith(FRB_LIVE_PREFIX):
        raise HTTPException(status_code=401, detail={"error": "FK-001", "message": "invalid frb_live key"})
    return token


@app.get("/v1/health")
async def health():
    return {"status": "ok", "gateway": "frasberg", "engine": "luchii"}


@app.get("/")
async def root():
    return {"gateway": "frasberg", "docs": "https://frasberg.com/docs", "health": "/v1/health"}


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    token = validate_auth(request)
    body = await request.json()
    messages = body.get("messages")
    if not isinstance(messages, list) or not messages:
        raise HTTPException(status_code=400, detail="messages array required")
    # Real front-door: forward to the Luchii engine — never a stub reply
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                f"{LUCHII_INTERNAL_URL}/v1/chat/completions",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                         "X-Luchii-Router": "1"},
                json={"model": body.get("model", "luchii-70b"), "messages": messages,
                      "max_tokens": body.get("max_tokens"), "temperature": body.get("temperature"),
                      "stream": False},
            )
        if r.status_code >= 400:
            return JSONResponse(status_code=r.status_code, content=r.json() if "json" in r.headers.get("content-type", "") else {"error": r.text[:300]})
        return JSONResponse(r.json())
    except httpx.HTTPError as e:
        logger.exception("luchii engine unreachable")
        raise HTTPException(status_code=502, detail=f"Luchii engine unreachable: {e}")


@app.post("/v1/images/generations")
async def images_generations(request: Request):
    """OpenAI images-compatible front door. Routes to FRB_IMAGE_ENGINE_URL (your own
    inference box) when configured, else to the Luchii platform image engine."""
    token = validate_auth(request)
    body = await request.json()
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt required")
    n = max(1, min(int(body.get("n") or 1), 4))
    model = body.get("model") or "frasberg-image"

    if FRB_IMAGE_ENGINE_URL:
        # Fully self-hosted path: pass the OpenAI-style request straight through.
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                r = await client.post(
                    f"{FRB_IMAGE_ENGINE_URL}/v1/images/generations",
                    headers={"Authorization": f"Bearer {FRB_IMAGE_ENGINE_KEY or token}",
                             "Content-Type": "application/json"},
                    json={"prompt": prompt, "model": model, "n": n,
                          "size": body.get("size", "1024x1024"), "response_format": "b64_json"},
                )
            if r.status_code >= 400:
                return JSONResponse(status_code=r.status_code,
                                    content=r.json() if "json" in r.headers.get("content-type", "") else {"error": r.text[:300]})
            return JSONResponse(r.json())
        except httpx.HTTPError as e:
            logger.exception("self-hosted image engine unreachable")
            raise HTTPException(status_code=502, detail=f"Image engine unreachable: {e}")

    # Platform engine path — X-Frasberg-Gateway header stops the platform from
    # routing back upstream to this gateway (loop guard).
    data = []
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            for _ in range(n):
                r = await client.post(
                    f"{LUCHII_INTERNAL_URL}/generate/image",
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                             "X-Frasberg-Gateway": "1"},
                    json={"prompt": prompt},
                )
                if r.status_code >= 400:
                    return JSONResponse(status_code=r.status_code,
                                        content=r.json() if "json" in r.headers.get("content-type", "") else {"error": r.text[:300]})
                data.append({"b64_json": r.json()["image_base64"]})
    except httpx.HTTPError as e:
        logger.exception("luchii image engine unreachable")
        raise HTTPException(status_code=502, detail=f"Luchii image engine unreachable: {e}")
    return {"created": int(time.time()), "model": model, "data": data}
