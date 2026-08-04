"""Backend tests for the new subscription batch (trial/builder/luchii-pro/annual)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-gateway-demo.preview.emergentagent.com").rstrip("/")
# Load from frontend .env if not present
if "REACT_APP_BACKEND_URL" not in os.environ:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}
FREE = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_session():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def free_session():
    # Reset free user plan first
    s = _login(FREE)
    return s


# ---------- cashapp/config ----------
def test_cashapp_config_has_all_plans():
    r = requests.get(f"{BASE_URL}/api/cashapp/config", timeout=20)
    assert r.status_code == 200
    data = r.json()
    plan_ids = {p["id"] for p in data["plans"]}
    for pid in ("trial", "builder", "luchii-pro", "annual", "doc-single", "doc-pack"):
        assert pid in plan_ids, f"missing plan {pid}: got {plan_ids}"
    prices = {p["id"]: p["price"] for p in data["plans"]}
    assert prices["trial"] == "1.00"
    assert prices["builder"] == "5.00"
    assert prices["luchii-pro"] == "20.00"
    assert prices["annual"] == "108.00"


# ---------- keys gating ----------
def test_keys_free_user_returns_402(free_session):
    # Ensure user is free plan first via admin reset
    admin_s = _login(ADMIN)
    # find user via admin/users
    r = admin_s.get(f"{BASE_URL}/api/admin/users", timeout=20)
    users = r.json()
    doc = next((u for u in users if u["email"] == FREE["email"]), None)
    assert doc, "free user not seeded"
    # Reset plan to free by direct admin? no endpoint — need to check current plan
    if doc.get("plan") != "free":
        pytest.skip(f"free user plan is {doc.get('plan')} — needs manual reset")

    r = free_session.post(f"{BASE_URL}/api/keys", json={"name": "TEST_free_gate"}, timeout=20)
    assert r.status_code == 402, f"expected 402 got {r.status_code}: {r.text}"
    body = r.json()
    assert "subscription_required" in str(body).lower()


def test_keys_admin_success(admin_session):
    r = admin_session.post(f"{BASE_URL}/api/keys", json={"name": "TEST_admin_key"}, timeout=20)
    assert r.status_code == 200
    body = r.json()
    assert body["key"].startswith("luchii-sk-")
    # cleanup
    admin_session.delete(f"{BASE_URL}/api/keys/{body['id']}", timeout=20)


# ---------- Full cashapp builder upgrade flow ----------
def test_cashapp_builder_flow_upgrades_free_user():
    admin_s = _login(ADMIN)
    free_s = _login(FREE)

    # Ensure starting as free
    me = free_s.get(f"{BASE_URL}/api/auth/me", timeout=20).json()
    if me.get("plan") != "free":
        pytest.skip(f"free user plan is {me.get('plan')}, expected 'free'")

    # 1) create intent for builder
    r = free_s.post(f"{BASE_URL}/api/cashapp/intent", json={"plan_id": "builder"}, timeout=20)
    assert r.status_code == 200, r.text
    intent = r.json()
    assert intent["amount"] == "5.00"
    assert "pay_url" in intent
    ref = intent["reference"]

    # 2) confirm
    r = free_s.post(f"{BASE_URL}/api/cashapp/confirm", json={"reference": ref, "sender_cashtag": "$tester"}, timeout=20)
    assert r.status_code == 200
    assert r.json()["status"] == "pending_review"

    # 3) admin approve
    r = admin_s.post(f"{BASE_URL}/api/admin/cashapp/{ref}/approve", timeout=20)
    assert r.status_code == 200
    assert r.json()["status"] == "approved"

    # 4) user plan should now be builder
    me2 = free_s.get(f"{BASE_URL}/api/auth/me", timeout=20).json()
    assert me2.get("plan") == "builder", f"plan after approve = {me2.get('plan')}"

    # 5) user CAN create API key now
    r = free_s.post(f"{BASE_URL}/api/keys", json={"name": "TEST_builder_key"}, timeout=20)
    assert r.status_code == 200, r.text
    key_id = r.json()["id"]
    free_s.delete(f"{BASE_URL}/api/keys/{key_id}", timeout=20)


# ---------- Trial flow: plan_expires ~7d ----------
def test_cashapp_trial_flow_sets_plan_expires():
    admin_s = _login(ADMIN)
    free_s = _login(FREE)

    r = free_s.post(f"{BASE_URL}/api/cashapp/intent", json={"plan_id": "trial"}, timeout=20)
    assert r.status_code == 200
    ref = r.json()["reference"]
    assert r.json()["amount"] == "1.00"

    free_s.post(f"{BASE_URL}/api/cashapp/confirm", json={"reference": ref}, timeout=20)
    r = admin_s.post(f"{BASE_URL}/api/admin/cashapp/{ref}/approve", timeout=20)
    assert r.status_code == 200

    me = free_s.get(f"{BASE_URL}/api/auth/me", timeout=20).json()
    assert me.get("plan") == "trial", f"got plan {me.get('plan')}"
    assert me.get("plan_expires"), "plan_expires not set"
    from datetime import datetime, timezone, timedelta
    exp = datetime.fromisoformat(me["plan_expires"].replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    delta = exp - now
    assert timedelta(days=6, hours=20) < delta < timedelta(days=7, hours=4), f"expires delta = {delta}"


# ---------- teardown: reset free user plan ----------
def test_zz_reset_free_user_plan():
    """Reset doctester1 to free plan via direct mongo."""
    import subprocess
    # Use mongo shell via python
    from motor.motor_asyncio import AsyncIOMotorClient
    import asyncio
    with open("/app/backend/.env") as f:
        env = dict(line.strip().split("=", 1) for line in f if "=" in line and not line.startswith("#"))
    mongo_url = env["MONGO_URL"].strip('"')
    db_name = env["DB_NAME"].strip('"')

    async def reset():
        c = AsyncIOMotorClient(mongo_url)
        await c[db_name].users.update_one(
            {"email": FREE["email"]},
            {"$set": {"plan": "free"}, "$unset": {"plan_expires": ""}},
        )
        c.close()
    asyncio.run(reset())
    # verify
    s = _login(FREE)
    me = s.get(f"{BASE_URL}/api/auth/me", timeout=20).json()
    assert me.get("plan") == "free"
