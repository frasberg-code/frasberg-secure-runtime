"""Iter46 — Ascension Announcements + Constellation deep links backend tests."""
import os
import uuid as _u
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


# --- announcements/latest endpoint shape ---
def test_announcements_latest_shape(sess):
    r = sess.get(f"{BASE_URL}/api/marketplace/announcements/latest")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "announcements" in body
    assert isinstance(body["announcements"], list)
    assert len(body["announcements"]) <= 10
    for a in body["announcements"]:
        assert "_id" not in a, "should not leak Mongo _id"


# --- ascend inserts announcement ---
def test_ascend_creates_announcement(admin_sess):
    name = f"TEST_iter46_ann_{_u.uuid4().hex[:6]}"
    r = admin_sess.post(f"{BASE_URL}/api/marketplace/publish", json={
        "type": "agent", "name": name, "description": "iter46 announcement test agent"
    })
    assert r.status_code == 200, r.text
    item_id = r.json()["id"]

    r2 = admin_sess.post(f"{BASE_URL}/api/marketplace/{item_id}/ascend")
    assert r2.status_code == 200, r2.text
    d = r2.json()
    assert d["from_tier"] == "CG-v21"
    assert d["to_tier"] == "CG-v22"

    # Now check announcement appears
    latest = admin_sess.get(f"{BASE_URL}/api/marketplace/announcements/latest").json()["announcements"]
    match = next((a for a in latest if a.get("agent_name") == name), None)
    assert match is not None, "expected announcement for ascended agent"
    for k in ("id", "type", "agent_name", "from_tier", "to_tier", "layer", "text", "at"):
        assert k in match, f"missing field {k}"
    assert match["type"] == "ascension"
    assert match["from_tier"] == "CG-v21"
    assert match["to_tier"] == "CG-v22"
    assert "ascended" in match["text"].lower()

    # Announcements are ordered newest first
    ats = [a["at"] for a in latest]
    assert ats == sorted(ats, reverse=True), "announcements not sorted newest-first"


# --- regression: ascend still requires auth ---
def test_ascend_requires_auth(sess):
    r = sess.post(f"{BASE_URL}/api/marketplace/some-fake-id/ascend")
    assert r.status_code in (401, 403), r.text
