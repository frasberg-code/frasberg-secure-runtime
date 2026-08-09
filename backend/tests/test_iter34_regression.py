"""Iteration 34 backend regression tests.

Covers:
- /api/games/voice cache + validation
- /api/paypal/config upgrade_plans (api-pro, api-scale)
- /api/keys auto-create 'Free Starter Key' for a new user, no duplicate on 2nd call
- /api/admin/tenants/analytics + /api/admin/tenants/{id} still working
- /api/games/streets/play smoke (HTML loads)
"""
import os
import uuid
import time
import pytest
import requests

def _load_frontend_env():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip()
    except Exception:
        pass
    return ""


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_env()).rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL missing"

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASS = "LuchiiAdmin2026!"
USER_EMAIL = "doctester1@frasberg.com"
USER_PASS = "DocTester2026!"


@pytest.fixture(scope="module")
def admin_client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def new_user_client():
    """Register a brand-new user for the auto-create Free Starter Key test."""
    s = requests.Session()
    email = f"TEST_iter34_{uuid.uuid4().hex[:10]}@frasberg.com"
    pw = "TestPass2026!"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"name": "iter34", "email": email, "password": pw}, timeout=20)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return s, email


# ---------------- /api/games/voice ----------------
class TestGamesVoice:
    def test_voice_ok_and_cached(self):
        # First call — may be cache-hit already (previous tests). Should return 200 audio/mpeg either way.
        url = f"{BASE_URL}/api/games/voice"
        r1 = requests.get(url, params={"text": "Ow!", "sex": "female"}, timeout=60)
        assert r1.status_code == 200, f"voice call failed: {r1.status_code} {r1.text[:200]}"
        assert r1.headers.get("content-type", "").startswith("audio/mpeg")
        assert len(r1.content) > 200, "audio bytes too small"
        # Second call — should be cache-hit (fast)
        t0 = time.time()
        r2 = requests.get(url, params={"text": "Ow!", "sex": "female"}, timeout=15)
        dt = time.time() - t0
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("audio/mpeg")
        # cache-hits should be < 3s (usually <500ms)
        assert dt < 5.0, f"second call too slow ({dt:.2f}s) — cache may not be working"

    def test_voice_rejects_html_injection(self):
        url = f"{BASE_URL}/api/games/voice"
        r = requests.get(url, params={"text": "<script>alert(1)</script>", "sex": "male"}, timeout=15)
        assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text}"


# ---------------- /api/paypal/config ----------------
class TestPaypalConfig:
    def test_upgrade_plans_include_api_pro_and_scale(self):
        r = requests.get(f"{BASE_URL}/api/paypal/config", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "upgrade_plans" in data, f"missing upgrade_plans: {list(data.keys())}"
        by_id = {p["id"]: p for p in data["upgrade_plans"]}
        assert "api-pro" in by_id, f"api-pro missing; ids={list(by_id.keys())}"
        assert "api-scale" in by_id, f"api-scale missing; ids={list(by_id.keys())}"
        assert by_id["api-pro"]["price"] == "12.50"
        assert by_id["api-scale"]["price"] == "50.00"


# ---------------- /api/keys auto-Free-Starter-Key ----------------
class TestAutoFreeStarterKey:
    def test_first_get_keys_creates_free_starter(self, new_user_client):
        s, email = new_user_client
        r = s.get(f"{BASE_URL}/api/keys", timeout=15)
        assert r.status_code == 200, f"GET /api/keys failed: {r.status_code} {r.text}"
        keys = r.json()
        assert isinstance(keys, list), f"expected list, got {type(keys)}"
        assert len(keys) == 1, f"expected exactly 1 auto-created key, got {len(keys)}: {keys}"
        k = keys[0]
        assert k.get("name") == "Free Starter Key", f"unexpected name: {k.get('name')}"
        assert k.get("credits") == 2500, f"expected 2500 credits, got {k.get('credits')}"

    def test_second_get_keys_no_duplicate(self, new_user_client):
        s, email = new_user_client
        r = s.get(f"{BASE_URL}/api/keys", timeout=15)
        assert r.status_code == 200
        keys = r.json()
        assert len(keys) == 1, f"duplicate key created! got {len(keys)} keys: {keys}"
        assert keys[0]["name"] == "Free Starter Key"


# ---------------- /api/admin/tenants/analytics ----------------
class TestAdminTenantAnalytics:
    def test_analytics_shape(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/api/admin/tenants/analytics", timeout=20)
        assert r.status_code == 200, f"analytics failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert "top" in data and "days" in data, f"missing keys: {list(data.keys())}"
        assert isinstance(data["top"], list)
        assert isinstance(data["days"], list)
        assert len(data["days"]) == 14, f"expected 14 days, got {len(data['days'])}"
        for row in data["top"]:
            assert "email" in row and "tokens" in row

    def test_tenant_detail_route_still_works(self, admin_client):
        # Grab list first, then fetch a real user detail — proves /analytics doesn't shadow /{user_id}
        tr = admin_client.get(f"{BASE_URL}/api/admin/tenants", timeout=20)
        assert tr.status_code == 200
        tenants = tr.json().get("tenants", [])
        assert tenants, "no tenants returned"
        uid = tenants[0]["id"]
        r = admin_client.get(f"{BASE_URL}/api/admin/tenants/{uid}", timeout=20)
        assert r.status_code == 200, f"tenant detail failed: {r.status_code} {r.text[:200]}"
        d = r.json()
        assert "tenant" in d and "keys" in d and "daily" in d


# ---------------- Games streets smoke ----------------
class TestStreetsSmoke:
    def test_streets_play_html_loads(self):
        r = requests.get(f"{BASE_URL}/api/games/streets/play", timeout=20)
        assert r.status_code == 200
        html = r.text
        assert "STREET VYBZ" in html.upper() or "street vybz" in html.lower(), "title missing"
        assert "HIT THE STREETS" in html.upper() or "hit the streets" in html.lower(), "start button missing"
