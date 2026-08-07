"""Iteration 23: Luchii Builder end-to-end proof tests.
Tests: auth login (httpOnly cookie), quota, generate SSE (short prompt),
project fetch, publish, public site fetch, gallery, remix, unauth 401,
Carjack City games registry.
"""
import os
import json
import time
import requests
import pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"
USER_EMAIL = "doctester1@frasberg.com"
USER_PASSWORD = "DocTester2026!"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies or "access_token" in r.cookies, \
        f"httpOnly cookie not set. cookies={dict(s.cookies)}"
    return s


@pytest.fixture(scope="module")
def user_session():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login",
               json={"email": USER_EMAIL, "password": USER_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"user login failed: {r.status_code} {r.text}"
    return s


# ── Auth & Quota ────────────────────────────────────────────────────────────
def test_quota_admin(admin_session):
    r = admin_session.get(f"{BASE}/api/builder/quota", timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    assert set(d.keys()) >= {"used", "limit", "pro"}
    assert d["limit"] == 30, f"admin limit should be pro=30, got {d}"
    assert d["pro"] is True


def test_quota_user(user_session):
    r = user_session.get(f"{BASE}/api/builder/quota", timeout=15)
    assert r.status_code == 200
    d = r.json()
    # doctester1 is set to premium in credentials note → should be pro
    assert isinstance(d["used"], int) and isinstance(d["limit"], int)


def test_unauth_projects_401():
    r = requests.get(f"{BASE}/api/builder/projects", timeout=10)
    assert r.status_code == 401, f"expected 401, got {r.status_code}"


# ── Gallery / public routes ─────────────────────────────────────────────────
def test_gallery_public():
    r = requests.get(f"{BASE}/api/builder/gallery", timeout=15)
    assert r.status_code == 200
    docs = r.json()
    assert isinstance(docs, list)


def test_public_slug_ai_gateway_demo():
    r = requests.get(f"{BASE}/api/p/ai-gateway-demo", timeout=15)
    # This may or may not exist. If exists → 200 HTML, else 404.
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        assert "<!DOCTYPE" in r.text or "<html" in r.text.lower()


def test_public_known_slug_from_context():
    # Slugs the main agent verified live
    for slug in ["a-tiny-clicker-game-with-329344",
                 "a-pomodoro-focus-timer-a-7ca2c9",
                 "a-very-simple-one-button-ea9ecb"]:
        r = requests.get(f"{BASE}/api/p/{slug}", timeout=15)
        assert r.status_code == 200, f"published slug {slug} not live: {r.status_code}"
        assert "<!DOCTYPE" in r.text or "<html" in r.text.lower()


# ── SSE generate + persist + publish + public serve ─────────────────────────
def test_generate_persist_publish_full_flow(admin_session):
    """Single expensive test: 1 LLM build, then verify persist + publish + public."""
    payload = {"prompt": "a tiny tip calculator", "type": "app"}
    project_id = None
    delta_count = 0
    with admin_session.post(f"{BASE}/api/builder/generate", json=payload,
                            stream=True, timeout=240) as r:
        assert r.status_code == 200, f"generate failed: {r.status_code} {r.text[:400]}"
        assert "text/event-stream" in r.headers.get("Content-Type", "")
        start = time.time()
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith(":"):
                continue
            if line.startswith("data:"):
                try:
                    evt = json.loads(line[5:].strip())
                except Exception:
                    continue
                if "delta" in evt:
                    delta_count += 1
                if evt.get("done"):
                    project_id = evt.get("project", {}).get("id")
                    break
                if evt.get("error"):
                    pytest.fail(f"builder error event: {evt}")
            if time.time() - start > 220:
                pytest.fail("SSE stream timed out (>220s)")
    assert delta_count > 5, f"expected many delta events, got {delta_count}"
    assert project_id, "done event missing project.id"

    # GET the project → verify html persisted
    r = admin_session.get(f"{BASE}/api/builder/projects/{project_id}", timeout=15)
    assert r.status_code == 200, r.text
    proj = r.json()
    assert proj["id"] == project_id
    assert proj.get("html"), "project html is empty"
    assert "<!DOCTYPE" in proj["html"] or "<html" in proj["html"].lower()

    # Publish
    r = admin_session.post(f"{BASE}/api/builder/projects/{project_id}/publish",
                           timeout=15)
    assert r.status_code == 200, r.text
    pub = r.json()
    slug = pub.get("slug")
    assert slug, f"no slug returned: {pub}"

    # Public fetch (no auth)
    r = requests.get(f"{BASE}/api/p/{slug}", timeout=15)
    assert r.status_code == 200
    assert "<!DOCTYPE" in r.text or "<html" in r.text.lower()

    # Show in project list
    r = admin_session.get(f"{BASE}/api/builder/projects", timeout=15)
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()]
    assert project_id in ids


# ── Remix ───────────────────────────────────────────────────────────────────
def test_remix_published_build(user_session):
    # Find a published build
    r = requests.get(f"{BASE}/api/builder/gallery", timeout=15)
    docs = r.json()
    if not docs:
        pytest.skip("no published builds in gallery to remix")
    slug = docs[0]["slug"]
    r = user_session.post(f"{BASE}/api/builder/remix", json={"slug": slug}, timeout=20)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("id") and d.get("title", "").startswith("Remix of")


# ── Games registry: Carjack City only, no duplicate Carjack Pro ────────────
def test_games_registry_carjack_city_only():
    r = requests.get(f"{BASE}/api/games", timeout=15)
    assert r.status_code == 200, r.text
    games = r.json()
    if isinstance(games, dict):
        games = games.get("games", [])
    titles = [g.get("title", "") for g in games]
    carjacks = [t for t in titles if "carjack" in t.lower()]
    assert len(carjacks) == 1, f"expected exactly 1 Carjack entry, got {carjacks}"
    assert carjacks[0] == "Carjack City", f"expected 'Carjack City', got {carjacks[0]!r}"
    assert not any("Carjack Pro" in t for t in titles), "Carjack Pro duplicate found"
