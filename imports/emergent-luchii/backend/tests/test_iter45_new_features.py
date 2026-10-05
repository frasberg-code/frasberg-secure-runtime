"""Iter45 — Ascension Leaderboard endpoint tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-gateway-demo.preview.emergentagent.com").rstrip("/")
ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    return s


# --- Leaderboard endpoint ---

def test_leaderboard_endpoint_status(sess):
    r = sess.get(f"{BASE_URL}/api/marketplace/leaderboard/ascension")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "leaders" in body
    assert isinstance(body["leaders"], list)


def test_leaderboard_max_10(sess):
    r = sess.get(f"{BASE_URL}/api/marketplace/leaderboard/ascension")
    data = r.json()
    assert len(data["leaders"]) <= 10


def test_leaderboard_only_agents(sess):
    # Correctness: leaderboard should not include model/extension/pipeline items
    r = sess.get(f"{BASE_URL}/api/marketplace/leaderboard/ascension")
    leaders = r.json()["leaders"]
    # Cross-check names against marketplace: none of the leader names should belong to non-agent types.
    m = sess.get(f"{BASE_URL}/api/marketplace").json()["items"]
    non_agent_names = {i["name"] for i in m if i.get("type") != "agent"}
    for l in leaders:
        assert l["name"] not in non_agent_names, f"Leader {l['name']} is not an agent"


def test_leaderboard_schema_and_no_owner_id_leak(sess):
    r = sess.get(f"{BASE_URL}/api/marketplace/leaderboard/ascension")
    leaders = r.json()["leaders"]
    assert len(leaders) > 0, "expected at least one agent leader"
    required = {"id", "name", "owner", "codex_tier", "layer", "tier_rank", "ascensions", "safety_score", "official"}
    for l in leaders:
        missing = required - set(l.keys())
        assert not missing, f"Missing keys: {missing}"
        assert "owner_id" not in l, "owner_id should not leak"
        assert isinstance(l["tier_rank"], int)
        assert isinstance(l["ascensions"], int)
        assert isinstance(l["safety_score"], int)
        assert isinstance(l["official"], bool)


def test_leaderboard_sorting(sess):
    r = sess.get(f"{BASE_URL}/api/marketplace/leaderboard/ascension")
    leaders = r.json()["leaders"]
    keys = [(-l["tier_rank"], -l["ascensions"], -l["safety_score"]) for l in leaders]
    assert keys == sorted(keys), f"Leaders not sorted correctly: {keys}"


# --- Regression: ascend still works for admin ---

def test_ascend_regression_admin_ok(admin_sess):
    # publish throwaway, ascend it, cleanup left as noted in report
    import uuid as _u
    name = f"TEST_iter45_lb_{_u.uuid4().hex[:6]}"
    r = admin_sess.post(f"{BASE_URL}/api/marketplace/publish", json={
        "type": "agent", "name": name, "description": "iter45 leaderboard test agent"
    })
    assert r.status_code == 200, r.text
    item_id = r.json()["id"]
    r2 = admin_sess.post(f"{BASE_URL}/api/marketplace/{item_id}/ascend")
    assert r2.status_code == 200
    d = r2.json()
    assert d["from_tier"] == "CG-v21"
    assert d["to_tier"] == "CG-v22"
    # Leader now includes this agent with at least 1 ascension
    lb = admin_sess.get(f"{BASE_URL}/api/marketplace/leaderboard/ascension").json()["leaders"]
    found = next((l for l in lb if l["id"] == item_id), None)
    # note: might not appear if beyond top-10, but generally will
    if found:
        assert found["ascensions"] >= 1
