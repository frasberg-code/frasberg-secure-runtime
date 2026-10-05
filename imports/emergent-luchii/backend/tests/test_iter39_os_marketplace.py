"""Iter39 backend: FrasbergOS regions, scenario region_failover, marketplace trademarks, safety_band."""
import os
import time
import requests
import pytest
from pathlib import Path

def _load_env():
    envp = Path("/app/frontend/.env")
    for line in envp.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("REACT_APP_BACKEND_URL not set")

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_env()).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def doctester(s):
    r = s.post(f"{API}/auth/login", json={"email": "doctester1@frasberg.com", "password": "DocTester2026!"})
    assert r.status_code == 200, r.text
    return s


# --- FrasbergOS ---
class TestOS:
    def test_state_has_regions(self, s):
        r = s.get(f"{API}/os/state")
        assert r.status_code == 200
        j = r.json()
        assert "regions" in j
        regions = j["regions"]
        assert len(regions) == 4
        ids = {rg["id"] for rg in regions}
        assert ids == {"us-west", "us-east", "eu-central", "ap-south"}
        for rg in regions:
            for k in ("status", "load", "safety", "agents"):
                assert k in rg, f"missing {k} in {rg}"

    def test_scenario_region_failover(self, s):
        r = s.post(f"{API}/os/scenario", json={"name": "region_failover"})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["scenario"]["name"] == "region_failover"
        assert j["scenario"]["remaining"] >= 1
        regions = {rg["id"]: rg for rg in j["regions"]}
        assert regions["us-west"]["status"] == "degraded"
        assert regions["us-east"]["status"] == "failover"

    def test_reset(self, s):
        r = s.post(f"{API}/os/reset")
        assert r.status_code == 200
        assert r.json()["kernel"]["tick"] == 0


# --- Marketplace ---
class TestMarketplace:
    def test_list_has_safety_band(self, s):
        r = s.get(f"{API}/marketplace")
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 7
        for it in items:
            assert "safety_band" in it

    def test_deploy_trademark_hit(self, doctester):
        r = doctester.post(f"{API}/marketplace/deploy-from-github", json={"repo": "doctester/luchii-helper"})
        assert r.status_code == 400, r.text
        assert "luchii" in r.json()["detail"].lower()

    def test_publish_trademark_linq(self, doctester):
        r = doctester.post(f"{API}/marketplace/publish", json={
            "type": "agent", "name": "linq-super-agent",
            "description": "Test agent for trademark linq check.",
            "version": "1.0.0"})
        assert r.status_code == 400, r.text
        assert "linq" in r.json()["detail"].lower()

    def test_deploy_ok_for_summarizer(self, doctester):
        r = doctester.post(f"{API}/marketplace/deploy-from-github", json={"repo": "doctester/summarizer-bot"})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["ok"] is True
        assert "name" in j
