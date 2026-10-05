"""Iter49 — Provider status, token spend, gift transfer tests."""
import os
import uuid as _u
import pytest
import requests
from datetime import datetime, timezone

from dotenv import dotenv_values as _dv
from pymongo import MongoClient

_env = _dv("/app/backend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _dv("/app/frontend/.env").get("REACT_APP_BACKEND_URL", "")).rstrip("/")
ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}
DOC = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}


def _mongo():
    client = MongoClient(_env["MONGO_URL"])
    return client, client[_env["DB_NAME"]]


def _login(email, password):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return s


# ---- Provider status ----
def test_provider_status_public():
    r = requests.get(f"{BASE_URL}/api/provider/status")
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("status", "uptime_pct", "requests_5m", "avg_latency_ms", "p95_latency_ms", "error_rate", "endpoints"):
        assert k in j, f"missing {k} in {list(j.keys())}"
    assert isinstance(j["endpoints"], list) and len(j["endpoints"]) >= 4, j["endpoints"]


# ---- Chat spend ----
def test_chat_spends_one_token_and_ledger_row():
    s = _login(**DOC)
    g0 = s.get(f"{BASE_URL}/api/auth/gift").json()
    before = g0["tokens"]
    # send chat SSE
    with s.post(f"{BASE_URL}/api/chat", json={"message": "hi", "session_id": "iter49-test"}, stream=True, timeout=30) as r:
        assert r.status_code == 200, r.text
        chunks = 0
        for line in r.iter_lines():
            if line:
                chunks += 1
            if chunks >= 2:
                break
        assert chunks >= 1
    # allow spend write
    import time; time.sleep(1.0)
    g1 = s.get(f"{BASE_URL}/api/auth/gift").json()
    assert g1["tokens"] == before - 1, f"expected {before-1}, got {g1['tokens']}"
    led = s.get(f"{BASE_URL}/api/auth/gift/ledger").json()
    assert isinstance(led, list) and len(led) > 0
    top = led[0]
    assert top["kind"] == "spend_chat"
    assert top["amount"] == -1


# ---- Admin exemption ----
def test_admin_chat_does_not_decrement():
    s = _login(**ADMIN)
    g0 = s.get(f"{BASE_URL}/api/auth/gift").json()
    before = g0.get("tokens", 0)
    assert g0.get("exempt") is True
    with s.post(f"{BASE_URL}/api/chat", json={"message": "hi", "session_id": "iter49-admin"}, stream=True, timeout=30) as r:
        assert r.status_code == 200, r.text
        for i, _ in enumerate(r.iter_lines()):
            if i >= 1:
                break
    import time; time.sleep(1.0)
    g1 = s.get(f"{BASE_URL}/api/auth/gift").json()
    assert g1["tokens"] == before, f"admin tokens changed: {before}->{g1['tokens']}"


# ---- Zero-token 402 for chat and builder ----
def test_out_of_tokens_402_chat_and_builder():
    email = f"test_iter49_{_u.uuid4().hex[:8]}@frasberg.com"
    pw = "TestPass2026!"
    s = requests.Session(); s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/register", json={"name": "z", "email": email, "password": pw})
    assert r.status_code == 200, r.text
    # zero out both tokens and credit_balance directly
    client, db = _mongo()
    try:
        db.users.update_one({"email": email}, {"$set": {"tokens": 0, "credit_balance": 0}})
        # chat -> 402
        cr = s.post(f"{BASE_URL}/api/chat", json={"message": "hi", "session_id": "iter49-out"})
        assert cr.status_code == 402, f"expected 402 got {cr.status_code}: {cr.text[:300]}"
        assert "Frasberg tokens" in cr.text or "token" in cr.text.lower()
        # builder -> 402
        br = s.post(f"{BASE_URL}/api/builder/generate", json={"prompt": "make a hello page"})
        assert br.status_code == 402, f"expected 402 got {br.status_code}: {br.text[:300]}"
        assert "5" in br.text or "build" in br.text.lower() or "token" in br.text.lower()
    finally:
        db.users.delete_one({"email": email})
        db.token_ledger.delete_many({"user_id": {"$exists": True}, "note": {"$regex": email}})
        client.close()


# ---- Gift transfer ----
def test_gift_transfer_happy_and_errors():
    s = _login(**DOC)
    g0 = s.get(f"{BASE_URL}/api/auth/gift").json()
    paid_before = g0["paid_tokens"]
    if paid_before < 10:
        pytest.skip(f"doctester1 wallet too low ({paid_before}) — cannot run transfer test safely")

    # amount 0 -> 400
    r = s.post(f"{BASE_URL}/api/auth/gift/transfer", json={"email": ADMIN["email"], "amount": 0})
    assert r.status_code == 400, r.text

    # self-transfer -> 400
    r = s.post(f"{BASE_URL}/api/auth/gift/transfer", json={"email": DOC["email"], "amount": 5})
    assert r.status_code == 400
    assert "yourself" in r.text.lower()

    # unknown email -> 404
    r = s.post(f"{BASE_URL}/api/auth/gift/transfer",
               json={"email": f"nobody_{_u.uuid4().hex[:6]}@frasberg.com", "amount": 5})
    assert r.status_code == 404

    # over-balance -> 400 with purchased-tokens rule
    r = s.post(f"{BASE_URL}/api/auth/gift/transfer",
               json={"email": ADMIN["email"], "amount": paid_before + 1000000})
    # server caps at 1_000_000 so ensure we test the message via a moderately impossible amount below cap
    if r.status_code == 400 and "Only purchased tokens can be gifted" in r.text:
        pass
    else:
        # try just above balance but under cap
        r2 = s.post(f"{BASE_URL}/api/auth/gift/transfer",
                    json={"email": ADMIN["email"], "amount": min(paid_before + 5, 999999)})
        assert r2.status_code == 400
        assert "Only purchased tokens can be gifted" in r2.text, r2.text

    # happy path: 10 doc -> admin
    amount = 10
    # snapshot admin wallet
    client, db = _mongo()
    admin_doc = db.users.find_one({"email": ADMIN["email"]}, {"credit_balance": 1})
    admin_paid_before = int((admin_doc or {}).get("credit_balance", 0))
    client.close()

    r = s.post(f"{BASE_URL}/api/auth/gift/transfer", json={"email": ADMIN["email"], "amount": amount})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["sent"] == amount
    assert body["paid_tokens"] == paid_before - amount

    # verify admin received
    client, db = _mongo()
    admin_after = db.users.find_one({"email": ADMIN["email"]}, {"credit_balance": 1})
    assert int(admin_after.get("credit_balance", 0)) == admin_paid_before + amount
    client.close()

    # ledger rows on doc
    led = s.get(f"{BASE_URL}/api/auth/gift/ledger").json()
    assert any(row["kind"] == "gift_sent" and row["amount"] == -amount for row in led[:5])

    # restore: admin sends amount back to doc
    sa = _login(**ADMIN)
    rback = sa.post(f"{BASE_URL}/api/auth/gift/transfer", json={"email": DOC["email"], "amount": amount})
    assert rback.status_code == 200, rback.text

    # verify final doc wallet restored
    g2 = s.get(f"{BASE_URL}/api/auth/gift").json()
    assert g2["paid_tokens"] == paid_before, f"balance not restored: {paid_before}->{g2['paid_tokens']}"


# ---- Regression ----
def test_gift_still_has_grant_fields():
    s = _login(**DOC)
    j = s.get(f"{BASE_URL}/api/auth/gift").json()
    for k in ("granted_today", "signup_grant", "daily_grant"):
        assert k in j


def test_wellknown_still_works():
    r = requests.get(f"{BASE_URL}/api/.well-known/frasberg-provider.json")
    assert r.status_code == 200
    assert "FRSB-LLM-2026-0001" in r.text
