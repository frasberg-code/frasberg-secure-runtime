import os
import logging

import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

FRB_LIVE_PREFIX = "frb_live_"
LUCHII_INTERNAL_URL = os.getenv("LUCHII_INTERNAL_URL", "https://frasberg.com/api").rstrip("/")

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
