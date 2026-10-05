"""Iter56: API key permissions matrix, restrict-key enforcement, Stripe checkout, PayPal regression."""
import os
import asyncio
import pytest
import requests
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path("/app/backend/.env"))

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-gateway-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

DOC_EMAIL = "doctester1@frasberg.com"
DOC_PASS = "DocTester2026!"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": DOC_EMAIL, "password": DOC_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def mongo():
    cli = AsyncIOMotorClient(MONGO_URL)
    yield cli[DB_NAME]
    cli.close()


# ---- Permissions matrix ----
def test_permission_matrix_via_create_key(sess):
    # Create a minimal key with a permission from each new group to verify keys accepted
    perms = {
        "text_to_speech": "read",
        "music_generation": "write",
        "image_video_generation": "access",
        "frasberg_agents": "read",
        "projects": "read",
        "usage_analytics": "read",
        "workspace_analytics": "read",
        "workspace_members_read": "read",
    }
    r = sess.post(f"{API}/keys", json={"name": "TEST_iter56_perm", "permissions": perms})
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["key"].startswith("frb_live_")
    for k in perms:
        assert doc["permissions"].get(k) == perms[k], f"{k} not stored"
    # cleanup
    sess.delete(f"{API}/keys/{doc['id']}")


# ---- Restrict on create ----
def test_create_key_with_restrict(sess):
    body = {
        "name": "TEST_iter56_restrict_create",
        "restrict_key": True,
        "usage_limit_credits": 25,
        "credit_refresh_period": "monthly",
    }
    r = sess.post(f"{API}/keys", json=body)
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["restrict_key"] is True
    assert doc["usage_limit_credits"] == 25
    assert doc["credit_refresh_period"] == "monthly"
    # verify via GET
    lst = sess.get(f"{API}/keys").json()
    row = next(x for x in lst if x["id"] == doc["id"])
    assert row["restrict_key"] is True
    assert row["usage_limit_credits"] == 25
    assert row["credit_refresh_period"] == "monthly"
    sess.delete(f"{API}/keys/{doc['id']}")


# ---- Edit key ----
def test_edit_key_patch_persists(sess):
    r = sess.post(f"{API}/keys", json={"name": "TEST_iter56_edit"})
    kid = r.json()["id"]
    p = sess.patch(f"{API}/keys/{kid}", json={
        "name": "TEST_iter56_edit2", "expire_after": "keep",
        "restrict_key": True, "usage_limit_credits": 15, "credit_refresh_period": "daily"
    })
    assert p.status_code == 200, p.text
    d = p.json()
    assert d["name"] == "TEST_iter56_edit2"
    assert d["restrict_key"] is True
    assert d["usage_limit_credits"] == 15
    assert d["credit_refresh_period"] == "daily"
    # Toggle off
    p2 = sess.patch(f"{API}/keys/{kid}", json={"restrict_key": False})
    assert p2.status_code == 200
    assert p2.json()["restrict_key"] is False
    assert p2.json()["usage_limit_credits"] is None
    sess.delete(f"{API}/keys/{kid}")


# ---- Backend FK-429 enforcement ----
def test_restrict_key_fk429_enforcement(sess, mongo):
    # Create restricted key with limit=10, monthly, and preload usage doc=50
    r = sess.post(f"{API}/keys", json={
        "name": "TEST_iter56_enforce",
        "restrict_key": True, "usage_limit_credits": 10, "credit_refresh_period": "monthly",
    })
    assert r.status_code == 200, r.text
    doc = r.json()
    kid = doc["id"]
    raw_key = doc["key"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    async def _seed():
        await mongo.api_key_usage.insert_one({
            "key_id": kid, "day": today, "tokens": 50, "_test": True
        })
    asyncio.get_event_loop().run_until_complete(_seed())

    try:
        # Call gateway
        resp = requests.post(f"{API}/v1/chat/completions",
                             headers={"Authorization": f"Bearer {raw_key}"},
                             json={"model": "luchii-7b", "messages": [{"role": "user", "content": "hi"}]},
                             timeout=20)
        assert resp.status_code == 429, f"expected 429 got {resp.status_code}: {resp.text}"
        body = resp.json()
        # FastAPI wraps detail
        detail = body.get("detail", body)
        code = detail.get("code") if isinstance(detail, dict) else None
        assert code == "FK-429", f"expected FK-429, got: {body}"

        # Unrestrict
        p = sess.patch(f"{API}/keys/{kid}", json={"restrict_key": False})
        assert p.status_code == 200
        # Now non-429 (may be 200 or upstream error, but NOT 429 FK-429)
        resp2 = requests.post(f"{API}/v1/chat/completions",
                              headers={"Authorization": f"Bearer {raw_key}"},
                              json={"model": "luchii-7b", "messages": [{"role": "user", "content": "hi"}]},
                              timeout=30)
        if resp2.status_code == 429:
            det = resp2.json().get("detail", {})
            assert (isinstance(det, dict) and det.get("code") != "FK-429"), "still FK-429 after unrestrict"
    finally:
        async def _cleanup():
            await mongo.api_key_usage.delete_many({"key_id": kid})
        asyncio.get_event_loop().run_until_complete(_cleanup())
        sess.delete(f"{API}/keys/{kid}")


# ---- Stripe ----
def test_stripe_config():
    r = requests.get(f"{API}/payments/config", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert j.get("configured") is True
    assert len(j.get("plans", [])) == 3


def test_stripe_checkout_returns_502_not_activated():
    # NOTE: FastAPI returns 502 JSON, but Cloudflare intercepts 5xx responses
    # from the public URL and returns its own HTML error page.
    # Hit backend directly on localhost:8001 to verify the app response.
    r = requests.post("http://localhost:8001/api/payments/checkout",
                      json={"plan_id": "starter", "origin_url": BASE},
                      timeout=30)
    assert r.status_code == 502, f"expected 502 (Stripe not activated), got {r.status_code}: {r.text}"
    detail = r.json().get("detail", "")
    assert "not yet activated" in detail.lower() or "activation" in detail.lower(), detail
    # Public URL: Cloudflare masks the 502 body -> frontend can't parse detail
    r2 = requests.post(f"{API}/payments/checkout",
                       json={"plan_id": "starter", "origin_url": BASE}, timeout=30)
    assert r2.status_code == 502
    # This assertion documents the CF interception (body is HTML, not JSON)
    assert "cloudflare" in r2.text.lower() or "bad gateway" in r2.text.lower(), \
        "expected CF HTML on public URL; frontend must handle non-JSON body gracefully"


def test_stripe_status_unknown_404():
    r = requests.get(f"{API}/payments/status/unknown-session-abcxyz", timeout=15)
    assert r.status_code == 404


# ---- PayPal regression ----
def test_paypal_config_still_works():
    r = requests.get(f"{API}/paypal/config", timeout=15)
    assert r.status_code == 200
    j = r.json()
    assert "plans" in j
    assert len(j["plans"]) >= 1
