"""Tests for iter30: Luchii Live Actions, PayPal LINQ tiers, Daily usage graph."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return api


@pytest.fixture(scope="module")
def room_id():
    return f"TEST_room_{uuid.uuid4().hex[:8]}"


# ============ Luchii Live Actions — run_engine ============
class TestLuchiiRunEngine:
    def test_run_engine_threat(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/agents/luchii/actions",
                     json={"roomId": room_id, "action": "run_engine",
                           "from": "TEST_host",
                           "details": {"engine": "threat"}}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert isinstance(d.get("reply"), str) and len(d["reply"]) > 0
        assert "threat" in d["reply"].lower() or "🔮" in d["reply"]
        art = d.get("artifact")
        assert art and art.get("engine") == "threat"
        assert "tag" in art and "score" in art
        assert isinstance(art.get("recommendations"), list)

    def test_run_engine_billing(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/agents/luchii/actions",
                     json={"roomId": room_id, "action": "run_engine",
                           "from": "TEST_host",
                           "details": {"engine": "billing"}}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert d.get("artifact", {}).get("engine") == "billing"

    def test_run_engine_compliance(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/agents/luchii/actions",
                     json={"roomId": room_id, "action": "run_engine",
                           "from": "TEST_host",
                           "details": {"engine": "compliance"}}, timeout=90)
        assert r.status_code == 200, r.text
        assert r.json().get("artifact", {}).get("engine") == "compliance"


# ============ Luchii Live Actions — auto-detect via viewer_question ============
class TestLuchiiAutoDetect:
    def test_autodetect_threat_scan(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/agents/luchii/actions",
                     json={"roomId": room_id, "action": "viewer_question",
                           "from": "TEST_viewer",
                           "details": {"text": "can you run a threat scan?"}},
                     timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        art = d.get("artifact")
        assert art and art.get("engine") == "threat", f"expected threat artifact, got {art}"

    def test_plain_question_no_engine(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/agents/luchii/actions",
                     json={"roomId": room_id, "action": "viewer_question",
                           "from": "TEST_viewer",
                           "details": {"text": "what is LINQ?"}},
                     timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        # No engine artifact expected
        assert not d.get("artifact"), f"unexpected artifact: {d.get('artifact')}"
        assert isinstance(d.get("reply"), str) and len(d["reply"]) > 0


# ============ PayPal config — LINQ tiers ============
class TestPaypalLinqTiers:
    def test_config_has_linq_tiers(self, api):
        r = api.get(f"{BASE_URL}/api/paypal/config")
        assert r.status_code == 200
        d = r.json()
        assert d.get("configured") is True
        plans = {p["id"]: p for p in d.get("upgrade_plans", [])}
        for pid, price, plan in [("linq-operator", "15", "builder"),
                                 ("linq-architect", "30", "pro"),
                                 ("linq-sovereign", "60", "premium")]:
            assert pid in plans, f"missing {pid}"
            p = plans[pid]
            assert p.get("linq") is True
            assert str(p.get("price")).startswith(price)
            assert p.get("plan") == plan

    def test_create_order_linq_operator(self, auth_session):
        # LIVE mode — verify order creation ONLY, do NOT capture
        r = auth_session.post(f"{BASE_URL}/api/paypal/orders",
                              json={"plan_id": "linq-operator"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "id" in d and isinstance(d["id"], str) and len(d["id"]) > 0


# ============ Daily usage graph ============
class TestUsageDaily:
    def test_daily_usage_shape(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/keys/usage/daily")
        assert r.status_code == 200, r.text
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) == 14
        for entry in arr:
            assert "day" in entry and "requests" in entry and "tokens" in entry
            assert isinstance(entry["requests"], int)
            assert isinstance(entry["tokens"], int)

    def test_daily_usage_unauth(self, api):
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/keys/usage/daily")
        assert r.status_code == 401
