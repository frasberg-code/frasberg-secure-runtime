"""Iteration 16 regression: SSE guard on chat + builder, seal images, auth basics."""
import os
import json
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
               timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    body = r.json()
    # login returns user shape {id,email,name,role,...} and sets httpOnly cookies
    assert body.get("email") == ADMIN_EMAIL, f"unexpected login body: {body}"
    assert any(c.name in ("access_token", "session", "refresh_token") for c in s.cookies), \
        f"no auth cookies set: {list(s.cookies.keys())}"
    if "access_token" in body:
        s.headers.update({"Authorization": f"Bearer {body['access_token']}"})
    return s


def test_login_and_me(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/auth/me", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("email") == ADMIN_EMAIL


def _consume_sse(resp, max_events=200, max_seconds=180):
    events = []
    start = time.time()
    for raw in resp.iter_lines(decode_unicode=True):
        if time.time() - start > max_seconds:
            break
        if not raw:
            continue
        if raw.startswith(":"):
            events.append({"_keepalive": raw})
            continue
        if raw.startswith("data:"):
            payload = raw[5:].strip()
            try:
                events.append(json.loads(payload))
            except Exception:
                events.append({"_raw": payload})
        if len(events) >= max_events:
            break
        # stop on done
        last = events[-1] if events else None
        if isinstance(last, dict) and (last.get("done") is True or last.get("type") == "done"):
            break
    return events


def test_chat_sse_authed(admin_session):
    with admin_session.post(
        f"{BASE_URL}/api/chat",
        json={"message": "Say hi in 5 words"},
        stream=True,
        timeout=60,
    ) as r:
        assert r.status_code == 200, r.text[:400]
        assert "text/event-stream" in r.headers.get("content-type", "")
        events = _consume_sse(r, max_events=300, max_seconds=60)
    types = [e.get("type") for e in events if isinstance(e, dict)]
    has_done = any((isinstance(e, dict) and (e.get("done") is True or e.get("type") == "done")) for e in events)
    assert has_done, f"no done event; sample events={events[:5]} tail={events[-5:]}"
    deltas = [e for e in events if isinstance(e, dict) and ("delta" in e or e.get("type") == "delta")]
    assert len(deltas) >= 1, f"no delta events; events={events[:10]}"


def test_chat_sse_guest():
    r = requests.post(f"{BASE_URL}/api/chat",
                      json={"message": "hello"},
                      stream=True, timeout=60)
    assert r.status_code == 200, f"guest chat status={r.status_code}: {r.text[:300]}"
    events = _consume_sse(r, max_events=200, max_seconds=45)
    has_done = any((isinstance(e, dict) and (e.get("done") is True or e.get("type") == "done")) for e in events)
    has_delta = any((isinstance(e, dict) and ("delta" in e or e.get("type") == "delta")) for e in events)
    assert has_done or has_delta, f"no valid events; got={events[:10]}"


def test_builder_generate_sse(admin_session):
    payload = {"prompt": "simple pong game", "type": "game"}
    with admin_session.post(
        f"{BASE_URL}/api/builder/generate",
        json=payload,
        stream=True,
        timeout=(30, 300),
    ) as r:
        assert r.status_code == 200, r.text[:400]
        events = _consume_sse(r, max_events=5000, max_seconds=240)

    done_events = [e for e in events if isinstance(e, dict) and (e.get("done") is True or e.get("type") == "done")]
    assert done_events, f"builder never finished; last events={events[-15:]}"
    done_evt = done_events[-1]
    project_id = done_evt.get("id") or done_evt.get("project_id") or (done_evt.get("project") or {}).get("id")
    # some backends put id only in project payload, or return slug
    if not project_id:
        project_id = done_evt.get("slug")
    assert project_id, f"done event has no project id: {done_evt}"

    # verify listed
    lr = admin_session.get(f"{BASE_URL}/api/builder/projects", timeout=30)
    assert lr.status_code == 200
    projects = lr.json()
    if isinstance(projects, dict):
        projects = projects.get("projects") or projects.get("items") or []
    ids = [p.get("id") for p in projects]
    assert project_id in ids, f"created project {project_id} not in list ids={ids[:10]}"

    # fetch project HTML and validate
    pr = admin_session.get(f"{BASE_URL}/api/builder/projects/{project_id}", timeout=30)
    if pr.status_code == 200:
        proj = pr.json()
        html = proj.get("html") or proj.get("code") or ""
        assert "<!DOCTYPE html>" in html or "<!doctype html>" in html.lower()
        assert "<canvas" in html.lower() or "<script" in html.lower()


def test_builder_gallery():
    r = requests.get(f"{BASE_URL}/api/builder/gallery", timeout=30)
    assert r.status_code == 200
    data = r.json()
    items = data if isinstance(data, list) else (data.get("items") or data.get("projects") or [])
    assert len(items) >= 1, f"gallery empty: {data}"


def test_builder_quota(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/builder/quota", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "used" in data and "limit" in data, f"quota shape: {data}"


def test_court_endpoint_public():
    r = requests.post(f"{BASE_URL}/api/court",
                      json={"message": "Is water wet?"},
                      timeout=90)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    # ruling text field
    text = json.dumps(data).lower()
    assert any(k in data for k in ("ruling", "verdict", "opinion", "text")) or len(text) > 50
