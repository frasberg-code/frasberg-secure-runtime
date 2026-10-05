"""Iter31 tests: Tip Jar orders, LINQ scheduler + alerts, Purchases history, Voice speak."""
import os
import pytest
import requests

try:
    from dotenv import load_dotenv
    load_dotenv("/app/frontend/.env")
except Exception:
    pass
BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASS = "LuchiiAdmin2026!"


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


# ---- Tip Jar (LIVE — never capture) ----
class TestTipJar:
    def test_tip_order_ok(self):
        r = requests.post(f"{BASE}/api/rooms/tip/orders",
                          json={"roomId": "TEST_tips", "amount": 5}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 3

    def test_tip_amount_too_low(self):
        r = requests.post(f"{BASE}/api/rooms/tip/orders",
                          json={"roomId": "TEST_tips", "amount": 0.5}, timeout=15)
        assert r.status_code == 400

    def test_tip_amount_too_high(self):
        r = requests.post(f"{BASE}/api/rooms/tip/orders",
                          json={"roomId": "TEST_tips", "amount": 600}, timeout=15)
        assert r.status_code == 400


# ---- Scheduler ----
class TestScheduler:
    def test_scheduler_unauth(self):
        r = requests.get(f"{BASE}/api/linq/scheduler", timeout=15)
        assert r.status_code == 401

    def test_scheduler_status(self, auth_session):
        r = auth_session.get(f"{BASE}/api/linq/scheduler", timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ("enabled", "last_run_day", "last_run_at", "engines", "recentRuns"):
            assert k in data, f"missing key {k}: {data}"
        assert set(data["engines"]) == {"threat", "compliance"}
        assert isinstance(data["recentRuns"], list)

    def test_scheduler_toggle(self, auth_session):
        # get current
        cur = auth_session.get(f"{BASE}/api/linq/scheduler", timeout=15).json()["enabled"]
        r1 = auth_session.post(f"{BASE}/api/linq/scheduler/toggle", timeout=15)
        assert r1.status_code == 200
        assert r1.json()["enabled"] != cur
        # toggle back
        r2 = auth_session.post(f"{BASE}/api/linq/scheduler/toggle", timeout=15)
        assert r2.json()["enabled"] == cur


# ---- Alerts ----
class TestAlerts:
    def test_alerts_unauth(self):
        r = requests.get(f"{BASE}/api/linq/alerts", timeout=15)
        assert r.status_code == 401

    def test_alerts_list(self, auth_session):
        r = auth_session.get(f"{BASE}/api/linq/alerts", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "alerts" in data and "unread" in data
        assert isinstance(data["alerts"], list)
        assert isinstance(data["unread"], int)

    def test_alerts_mark_read(self, auth_session):
        r = auth_session.post(f"{BASE}/api/linq/alerts/read", timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # verify unread now 0
        r2 = auth_session.get(f"{BASE}/api/linq/alerts", timeout=15)
        assert r2.json()["unread"] == 0


# ---- Purchases ----
class TestPurchases:
    def test_unauth(self):
        r = requests.get(f"{BASE}/api/purchases/my", timeout=15)
        assert r.status_code == 401

    def test_my_purchases(self, auth_session):
        r = auth_session.get(f"{BASE}/api/purchases/my", timeout=20)
        assert r.status_code == 200
        data = r.json()
        for k in ("purchases", "cashapp", "plan", "plan_started", "plan_expires"):
            assert k in data, f"missing {k}"
        assert isinstance(data["purchases"], list)
        assert isinstance(data["cashapp"], list)
        # admin should have at least one cashapp record
        assert len(data["cashapp"]) >= 1, f"admin cashapp empty: {data['cashapp']}"


# ---- Voice speak ----
class TestVoiceSpeak:
    def test_unauth(self):
        r = requests.post(f"{BASE}/api/voice/speak",
                          json={"text": "hi", "tone": "balanced"}, timeout=10)
        assert r.status_code == 401

    def test_speak_ok(self, auth_session):
        r = auth_session.post(f"{BASE}/api/voice/speak",
                              json={"text": "Hello from Luchii", "tone": "balanced"},
                              timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "audio_base64" in data
        assert isinstance(data["audio_base64"], str) and len(data["audio_base64"]) > 100
        assert "mime" in data
