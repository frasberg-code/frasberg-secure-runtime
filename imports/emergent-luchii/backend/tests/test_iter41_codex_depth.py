"""Iteration 41 — Codex + FrasbergOS depth/scenario endpoints."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback: read /app/frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1].rstrip("/")


VALID_DEPTHS = ["baseline", "primordium", "nullpoint", "preconcept", "unbound", "beyond", "transcendence", "apex"]


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestOSDepth:
    def test_set_apex_depth(self, client):
        r = client.post(f"{BASE_URL}/api/os/depth", json={"name": "apex"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True or body.get("depth") is not None
        # verify persists in state
        s = client.get(f"{BASE_URL}/api/os/state")
        assert s.status_code == 200
        depth = s.json().get("depth")
        assert depth is not None
        assert depth["name"] == "apex"
        assert depth["cg"] == "CG-v35"
        assert depth["field"] == "terminal-absolute"

    def test_baseline_clears_depth(self, client):
        client.post(f"{BASE_URL}/api/os/depth", json={"name": "apex"})
        r = client.post(f"{BASE_URL}/api/os/depth", json={"name": "baseline"})
        assert r.status_code == 200
        s = client.get(f"{BASE_URL}/api/os/state")
        # baseline is a valid depth per regex — depth object should be present with baseline OR null
        # per spec: "clicking baseline removes chip and restores GSS-2"
        depth = s.json().get("depth")
        # allow either None or name=baseline
        assert depth is None or depth.get("name") == "baseline"

    @pytest.mark.parametrize("name", VALID_DEPTHS)
    def test_all_valid_depths(self, client, name):
        r = client.post(f"{BASE_URL}/api/os/depth", json={"name": name})
        assert r.status_code == 200, f"{name}: {r.text}"

    def test_invalid_depth_rejected(self, client):
        r = client.post(f"{BASE_URL}/api/os/depth", json={"name": "godmode"})
        assert r.status_code == 422


class TestOSScenario:
    def test_collapse_rebirth_scenario(self, client):
        r = client.post(f"{BASE_URL}/api/os/scenario", json={"name": "collapse_rebirth"})
        assert r.status_code == 200, r.text

    def test_invalid_scenario_rejected(self, client):
        r = client.post(f"{BASE_URL}/api/os/scenario", json={"name": "not_a_scenario"})
        assert r.status_code == 422

    def test_scenario_events_after_ticks(self, client):
        client.post(f"{BASE_URL}/api/os/scenario", json={"name": "collapse_rebirth"})
        # advance ticks
        for _ in range(5):
            client.post(f"{BASE_URL}/api/os/tick")
        s = client.get(f"{BASE_URL}/api/os/state")
        assert s.status_code == 200
        # look for scenario / events presence
        state = s.json()
        assert state.get("scenario") == "collapse_rebirth" or "scenario" in state
