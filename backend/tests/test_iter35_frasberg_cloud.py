"""Iteration 35: Frasberg Cloud multiverse endpoints + regression."""
import os
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if "REACT_APP_BACKEND_URL" in os.environ else None
if not BASE_URL:
    # fallback: read from frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

CLOUD = f"{BASE_URL}/api/cloud"
created_ids = []


@pytest.fixture(scope="module")
def s():
    return requests.Session()


def _mk(s, name):
    r = s.post(f"{CLOUD}/universes", json={"name": name, "physicsModel": "standard", "terrainType": "mixed",
                                            "climateProfile": "temperate", "agentCount": 20})
    assert r.status_code == 200, r.text
    d = r.json()
    created_ids.append(d["id"])
    return d


# --- Genesis ---
def test_genesis_creates_universe(s):
    d = _mk(s, "TEST_Alpha")
    for k in ["id", "name", "phase", "entropy", "agents", "stability"]:
        assert k in d, f"missing {k}"
    assert d["name"] == "TEST_Alpha"
    assert d["phase"] == "genesis"
    assert d["agents"] >= 4


def test_genesis_physics_models(s):
    for pm in ["exotic", "quantum", "chaotic"]:
        r = s.post(f"{CLOUD}/universes", json={"name": f"TEST_{pm}", "physicsModel": pm, "agentCount": 10})
        assert r.status_code == 200
        d = r.json()
        created_ids.append(d["id"])
        assert d["physicsModel"] == pm


# --- Tick ---
def test_tick_advances(s):
    d = _mk(s, "TEST_Tick")
    r = s.post(f"{CLOUD}/universes/{d['id']}/tick", json={"steps": 10})
    assert r.status_code == 200
    js = r.json()
    assert js["summary"]["tick"] >= 10
    assert isinstance(js["events"], list)


def test_universe_detail(s):
    d = _mk(s, "TEST_Detail")
    s.post(f"{CLOUD}/universes/{d['id']}/tick", json={"steps": 5})
    r = s.get(f"{CLOUD}/universes/{d['id']}")
    assert r.status_code == 200
    js = r.json()
    for k in ["summary", "agents", "civilizations", "myths", "metrics", "events"]:
        assert k in js
    if js["agents"]:
        a = js["agents"][0]
        assert "reputation" in a
        assert "alignment" in a["soul"]
        assert "tier" in a["ascension"]
    assert isinstance(js["metrics"], list)


# --- Migrate / Trade ---
def test_migrate(s):
    a = _mk(s, "TEST_MigSrc")
    b = _mk(s, "TEST_MigDst")
    r = s.post(f"{CLOUD}/migrate", json={"source": a["id"], "target": b["id"], "count": 5})
    assert r.status_code == 200, r.text
    js = r.json()
    assert js["migrated"] >= 1


def test_trade_valid(s):
    a = _mk(s, "TEST_TradeSrc")
    b = _mk(s, "TEST_TradeDst")
    r = s.post(f"{CLOUD}/trade", json={"source": a["id"], "target": b["id"], "commodity": "knowledge", "amount": 500})
    assert r.status_code == 200, r.text
    js = r.json()
    assert js["delivered"] == 500
    assert "routeStability" in js


def test_trade_invalid_commodity(s):
    a = _mk(s, "TEST_TradeBadA")
    b = _mk(s, "TEST_TradeBadB")
    r = s.post(f"{CLOUD}/trade", json={"source": a["id"], "target": b["id"], "commodity": "junk", "amount": 100})
    assert r.status_code == 400


# --- Synthesize ---
def test_synthesize(s):
    a = _mk(s, "TEST_SynA")
    b = _mk(s, "TEST_SynB")
    r = s.post(f"{CLOUD}/synthesize", json={"a": a["id"], "b": b["id"]})
    assert r.status_code == 200
    js = r.json()
    created_ids.append(js["id"])
    # sources deleted
    assert s.get(f"{CLOUD}/universes/{a['id']}").status_code == 404
    assert s.get(f"{CLOUD}/universes/{b['id']}").status_code == 404
    # merged exists
    assert s.get(f"{CLOUD}/universes/{js['id']}").status_code == 200


# --- Congress ---
def test_congress_resolution_and_vote(s):
    r = s.post(f"{CLOUD}/congress/resolutions", json={"title": "TEST_Resolution_1"})
    assert r.status_code == 200
    rid = r.json()["id"]
    r2 = s.post(f"{CLOUD}/congress/resolutions/{rid}/vote")
    assert r2.status_code == 200
    js = r2.json()
    assert isinstance(js["passed"], bool)


# --- Kernel ---
def test_kernel_status(s):
    r = s.get(f"{CLOUD}/kernel")
    assert r.status_code == 200
    js = r.json()
    for k in ["universes", "agents", "posture", "absoluteLaws"]:
        assert k in js
    assert len(js["absoluteLaws"]) == 5


# --- Delete ---
def test_delete_universe(s):
    d = _mk(s, "TEST_Deletable")
    r = s.delete(f"{CLOUD}/universes/{d['id']}")
    assert r.status_code == 200
    assert s.get(f"{CLOUD}/universes/{d['id']}").status_code == 404
    if d["id"] in created_ids:
        created_ids.remove(d["id"])


# --- Regression ---
def test_regression_keys_endpoint(s):
    # login first
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": "doctester1@frasberg.com", "password": "DocTester2026!"})
    if r.status_code != 200:
        pytest.skip(f"auth login not 200 (got {r.status_code})")
    r2 = s.get(f"{BASE_URL}/api/keys")
    assert r2.status_code == 200


def test_cleanup(s):
    # best-effort cleanup
    for uid in list(created_ids):
        s.delete(f"{CLOUD}/universes/{uid}")
