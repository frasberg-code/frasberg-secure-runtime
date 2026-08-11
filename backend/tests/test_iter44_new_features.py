"""Iteration 44 backend tests — Agent Ascension + Ops Cycle Feed.

Covers:
- GET /api/marketplace/{id} can_ascend visibility (anon vs admin) + no owner_id leak
- POST /api/marketplace/{id}/ascend — 401 anon, 403 non-owner regular, 200 admin bumps tier one step
- Terminal tier CG-v35 returns 400 "Already at CG-v35 Apex"
- POST /api/os/tick returns eternal_cycle/cycle_loops/cycle_trace
- POST /api/os/eternal-cycle toggles and populates trace
"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"
USER_EMAIL = "doctester1@frasberg.com"
USER_PASSWORD = "DocTester2026!"


def _login(session, email, password):
    r = session.post(f"{API}/auth/login", json={"email": email, "password": password})
    return r


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text[:200]}")
    return s


@pytest.fixture(scope="module")
def user():
    s = requests.Session()
    r = _login(s, USER_EMAIL, USER_PASSWORD)
    if r.status_code != 200:
        # try register
        s.post(f"{API}/auth/register", json={"email": USER_EMAIL, "password": USER_PASSWORD, "name": "DocTester"})
        r = _login(s, USER_EMAIL, USER_PASSWORD)
        if r.status_code != 200:
            pytest.skip(f"user login failed: {r.status_code}")
    return s


@pytest.fixture(scope="module")
def seeded_agent_id(anon):
    r = anon.get(f"{API}/marketplace")
    assert r.status_code == 200
    items = r.json()["items"]
    # pick a non-terminal official agent — Luchii Builder is CG-v27
    for it in items:
        if it["name"] == "Luchii Builder":
            return it["id"]
    pytest.skip("Luchii Builder not seeded")


@pytest.fixture(scope="module")
def apex_item_id(anon):
    r = anon.get(f"{API}/marketplace")
    items = r.json()["items"]
    for it in items:
        if it.get("codex_tier") == "CG-v35":
            return it["id"]
    pytest.skip("no CG-v35 item found")


class TestMarketplaceAscendVisibility:
    def test_anon_get_no_can_ascend_no_owner_id(self, anon, seeded_agent_id):
        r = anon.get(f"{API}/marketplace/{seeded_agent_id}")
        assert r.status_code == 200
        data = r.json()
        assert data.get("can_ascend") is False
        assert "owner_id" not in data, f"owner_id leaked in response: {data.keys()}"

    def test_admin_get_can_ascend_true(self, admin, seeded_agent_id):
        r = admin.get(f"{API}/marketplace/{seeded_agent_id}")
        assert r.status_code == 200
        data = r.json()
        assert data.get("can_ascend") is True
        assert "owner_id" not in data


class TestMarketplaceAscendEndpoint:
    def test_ascend_anonymous_401(self, anon, seeded_agent_id):
        r = anon.post(f"{API}/marketplace/{seeded_agent_id}/ascend")
        assert r.status_code == 401, f"got {r.status_code}: {r.text[:200]}"

    def test_ascend_non_owner_regular_user_403(self, user, seeded_agent_id):
        r = user.post(f"{API}/marketplace/{seeded_agent_id}/ascend")
        assert r.status_code == 403, f"got {r.status_code}: {r.text[:200]}"

    def test_ascend_apex_item_returns_400(self, admin, apex_item_id):
        r = admin.post(f"{API}/marketplace/{apex_item_id}/ascend")
        assert r.status_code == 400
        assert "CG-v35" in r.text or "Apex" in r.text

    def test_admin_ascend_fresh_test_agent_bumps_tier(self, admin, anon):
        # publish a throwaway agent (CG-v21), ascend it, verify → CG-v22
        name = f"TEST_iter44_ascend_{uuid.uuid4().hex[:8]}"
        pub = admin.post(f"{API}/marketplace/publish", json={
            "type": "agent", "name": name,
            "description": "iter44 throwaway ascension test",
            "version": "1.0.0",
        })
        assert pub.status_code == 200, pub.text
        item = pub.json()
        item_id = item["id"]
        assert item["codex_tier"] == "CG-v21"

        # ascend once
        r = admin.post(f"{API}/marketplace/{item_id}/ascend")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["from_tier"] == "CG-v21"
        assert data["to_tier"] == "CG-v22"
        assert data["layer"] == "Spirit"
        assert isinstance(data["safety_score"], int)

        # verify via GET
        get = admin.get(f"{API}/marketplace/{item_id}")
        assert get.status_code == 200
        got = get.json()
        assert got["codex_tier"] == "CG-v22"
        # history entry pushed
        hist = got.get("history", [])
        assert any("Ascension ceremony" in (h.get("note") or "") for h in hist), f"no ascension history entry"


class TestOsCycleFeed:
    def test_tick_returns_cycle_fields(self, anon):
        # reset first
        anon.post(f"{API}/os/reset")
        r = anon.post(f"{API}/os/tick")
        assert r.status_code == 200
        data = r.json()
        assert "eternal_cycle" in data and isinstance(data["eternal_cycle"], bool)
        assert "cycle_loops" in data and isinstance(data["cycle_loops"], int)
        assert "cycle_trace" in data and isinstance(data["cycle_trace"], list)

    def test_engage_cycle_populates_trace(self, anon):
        r = anon.post(f"{API}/os/eternal-cycle", json={"enabled": True})
        assert r.status_code == 200
        assert r.json()["eternal_cycle"] is True
        # tick a few times
        for _ in range(5):
            anon.post(f"{API}/os/tick")
        st = anon.get(f"{API}/os/state").json()
        trace = st["cycle_trace"]
        assert len(trace) >= 3, f"expected trace populated, got {len(trace)}"
        for pt in trace:
            assert set(["tick", "phase", "load", "loop"]).issubset(pt.keys())
            assert pt["phase"] in ("collapse", "destruction", "rebirth")

    def test_disable_cycle(self, anon):
        r = anon.post(f"{API}/os/eternal-cycle", json={"enabled": False})
        assert r.status_code == 200
        assert r.json()["eternal_cycle"] is False


class TestZzzCleanup:
    def test_reset_os(self, anon):
        anon.post(f"{API}/os/eternal-cycle", json={"enabled": False})
        r = anon.post(f"{API}/os/reset")
        assert r.status_code == 200
