"""Iteration 42 backend tests — Eternal Cycle, Codex Depth Sync, Codex Tiers."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"


# --- Eternal Cycle backend ---
class TestEternalCycle:
    def test_engage(self):
        r = requests.post(f"{API}/os/eternal-cycle", json={"enabled": True})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["eternal_cycle"] is True
        assert data["scenario"] and data["scenario"]["name"] == "collapse_rebirth"

    def test_loops_after_ticks(self):
        # ensure engaged
        requests.post(f"{API}/os/eternal-cycle", json={"enabled": True})
        last = None
        for _ in range(12):
            r = requests.post(f"{API}/os/tick")
            assert r.status_code == 200
            last = r.json()
        assert last["eternal_cycle"] is True
        assert last.get("cycle_loops", 0) >= 1, f"cycle_loops={last.get('cycle_loops')}"
        assert last["scenario"] and last["scenario"]["name"] == "collapse_rebirth"
        # events include 'eternal-cycle: loop'
        joined = " ".join(e.get("text", "") for e in last.get("events", []))
        assert "eternal-cycle: loop" in joined

    def test_disengage(self):
        r = requests.post(f"{API}/os/eternal-cycle", json={"enabled": False})
        assert r.status_code == 200
        data = r.json()
        assert data["eternal_cycle"] is False

    def test_invalid_body(self):
        r = requests.post(f"{API}/os/eternal-cycle", json={"foo": "bar"})
        assert r.status_code == 422


# --- Marketplace codex tiers ---
EXPECTED_TIERS = {
    "Luchii Builder": "CG-v27",
    "Luchii Realtime": "CG-v24",
    "Zion Support": "CG-v22",
    "Luchii-70b": "CG-v35",
    "Luchii-7b": "CG-v29",
    "Frasberg SDK": "CG-v21",
    "GitHub Agent Sync": "CG-v21",
}


class TestMarketplaceCodexTiers:
    def test_all_seed_items_have_expected_tier(self):
        r = requests.get(f"{API}/marketplace")
        assert r.status_code == 200
        items = r.json().get("items", r.json()) if isinstance(r.json(), dict) else r.json()
        # response could be list or {"items": [...]}
        by_name = {i["name"]: i for i in items}
        for name, tier in EXPECTED_TIERS.items():
            assert name in by_name, f"missing {name}"
            assert by_name[name].get("codex_tier") == tier, f"{name}: got {by_name[name].get('codex_tier')} expected {tier}"

    def test_publish_assigns_default_tier(self):
        # login as doctester1
        s = requests.Session()
        lr = s.post(f"{API}/auth/login", json={"email": "doctester1@frasberg.com", "password": "DocTester2026!"})
        assert lr.status_code == 200, lr.text
        import uuid
        pub = s.post(f"{API}/marketplace/publish", json={
            "name": f"TEST_iter42_{uuid.uuid4().hex[:8]}",
            "description": "test publish for codex tier check",
            "type": "agent",
        })
        assert pub.status_code in (200, 201), pub.text
        data = pub.json()
        assert data.get("codex_tier") == "CG-v21"


# --- Codex Depth Sync backend (depth already covered iter41, sanity check) ---
class TestDepthSanity:
    def test_set_primordium(self):
        r = requests.post(f"{API}/os/depth", json={"name": "primordium"})
        assert r.status_code == 200
        d = r.json()["depth"]
        assert d["name"] == "primordium"
        assert d["cg"] == "CG-v29"


# --- Cleanup / baseline reset ---
class TestCleanup:
    def test_zzz_disengage_and_baseline(self):
        requests.post(f"{API}/os/eternal-cycle", json={"enabled": False})
        r = requests.post(f"{API}/os/depth", json={"name": "baseline"})
        assert r.status_code == 200
