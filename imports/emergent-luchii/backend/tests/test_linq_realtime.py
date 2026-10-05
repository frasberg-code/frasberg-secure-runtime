"""Tests for LINQ Command Center + Realtime Core (LiveKit, rooms, luchii, governance)."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend env
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


# ============ LiveKit token ============
class TestLivekit:
    def test_token_host(self, api):
        r = api.post(f"{BASE_URL}/api/livekit/token",
                     json={"identity": "TEST_host", "room": "TEST_lk", "role": "host"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["token"].startswith("eyJ"), f"expected real JWT, got {d['token'][:20]}"
        assert d["host"].startswith("wss://")
        assert d["expiresIn"] == 900

    def test_token_viewer(self, api):
        r = api.post(f"{BASE_URL}/api/livekit/token",
                     json={"identity": "TEST_viewer", "room": "TEST_lk", "role": "viewer"})
        assert r.status_code == 200
        assert r.json()["token"].startswith("eyJ")

    def test_token_invalid_role(self, api):
        r = api.post(f"{BASE_URL}/api/livekit/token",
                     json={"identity": "x", "room": "y", "role": "spectator"})
        assert r.status_code == 400


# ============ Room lifecycle ============
class TestRooms:
    def test_mark_live(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/rooms/live",
                     json={"roomId": room_id, "hostId": "TEST_host"})
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_list_live(self, api, room_id):
        r = api.get(f"{BASE_URL}/api/rooms/live")
        assert r.status_code == 200
        rooms = r.json()
        assert any(x["roomId"] == room_id for x in rooms)

    def test_get_room(self, api, room_id):
        r = api.get(f"{BASE_URL}/api/rooms/{room_id}")
        assert r.status_code == 200
        d = r.json()
        assert d["roomId"] == room_id
        assert d["status"] == "live"
        assert "_id" not in d

    def test_events_viewer_joined_increments(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/rooms/events",
                     json={"roomId": room_id, "type": "viewer_joined",
                           "identity": "TEST_viewer1", "payload": {}})
        assert r.status_code == 200
        r2 = api.get(f"{BASE_URL}/api/rooms/{room_id}")
        assert r2.json().get("viewerCount", 0) >= 1

    def test_summary(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/rooms/summary",
                     json={"roomId": room_id, "hostId": "TEST_host",
                           "summary": {"headline": "test", "highlights": []}})
        assert r.status_code == 200

    def test_tip_requires_fields(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/rooms/tip", json={"roomId": room_id})
        assert r.status_code == 400
        r2 = api.post(f"{BASE_URL}/api/rooms/tip",
                      json={"roomId": room_id, "from": "TEST_u", "amount": 5.0})
        assert r2.status_code == 200

    def test_lead(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/leads",
                     json={"roomId": room_id, "viewerId": "TEST_v",
                           "hostId": "TEST_h", "intent": "private_session",
                           "contact": "test@x.com"})
        assert r.status_code == 200
        assert "id" in r.json()

    def test_end(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/rooms/end", json={"roomId": room_id})
        assert r.status_code == 200
        r2 = api.get(f"{BASE_URL}/api/rooms/{room_id}")
        assert r2.json()["status"] == "ended"


# ============ Luchii AI agent ============
class TestLuchii:
    def test_viewer_question(self, api, room_id):
        r = api.post(f"{BASE_URL}/api/agents/luchii/actions",
                     json={"roomId": room_id, "action": "viewer_question",
                           "from": "TEST_viewer",
                           "details": {"text": "What is Frasberg LINQ platform?"}},
                     timeout=45)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert isinstance(d.get("reply"), str) and len(d["reply"]) > 0
        # sanity: not the .NET language
        assert ".net" not in d["reply"].lower() or "frasberg" in d["reply"].lower()

    def test_missing_fields(self, api):
        r = api.post(f"{BASE_URL}/api/agents/luchii/actions", json={"roomId": "x"})
        assert r.status_code == 400


# ============ Preview state ============
class TestPreview:
    def test_state_no_objectid(self, api):
        r = api.get(f"{BASE_URL}/api/preview/state")
        assert r.status_code == 200
        d = r.json()
        for key in ("rooms", "events", "summaries", "agentActions"):
            assert key in d
            for item in d[key]:
                assert "_id" not in item


# ============ LINQ governance (auth required) ============
class TestLinqAuth:
    def test_layers_unauth(self, api):
        # fresh session without cookies
        s = requests.Session()
        r = s.get(f"{BASE_URL}/api/linq/layers")
        assert r.status_code == 401


class TestLinqGovernance:
    def test_layers(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/linq/layers")
        assert r.status_code == 200, r.text
        layers = r.json()
        assert len(layers) == 45
        assert layers[0]["roman"] == "I"
        assert layers[44]["roman"] == "XLV"
        assert layers[0]["tier"] == "foundation"
        assert layers[20]["tier"] == "ascension"

    def test_overview(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/linq/overview")
        assert r.status_code == 200
        d = r.json()
        assert d["totalLayers"] == 45
        assert "artifacts" in d and "engineRuns" in d

    def test_run_layer_and_artifacts(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/linq/overview")
        before = r.json()["artifacts"]
        # run layer 1
        r2 = auth_session.post(f"{BASE_URL}/api/linq/layers/1/run", timeout=60)
        assert r2.status_code == 200, r2.text
        art = r2.json()
        assert "tag" in art and "narrative" in art and "transformations" in art
        assert len(art["narrative"]) > 10
        # artifacts list
        r3 = auth_session.get(f"{BASE_URL}/api/linq/layers/1/artifacts")
        assert r3.status_code == 200
        assert len(r3.json()) >= 1
        # count incremented
        r4 = auth_session.get(f"{BASE_URL}/api/linq/overview")
        assert r4.json()["artifacts"] > before

    def test_run_threat_engine(self, auth_session):
        r = auth_session.post(f"{BASE_URL}/api/linq/engines/threat/run", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("tag", "narrative", "cognition", "score", "recommendations", "stats"):
            assert k in d
        assert isinstance(d["recommendations"], list) and len(d["recommendations"]) >= 1

    def test_run_compliance_engine(self, auth_session):
        r = auth_session.post(f"{BASE_URL}/api/linq/engines/compliance/run", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "score" in d and "recommendations" in d

    def test_engine_history_billing(self, auth_session):
        r = auth_session.get(f"{BASE_URL}/api/linq/engines/billing")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
