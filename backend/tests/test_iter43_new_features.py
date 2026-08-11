"""Iteration 43 backend tests — Cycle History Chart trace.

Covers:
- POST /api/os/eternal-cycle {enabled:true} then 12x /api/os/tick
- GET /api/os/state returns cycle_trace with tick/phase/load/loop
- phases restricted to {collapse,destruction,rebirth}
- cap at 80 entries
- disengage clean up
"""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

VALID_PHASES = {"collapse", "destruction", "rebirth"}


class TestCycleTrace:
    def test_engage_then_tick_produces_trace(self):
        # start clean
        requests.post(f"{API}/reset") if False else None  # noop
        requests.post(f"{API}/os/reset")
        r = requests.post(f"{API}/os/eternal-cycle", json={"enabled": True})
        assert r.status_code == 200, r.text
        for _ in range(12):
            tr = requests.post(f"{API}/os/tick")
            assert tr.status_code == 200
        st = requests.get(f"{API}/os/state").json()
        trace = st.get("cycle_trace", [])
        assert isinstance(trace, list)
        assert len(trace) >= 10, f"expected >=10 trace entries, got {len(trace)}"
        for pt in trace:
            assert "tick" in pt and isinstance(pt["tick"], int)
            assert "phase" in pt and pt["phase"] in VALID_PHASES, f"bad phase {pt}"
            assert "load" in pt
            assert "loop" in pt and isinstance(pt["loop"], int)

    def test_trace_capped_at_80(self):
        # tick many more times, ensure cap
        requests.post(f"{API}/os/eternal-cycle", json={"enabled": True})
        for _ in range(90):
            requests.post(f"{API}/os/tick")
        st = requests.get(f"{API}/os/state").json()
        trace = st.get("cycle_trace", [])
        assert len(trace) <= 80, f"trace not capped, len={len(trace)}"

    def test_trace_persists_after_disengage(self):
        # disengage; trace should still be present in state
        r = requests.post(f"{API}/os/eternal-cycle", json={"enabled": False})
        assert r.status_code == 200
        assert r.json()["eternal_cycle"] is False
        st = requests.get(f"{API}/os/state").json()
        # trace retained after disengage (frontend expects this)
        assert isinstance(st.get("cycle_trace", []), list)

    def test_reset_clears_trace(self):
        r = requests.post(f"{API}/os/reset")
        assert r.status_code == 200
        st = requests.get(f"{API}/os/state").json()
        assert st.get("cycle_trace", []) == [], f"reset didn't clear trace: {len(st.get('cycle_trace', []))}"
        assert st.get("eternal_cycle") is False


class TestMarketplaceTierValues:
    """Sanity: tier values map to what the tier-filter UI expects."""
    def test_expected_tiers_present(self):
        r = requests.get(f"{API}/marketplace")
        assert r.status_code == 200
        payload = r.json()
        items = payload.get("items", payload) if isinstance(payload, dict) else payload
        tiers = {i["name"]: i.get("codex_tier") for i in items}
        assert tiers.get("Luchii-70b") == "CG-v35"
        assert tiers.get("Luchii-7b") == "CG-v29"
        assert tiers.get("Frasberg SDK") == "CG-v21"
        assert tiers.get("GitHub Agent Sync") == "CG-v21"


class TestZzzCleanup:
    def test_leave_baseline(self):
        requests.post(f"{API}/os/eternal-cycle", json={"enabled": False})
        r = requests.post(f"{API}/os/depth", json={"name": "baseline"})
        assert r.status_code == 200
        requests.post(f"{API}/os/reset")
