"""Iter47 — Ascension History endpoint tests."""
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


def test_history_shape(sess):
    r = sess.get(f"{BASE_URL}/api/marketplace/announcements/history")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "announcements" in body and "total" in body
    assert isinstance(body["announcements"], list)
    assert isinstance(body["total"], int)
    assert len(body["announcements"]) <= 200
    for a in body["announcements"]:
        assert "_id" not in a
    # Verify sort desc by 'at'
    ats = [a.get("at") for a in body["announcements"] if a.get("at")]
    assert ats == sorted(ats, reverse=True), "should be newest first"


def test_history_contains_new_ascension(admin_sess):
    name = f"TEST_iter47_hist_{_u.uuid4().hex[:6]}"
    r = admin_sess.post(f"{BASE_URL}/api/marketplace/publish", json={
        "type": "agent", "name": name, "description": "iter47 history test agent"
    })
    assert r.status_code == 200, r.text
    item_id = r.json()["id"]

    r2 = admin_sess.post(f"{BASE_URL}/api/marketplace/{item_id}/ascend")
    assert r2.status_code == 200, r2.text

    hist = admin_sess.get(f"{BASE_URL}/api/marketplace/announcements/history").json()
    match = next((a for a in hist["announcements"] if a.get("agent_name") == name), None)
    assert match is not None
    for k in ("id", "type", "agent_name", "from_tier", "to_tier", "layer", "text", "at"):
        assert k in match
    assert hist["total"] >= 1


def test_cleanup(admin_sess):
    """Clean up TEST_ marketplace items + related announcements."""
    from pymongo import MongoClient
    from dotenv import dotenv_values
    env = dotenv_values("/app/backend/.env")
    client = MongoClient(env["MONGO_URL"])
    db = client[env["DB_NAME"]]
    m = db.marketplace.delete_many({"name": {"$regex": "^TEST_iter4"}})
    a = db.announcements.delete_many({"agent_name": {"$regex": "^TEST_iter4"}})
    print(f"cleaned marketplace={m.deleted_count}, announcements={a.deleted_count}")
    client.close()
