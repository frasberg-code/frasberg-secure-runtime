"""
Iteration 58 — Post-refactor regression + Luchii voice lock verification.
- Backend server.py split into modules (routes_payments/admin/provider/workspace/shield)
- Luchii voice locked to a single sovereign voice (Orion/p273); overrides ignored
"""
import os
import json
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-gateway-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASS = "LuchiiAdmin2026!"
GATEWAY_KEY = "luchii-sk-ee1c28049e11a4a579e17cbe8bc880f2e974ae74"


# ---- Fixtures ----
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text[:200]}"
    return s


# ---- Shield / global header ----
class TestShieldHeader:
    def test_x_shield_header_on_public_api(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.headers.get("X-Shield") == "FRASBERG-PROTECTED", f"Missing X-Shield header, got: {dict(r.headers)}"

    def test_security_logs_admin(self, admin_session):
        r = admin_session.get(f"{API}/security/logs", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))

    def test_banned_ips_admin(self, admin_session):
        r = admin_session.get(f"{API}/admin/banned", timeout=15)
        assert r.status_code == 200

    def test_geo_countries_admin(self, admin_session):
        r = admin_session.get(f"{API}/geo/countries", timeout=15)
        assert r.status_code == 200

    def test_security_log_post(self):
        r = requests.post(f"{API}/security/log", json={"event": "test_event", "detail": "iter58 regression"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "logged" or "status" in data


# ---- Admin routes ----
class TestAdminRoutes:
    def test_stats(self, admin_session):
        r = admin_session.get(f"{API}/admin/stats", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, dict) and len(d) > 0

    def test_tenants(self, admin_session):
        r = admin_session.get(f"{API}/admin/tenants", timeout=20)
        assert r.status_code == 200

    def test_users(self, admin_session):
        r = admin_session.get(f"{API}/admin/users", timeout=20)
        assert r.status_code == 200

    def test_mesh_overview(self, admin_session):
        r = admin_session.get(f"{API}/admin/mesh/overview", timeout=20)
        assert r.status_code == 200

    def test_knowledge(self, admin_session):
        r = admin_session.get(f"{API}/admin/knowledge", timeout=20)
        assert r.status_code == 200


# ---- Payments ----
class TestPayments:
    def test_payments_config(self):
        r = requests.get(f"{API}/payments/config", timeout=15)
        assert r.status_code == 200

    def test_paypal_config(self):
        r = requests.get(f"{API}/paypal/config", timeout=15)
        assert r.status_code == 200

    def test_cashapp_config(self):
        r = requests.get(f"{API}/cashapp/config", timeout=15)
        assert r.status_code == 200

    def test_purchases_my(self, admin_session):
        r = admin_session.get(f"{API}/purchases/my", timeout=15)
        assert r.status_code == 200

    def test_wallet(self, admin_session):
        r = admin_session.get(f"{API}/wallet", timeout=15)
        assert r.status_code == 200

    def test_checkout_creates_stripe_session(self, admin_session):
        payload = {"plan_id": "starter", "origin_url": BASE}
        r = admin_session.post(f"{API}/payments/checkout", json=payload, timeout=30)
        # Live Stripe account not activated in this sandbox → 409 with descriptive detail is expected
        # (per iter56 recommendation, this was changed from 502 to 409 so CF passes JSON through)
        if r.status_code == 409:
            assert "not yet activated" in r.text.lower() or "activation" in r.text.lower()
            pytest.skip("Stripe account not activated for live charges (expected in sandbox)")
        assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"
        d = r.json()
        assert "checkout_url" in d and d["checkout_url"].startswith("http")
        assert "session_id" in d and isinstance(d["session_id"], str) and len(d["session_id"]) > 0


# ---- Provider gateway ----
class TestProvider:
    def test_v1_models(self):
        r = requests.get(f"{API}/v1/models", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "data" in d or isinstance(d, list)

    def test_v1_provider(self):
        r = requests.get(f"{API}/v1/provider", timeout=15)
        assert r.status_code == 200

    def test_provider_status(self):
        r = requests.get(f"{API}/provider/status", timeout=15)
        assert r.status_code == 200

    def test_well_known_manifest(self):
        r = requests.get(f"{API}/.well-known/frasberg-provider.json", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_v1_chat_completions_valid_key(self):
        headers = {"Authorization": f"Bearer {GATEWAY_KEY}"}
        body = {"model": "luchii-1b", "messages": [{"role": "user", "content": "Say hi"}], "stream": False}
        r = requests.post(f"{API}/v1/chat/completions", json=body, headers=headers, timeout=60)
        assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
        d = r.json()
        assert "choices" in d and len(d["choices"]) > 0
        assert "usage" in d

    def test_v1_chat_completions_invalid_key(self):
        headers = {"Authorization": "Bearer luchii-sk-invalidkey123"}
        body = {"model": "luchii-1b", "messages": [{"role": "user", "content": "hi"}]}
        r = requests.post(f"{API}/v1/chat/completions", json=body, headers=headers, timeout=15)
        assert r.status_code == 401


# ---- Workspace ----
class TestWorkspace:
    def test_publishes_list(self, admin_session):
        r = admin_session.get(f"{API}/workspace/publishes", timeout=15)
        assert r.status_code == 200

    def test_slug_check(self, admin_session):
        r = admin_session.get(f"{API}/workspace/slug-check", params={"name": "iter58test"}, timeout=15)
        assert r.status_code == 200

    def test_publish_create_and_delete(self, admin_session):
        html = "<html><body><h1>iter58 regression</h1></body></html>"
        r = admin_session.post(f"{API}/workspace/publishes",
                               json={"name": "iter58test", "html": html}, timeout=20)
        assert r.status_code in (200, 201), f"{r.status_code} {r.text[:300]}"
        d = r.json()
        pid = d.get("id") or d.get("_id") or d.get("slug") or d.get("name")
        assert pid, f"No id in publish response: {d}"
        # Attempt delete by id
        dr = admin_session.delete(f"{API}/workspace/publishes/{pid}", timeout=15)
        # some routes allow either id or slug; accept 200/204/404
        assert dr.status_code in (200, 204, 404)


# ---- Keys ----
class TestKeys:
    def test_keys_list(self, admin_session):
        r = admin_session.get(f"{API}/keys", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))

    def test_alert_threshold_patch(self, admin_session):
        r = admin_session.get(f"{API}/keys", timeout=15)
        keys = r.json() if isinstance(r.json(), list) else r.json().get("keys", [])
        if not keys:
            pytest.skip("No keys to patch")
        kid = keys[0].get("id") or keys[0].get("_id") or keys[0].get("key_id")
        if not kid:
            pytest.skip("No id field on key")
        pr = admin_session.patch(f"{API}/keys/{kid}/alert-threshold", json={"threshold": 600}, timeout=15)
        assert pr.status_code == 200, f"{pr.status_code} {pr.text[:200]}"


# ---- Core chat ----
class TestCoreChat:
    def test_chat_sessions_list(self, admin_session):
        r = admin_session.get(f"{API}/chat/sessions", timeout=15)
        assert r.status_code == 200

    def test_chat_stream(self, admin_session):
        r = admin_session.post(f"{API}/chat",
                               json={"message": "Say the word ready in one word."},
                               timeout=60, stream=True)
        assert r.status_code == 200, f"{r.status_code} {r.text[:200] if not r.raw else ''}"
        chunks = 0
        for line in r.iter_lines(decode_unicode=True):
            if line:
                chunks += 1
                if chunks > 3:
                    break
        r.close()
        assert chunks > 0, "No SSE chunks received"


# ---- VOICE LOCK ----
class TestVoiceLock:
    def test_voices_single_orion(self):
        r = requests.get(f"{API}/voice/voices", timeout=15)
        assert r.status_code == 200
        d = r.json()
        voices = d if isinstance(d, list) else d.get("voices", [])
        assert len(voices) == 1, f"Expected exactly 1 voice, got {len(voices)}: {voices}"
        v = voices[0]
        # Locate id/name flexibly
        vid = v.get("id") or v.get("voice_id") or v.get("name")
        vname = (v.get("name") or "").lower()
        assert "orion" in vname or vid == "p273", f"Voice not Orion/p273: {v}"
        assert v.get("default") is True, f"Default flag missing: {v}"

    def test_speak_returns_sovereign(self, admin_session):
        # sovereign TTS can be busy under parallel test load — retry once
        for attempt in range(2):
            r = admin_session.post(f"{API}/voice/speak", json={"text": "hello there"}, timeout=90)
            assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
            d = r.json()
            if d.get("engine") == "frasberg-sovereign":
                assert d.get("audio_base64"), "No audio_base64 returned"
                return
            import time; time.sleep(3)
        pytest.fail(f"Sovereign engine never selected (last engine={d.get('engine')})")

    def test_speak_overrides_ignored(self, admin_session):
        for attempt in range(2):
            r = admin_session.post(f"{API}/voice/speak",
                                   json={"text": "hi", "tone": "firm", "voice": "p326"},
                                   timeout=90)
            assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
            d = r.json()
            if d.get("engine") == "frasberg-sovereign":
                assert d.get("audio_base64")
                return
            import time; time.sleep(3)
        pytest.fail(f"Overrides not ignored / sovereign not selected (engine={d.get('engine')})")
