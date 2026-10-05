"""Iteration 37 — Frasberg team domain unlimited access."""
import os, uuid, time, json
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "http://localhost:8001"
if not BASE_URL.endswith("/api"):
    API = BASE_URL + "/api"
else:
    API = BASE_URL

TEAM_EMAIL = f"qa-team-{uuid.uuid4().hex[:8]}@frasbergai.com"
FREE_EMAIL = f"qa-free-{uuid.uuid4().hex[:8]}@example.com"
PW = "TestPass123!"


@pytest.fixture(scope="module")
def team_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "QA Team", "email": TEAM_EMAIL, "password": PW})
    assert r.status_code in (200, 201), f"register team failed: {r.status_code} {r.text}"
    data = r.json()
    print(f"register response plan={data.get('user', data).get('plan') if isinstance(data, dict) else 'n/a'}")
    return s, data


@pytest.fixture(scope="module")
def free_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": "QA Free", "email": FREE_EMAIL, "password": PW})
    assert r.status_code in (200, 201), f"register free failed: {r.status_code} {r.text}"
    return s, r.json()


# ---------- Team plan detection ----------

def test_team_register_returns_scale_plan(team_session):
    s, data = team_session
    # register response should contain user with plan scale
    user = data.get("user") if isinstance(data, dict) and "user" in data else data
    plan = user.get("plan") if isinstance(user, dict) else None
    assert plan in ("scale", "team"), f"expected scale/team, got {plan}. body={data}"


def test_team_quotas_unlimited(team_session):
    s, _ = team_session
    r = s.get(f"{API}/quotas")
    assert r.status_code == 200, r.text
    q = r.json()
    assert q.get("plan") == "team", q
    assert q.get("unlimited") is True, q


# ---------- Team keys: >3 allowed ----------

def test_team_can_create_more_than_3_keys(team_session):
    s, _ = team_session
    created = []
    for i in range(4):
        r = s.post(f"{API}/keys", json={"name": f"TEST_team_key_{i}"})
        assert r.status_code == 200, f"key {i} failed: {r.status_code} {r.text}"
        j = r.json()
        # key might be in 'key' or 'plaintext' etc
        kv = j.get("key") or j.get("plaintext") or j.get("api_key")
        created.append((j.get("id"), kv))
    # cleanup handled at module teardown; store on module for reuse
    pytest.team_keys = created
    assert len([k for _, k in created if k]) >= 1


# ---------- Team key: chat works, no credit deduction ----------

def test_team_key_chat_no_credit_deduction(team_session):
    s, _ = team_session
    keys = getattr(pytest, "team_keys", [])
    key_val = None
    for _, k in keys:
        if k:
            key_val = k
            break
    if not key_val:
        pytest.skip("no plaintext key available")

    # Snapshot credits before
    before = s.get(f"{API}/keys").json()
    credits_before = {k["id"]: k.get("credits", 0) for k in (before if isinstance(before, list) else before.get("keys", []))}

    headers = {"Authorization": f"Bearer {key_val}", "Content-Type": "application/json"}
    # SSE call - we don't need to stream; just verify 200
    r = requests.post(f"{API}/v1/chat",
                      json={"message": "Say hi in 3 words.", "model": "luchii-7b"},
                      headers=headers, timeout=90, stream=True)
    # SSE stream: consume a small portion
    if r.status_code == 200:
        chunks = 0
        for _ in r.iter_lines():
            chunks += 1
            if chunks >= 3:
                break
        r.close()
    assert r.status_code == 200, f"chat failed: {r.status_code} {r.text[:300]}"

    time.sleep(2)
    after = s.get(f"{API}/keys").json()
    credits_after = {k["id"]: k.get("credits", 0) for k in (after if isinstance(after, list) else after.get("keys", []))}
    # Team should not deduct credits
    for kid, cb in credits_before.items():
        ca = credits_after.get(kid, cb)
        assert ca == cb, f"team key {kid} credits changed {cb}->{ca}"


def test_team_openai_compatible_endpoint(team_session):
    keys = getattr(pytest, "team_keys", [])
    key_val = next((k for _, k in keys if k), None)
    if not key_val:
        pytest.skip("no key")
    headers = {"Authorization": f"Bearer {key_val}", "Content-Type": "application/json"}
    r = requests.post(f"{API}/v1/chat/completions",
                      json={"model": "luchii-7b", "messages": [{"role": "user", "content": "hi"}], "stream": False},
                      headers=headers, timeout=90)
    assert r.status_code == 200, f"completions failed: {r.status_code} {r.text[:300]}"


# ---------- Free user still constrained ----------

def test_free_quotas_numeric(free_session):
    s, _ = free_session
    r = s.get(f"{API}/quotas")
    assert r.status_code == 200
    q = r.json()
    assert q.get("plan") == "free", q
    assert not q.get("unlimited"), q
    assert isinstance(q.get("rpm_limit"), int) and q["rpm_limit"] > 0


def test_free_capped_at_3_keys(free_session):
    s, _ = free_session
    statuses = []
    for i in range(4):
        r = s.post(f"{API}/keys", json={"name": f"TEST_free_key_{i}"})
        statuses.append(r.status_code)
        if i == 3:
            assert r.status_code == 402, f"expected 402 on 4th, got {r.status_code} {r.text}"
            j = r.json()
            code = (j.get("detail") if isinstance(j.get("detail"), str) else (j.get("detail") or {}).get("code")) or j.get("code")
            assert "free_key_limit" in json.dumps(j), f"expected free_key_limit code, got {j}"
    assert statuses[:3] == [200, 200, 200], statuses


# ---------- Teardown: revoke keys ----------

def test_cleanup_team_keys(team_session):
    s, _ = team_session
    for kid, _ in getattr(pytest, "team_keys", []):
        if kid:
            s.delete(f"{API}/keys/{kid}")
