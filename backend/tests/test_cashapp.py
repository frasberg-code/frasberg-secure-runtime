"""CashApp payment flow tests - guest 401, admin gating, approve→user upgrade to pro."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-gateway-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASS = "LuchiiAdmin2026!"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def user_session():
    """Create a fresh test user (approve will upgrade them)."""
    s = requests.Session()
    email = f"TEST_cashapp_{int(time.time())}@example.com"
    password = "TestPass2026!"
    r = s.post(f"{API}/auth/register", json={"name": "TEST CashApp", "email": email, "password": password}, timeout=15)
    assert r.status_code in (200, 201), f"Register failed: {r.status_code} {r.text}"
    return s, email


# --- Config ---
def test_cashapp_config():
    r = requests.get(f"{API}/cashapp/config", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["cashtag"] == "$jccnvja"
    assert d["payee"] == "FRASBERG INC"
    plans = d["plans"]
    assert any(p["id"] == "luchii-pro" and p["price"] == "15.00" for p in plans)


# --- Guest 401 ---
def test_intent_guest_401():
    r = requests.post(f"{API}/cashapp/intent", json={"plan_id": "luchii-pro"}, timeout=10)
    assert r.status_code == 401


def test_my_guest_401():
    r = requests.get(f"{API}/cashapp/my", timeout=10)
    assert r.status_code == 401


# --- Admin 403 for non-admin ---
def test_admin_list_forbidden_for_user(user_session):
    s, _ = user_session
    r = s.get(f"{API}/admin/cashapp", timeout=10)
    assert r.status_code == 403


# --- Full flow: intent → confirm → admin list → approve → user upgraded ---
def test_full_flow_and_upgrade(user_session, admin_session):
    s, email = user_session

    # Intent
    r = s.post(f"{API}/cashapp/intent", json={"plan_id": "luchii-pro"}, timeout=15)
    assert r.status_code == 200, r.text
    intent = r.json()
    ref = intent["reference"]
    assert ref.startswith("LCH-")
    assert intent["amount"] == "15.00"
    assert intent["cashtag"] == "$jccnvja"
    assert intent["status"] == "awaiting_payment"
    assert "cash.app/$jccnvja/15.00" in intent["pay_url"]

    # Confirm
    r = s.post(f"{API}/cashapp/confirm", json={"reference": ref, "sender_cashtag": "$testsender"}, timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "pending_review"

    # My list
    r = s.get(f"{API}/cashapp/my", timeout=10)
    assert r.status_code == 200
    pays = r.json()["payments"]
    assert any(p["reference"] == ref and p["status"] == "pending_review" for p in pays)

    # Admin list contains it
    r = admin_session.get(f"{API}/admin/cashapp", timeout=15)
    assert r.status_code == 200
    admin_pays = r.json()["payments"]
    assert any(p["reference"] == ref for p in admin_pays)

    # Approve
    r = admin_session.post(f"{API}/admin/cashapp/{ref}/approve", timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "approved"

    # Verify user upgraded to pro
    r = s.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 200
    me = r.json()
    assert me.get("plan") == "pro", f"User not upgraded: {me}"


# --- Reject flow ---
def test_reject_flow(user_session, admin_session):
    s, _ = user_session
    r = s.post(f"{API}/cashapp/intent", json={"plan_id": "luchii-pro"}, timeout=15)
    ref = r.json()["reference"]
    s.post(f"{API}/cashapp/confirm", json={"reference": ref}, timeout=15)
    r = admin_session.post(f"{API}/admin/cashapp/{ref}/reject", timeout=15)
    assert r.status_code == 200
    assert r.json()["status"] == "rejected"


# --- Unknown ref → 404 ---
def test_approve_unknown_ref_404(admin_session):
    r = admin_session.post(f"{API}/admin/cashapp/LCH-NOPE9999/approve", timeout=10)
    assert r.status_code == 404


def test_reject_unknown_ref_404(admin_session):
    r = admin_session.post(f"{API}/admin/cashapp/LCH-NOPE9999/reject", timeout=10)
    assert r.status_code == 404


# --- Invalid plan ---
def test_intent_invalid_plan(user_session):
    s, _ = user_session
    r = s.post(f"{API}/cashapp/intent", json={"plan_id": "not-a-plan"}, timeout=10)
    assert r.status_code == 404
