"""Iter48 — Verified provider + token economy tests."""
import os
import uuid as _u
import pytest
import requests

from dotenv import dotenv_values as _dv
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _dv("/app/frontend/.env").get("REACT_APP_BACKEND_URL", "")).rstrip("/")
ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}
DOC = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Verified provider endpoints ----
def test_wellknown_frasberg_provider(sess):
    r = sess.get(f"{BASE_URL}/api/.well-known/frasberg-provider.json")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("name") == "Frasberg — Verified LLM Provider"
    assert j.get("verified") is True
    assert j["certification"]["certificate_id"] == "FRSB-LLM-2026-0001"
    assert isinstance(j.get("models"), (dict, list))
    assert isinstance(j.get("endpoints"), (dict, list))


def test_v1_frasberg_provider(sess):
    r = sess.get(f"{BASE_URL}/api/v1/frasberg-provider.json")
    assert r.status_code == 200
    assert r.json()["certification"]["certificate_id"] == "FRSB-LLM-2026-0001"


def test_regression_other_wellknown(sess):
    for path in ["/api/.well-known/frasbergai-provider.json",
                 "/api/.well-known/provider-manifest.json",
                 "/api/.well-known/luchii-models.json",
                 "/api/.well-known/openapi.yaml"]:
        r = sess.get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{path} → {r.status_code}"


def test_static_wellknown_no_api_prefix(sess):
    r = sess.get(f"{BASE_URL}/.well-known/frasberg-provider.json")
    assert r.status_code == 200, r.text
    # Should serve JSON (may go through frontend static)
    ct = r.headers.get("content-type", "")
    assert "json" in ct or r.text.strip().startswith("{"), f"ct={ct}, body={r.text[:200]}"
    assert "FRSB-LLM-2026-0001" in r.text


# ---- Token economy ----
def test_register_grants_50_tokens():
    s = requests.Session()
    email = f"TEST_iter48_{_u.uuid4().hex[:8]}@frasberg.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Iter48 Test", "email": email, "password": "TestPass2026!"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("tokens") == 50, f"expected 50, got {body}"
    # cleanup
    from pymongo import MongoClient
    from dotenv import dotenv_values
    env = dotenv_values("/app/backend/.env")
    client = MongoClient(env["MONGO_URL"])
    db = client[env["DB_NAME"]]
    db.users.delete_one({"email": email})
    client.close()


def test_login_returns_tokens_field():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=DOC)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "tokens" in body
    assert isinstance(body["tokens"], int) and body["tokens"] >= 100


def test_gift_endpoint_authed_and_idempotent():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=DOC)
    assert r.status_code == 200
    tokens_before = r.json()["tokens"]

    g1 = s.get(f"{BASE_URL}/api/auth/gift")
    assert g1.status_code == 200, g1.text
    j1 = g1.json()
    for k in ("tokens", "granted_today", "signup_grant", "daily_grant", "last_grant", "member_since"):
        assert k in j1, f"missing {k}"
    assert j1["signup_grant"] == 50
    assert j1["daily_grant"] == 100

    g2 = s.get(f"{BASE_URL}/api/auth/gift")
    j2 = g2.json()
    assert j2["granted_today"] == 0, "second call should not grant more"
    assert j2["tokens"] == j1["tokens"], "tokens should not change on second call"


def test_gift_unauth_401():
    s = requests.Session()
    r = s.get(f"{BASE_URL}/api/auth/gift")
    assert r.status_code == 401


# ---- Regression ----
def test_v1_models(sess):
    r = sess.get(f"{BASE_URL}/api/v1/models")
    assert r.status_code == 200


def test_admin_login():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
