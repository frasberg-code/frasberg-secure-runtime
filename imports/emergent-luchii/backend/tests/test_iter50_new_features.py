"""Iter50 — Benchmark, gift email log, paypal config, kernels regression tests."""
import os
import time
import pytest
import requests
from dotenv import dotenv_values as _dv
from pymongo import MongoClient

_env = _dv("/app/backend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _dv("/app/frontend/.env").get("REACT_APP_BACKEND_URL", "")).rstrip("/")
ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}
DOC = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}


def _mongo():
    c = MongoClient(_env["MONGO_URL"])
    return c, c[_env["DB_NAME"]]


def _login(email, password):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return s


# ---- PayPal config ----
def test_paypal_config_public():
    r = requests.get(f"{BASE_URL}/api/paypal/config")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("configured") is True, j
    assert isinstance(j.get("client_id"), str) and len(j["client_id"]) > 5
    plans = j.get("plans")
    assert isinstance(plans, list) and len(plans) >= 3, plans
    for p in plans[:3]:
        assert "credits" in p, p


# ---- Benchmark: unauthenticated 401 ----
def test_benchmark_requires_auth():
    r = requests.post(f"{BASE_URL}/api/benchmark/run", json={"prompt": "hello"})
    assert r.status_code == 401, r.status_code


# ---- Benchmark: empty prompt 400 ----
def test_benchmark_empty_prompt_400():
    s = _login(**DOC)
    r = s.post(f"{BASE_URL}/api/benchmark/run", json={"prompt": "   "})
    assert r.status_code == 400, r.text


# ---- Benchmark: authed run cost 4, scores rising ----
def test_benchmark_authed_run_doctester():
    s = _login(**DOC)
    _, db = _mongo()
    u = db.users.find_one({"email": DOC["email"]})
    tokens_before = int(u.get("tokens") or 0)
    wallet_before = int(u.get("credit_balance") or 0)

    r = s.post(f"{BASE_URL}/api/benchmark/run", json={"prompt": "Explain why the sky is blue"}, timeout=60)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("cost_tokens") == 4, j
    tiers = j.get("tiers") or {}
    for k in ("1B", "7B", "70B", "X"):
        assert k in tiers, tiers.keys()
        t = tiers[k]
        for f in ("name", "label", "output", "scores", "weighted_total"):
            assert f in t, (k, list(t.keys()))
        for axis in ("depth", "precision", "abstraction", "multi_agent", "temporal", "creativity"):
            assert axis in t["scores"], (k, t["scores"])
    totals = [tiers[k]["weighted_total"] for k in ("1B", "7B", "70B", "X")]
    # Generally increasing — allow small dips but 1B < X and 1B < 70B
    assert totals[0] < totals[2], totals
    assert totals[0] < totals[3], totals

    # tokens debited by 4 (free first, then wallet)
    u2 = db.users.find_one({"email": DOC["email"]})
    tokens_after = int(u2.get("tokens") or 0)
    wallet_after = int(u2.get("credit_balance") or 0)
    delta = (tokens_before + wallet_before) - (tokens_after + wallet_after)
    assert delta >= 4, f"expected >=4 debit, got {delta} (t {tokens_before}->{tokens_after}, w {wallet_before}->{wallet_after})"

    # verify spend_benchmark ledger row was written for this user
    bench_row = db.token_ledger.find_one({"user_id": u["id"], "kind": "spend_benchmark"}, sort=[("at", -1)])
    assert bench_row is not None, "no spend_benchmark ledger row found"
    assert int(bench_row.get("amount", 0)) == -4, bench_row


# ---- Benchmark: admin exempt cost 0 ----
def test_benchmark_admin_exempt():
    s = _login(**ADMIN)
    r = s.post(f"{BASE_URL}/api/benchmark/run", json={"prompt": "Explain gravity briefly"}, timeout=60)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("cost_tokens") == 0, j


# ---- Gift transfer emits email_log gift_received ----
def test_gift_transfer_creates_email_log():
    _, db = _mongo()
    before = db.email_log.count_documents({"kind": "gift_received"})
    s = _login(**DOC)
    r = s.post(f"{BASE_URL}/api/auth/gift/transfer", json={"email": "admin@frasberg.com", "amount": 2})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("ok") is True, j

    # async task — give it a couple seconds
    found = None
    for _ in range(10):
        row = db.email_log.find_one({"kind": "gift_received", "to": "admin@frasberg.com"}, sort=[("at", -1)])
        after = db.email_log.count_documents({"kind": "gift_received"})
        if row and after > before:
            found = row
            break
        time.sleep(0.5)
    assert found is not None, f"no gift_received email_log created (before={before})"

    # restore balance
    sa = _login(**ADMIN)
    r2 = sa.post(f"{BASE_URL}/api/auth/gift/transfer", json={"email": DOC["email"], "amount": 2})
    assert r2.status_code == 200, r2.text
