from collections.abc import AsyncIterator

import httpx
import pytest

from luchii_api.main import app


pytestmark = pytest.mark.anyio


@pytest.fixture
async def client() -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)  # type: ignore[arg-type]
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


async def test_market_signal_uses_engine_surface(client: httpx.AsyncClient):
    response = await client.post(
        "/luchii/v1/market/signal",
        json={"symbol": "AAPL", "timeframe": "1h", "risk_profile": "balanced"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["signal"] in {"long", "hold", "short"}
    assert body["rationale"]


async def test_assist_endpoint_uses_engine_surface(client: httpx.AsyncClient):
    response = await client.post(
        "/luchii/v1/assist/rep",
        json={"intent": "follow-up", "context": "Prospect requested a recap"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["tone"] == "professional"
    assert body["message"]


async def test_model_token_endpoint_issues_opaque_token(client: httpx.AsyncClient):
    response = await client.post(
        "/luchii/v1/model/token",
        json={"model_name": "atlas"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model_name"] == "atlas"
    assert body["backend"]
    assert body["token"].startswith("mdl_")
    assert body["issued_at"]


async def test_model_token_endpoint_uses_requested_model_name(client: httpx.AsyncClient):
    response = await client.post(
        "/luchii/v1/model/token",
        json={"model_name": "fractal-7"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["model_name"] == "fractal-7"


async def test_model_token_endpoint_requires_model_name(client: httpx.AsyncClient):
    response = await client.post(
        "/luchii/v1/model/token",
        json={},
    )

    assert response.status_code == 422


async def test_api_key_endpoint_issues_key(client: httpx.AsyncClient):
    response = await client.post(
        "/luchii/v1/keys/api",
        json={"label": "ci"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["label"] == "ci"
    assert body["api_key"].startswith("sk_live_")
    assert body["issued_at"]
