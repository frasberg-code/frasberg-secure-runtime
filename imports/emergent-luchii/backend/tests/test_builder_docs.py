"""Tests for docs paywall, builder quota/publish/domain, paypal config, chat regression."""
import os
import time
import json
import uuid
import requests
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from pathlib import Path

def _load_env():
    for envf in ["/app/frontend/.env", "/app/backend/.env"]:
        p = Path(envf)
        if not p.exists():
            continue
        for line in p.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))
_load_env()

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"
ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PW = "LuchiiAdmin2026!"


def _register_or_login(email: str, pw: str, name: str = "Test User"):
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"name": name, "email": email, "password": pw}, timeout=15)
    if r.status_code >= 400:
        r = s.post(f"{API}/auth/login", json={"email": email, "password": pw}, timeout=15)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=15)
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def free_sess():
    email = f"TEST_free_{uuid.uuid4().hex[:8]}@example.com"
    return _register_or_login(email, "TestPass2026!"), email


# ── docs paywall ───────────────────────────────────────────
class TestDocsPaywall:
    def test_entitlement_guest_401(self):
        r = requests.get(f"{API}/docs/entitlement", timeout=10)
        assert r.status_code == 401

    def test_entitlement_admin(self, admin_sess):
        r = admin_sess.get(f"{API}/docs/entitlement", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["pro"] is True
        assert "doc_credits" in data and "price" in data and "owned" in data
        assert data["price"] == "1.00"

    def test_entitlement_free(self, free_sess):
        s, _ = free_sess
        r = s.get(f"{API}/docs/entitlement", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["pro"] is False
        assert isinstance(data["doc_credits"], int)

    def test_unlock_guest_401(self):
        r = requests.post(f"{API}/docs/unlock", json={"doc_id": "d1"}, timeout=10)
        assert r.status_code == 401

    def test_unlock_admin_free(self, admin_sess):
        r = admin_sess.post(f"{API}/docs/unlock", json={"doc_id": f"admin-doc-{uuid.uuid4().hex[:6]}", "kind": "law"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("free") is True

    def test_unlock_free_no_credits_402(self, free_sess):
        s, _ = free_sess
        r = s.post(f"{API}/docs/unlock", json={"doc_id": "law-1", "kind": "law"}, timeout=10)
        assert r.status_code == 402
        assert "payment_required" in r.text


# ── credit deduction via direct Mongo write ───────────────────────────────
class TestCreditDeduction:
    def test_credits_deduction_flow(self):
        email = f"TEST_credit_{uuid.uuid4().hex[:8]}@example.com"
        s = _register_or_login(email, "TestPass2026!")

        # Set doc_credits = 2 via mongo (sync driver to avoid loop reuse issues)
        from pymongo import MongoClient
        mc = MongoClient(os.environ["MONGO_URL"])
        db = mc[os.environ["DB_NAME"]]
        u = db.users.find_one({"email": email.lower()})
        assert u is not None, f"user {email} not found"
        r = db.users.update_one({"email": email.lower()}, {"$set": {"doc_credits": 2}})
        assert r.matched_count == 1

        # unlock doc A -> remaining 1
        r = s.post(f"{API}/docs/unlock", json={"doc_id": "docA", "kind": "law"}, timeout=10)
        assert r.status_code == 200, r.text
        assert r.json()["remaining"] == 1

        # unlock docA again -> already_owned, no deduction
        r = s.post(f"{API}/docs/unlock", json={"doc_id": "docA", "kind": "law"}, timeout=10)
        assert r.status_code == 200
        assert r.json().get("already_owned") is True
        # entitlement still shows 1 credit
        ent = s.get(f"{API}/docs/entitlement", timeout=10).json()
        assert ent["doc_credits"] == 1

        # unlock docB -> remaining 0
        r = s.post(f"{API}/docs/unlock", json={"doc_id": "docB", "kind": "law"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["remaining"] == 0

        # unlock docC -> 402
        r = s.post(f"{API}/docs/unlock", json={"doc_id": "docC", "kind": "law"}, timeout=10)
        assert r.status_code == 402


# ── paypal config ───────────────────────────────────────────
class TestPaypalConfig:
    def test_paypal_config_has_doc_plans(self):
        r = requests.get(f"{API}/paypal/config", timeout=10)
        assert r.status_code == 200
        data = r.json()
        plans = {p["id"]: p for p in data.get("upgrade_plans", [])}
        assert "doc-single" in plans
        assert plans["doc-single"]["price"] == "1.00"
        assert plans["doc-single"].get("doc_credits") == 1
        assert "doc-pack" in plans
        assert plans["doc-pack"]["price"] == "5.00"
        assert plans["doc-pack"].get("doc_credits") == 10
        assert "luchii-pro" in plans


# ── builder quota / publish / domain ─────────────────────────
class TestBuilderQuota:
    def test_quota_guest_401(self):
        r = requests.get(f"{API}/builder/quota", timeout=10)
        assert r.status_code == 401

    def test_quota_admin_30(self, admin_sess):
        r = admin_sess.get(f"{API}/builder/quota", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["limit"] == 30
        assert d["pro"] is True

    def test_quota_free_5(self, free_sess):
        s, _ = free_sess
        r = s.get(f"{API}/builder/quota", timeout=10)
        assert r.status_code == 200
        assert r.json()["limit"] == 5


class TestBuilderGenerate:
    """Real LLM call - keep it small."""
    _pid = None

    def test_generate_admin_website(self, admin_sess):
        r = admin_sess.post(
            f"{API}/builder/generate",
            json={"prompt": "A tiny landing page for a lemonade stand", "type": "website"},
            timeout=180, stream=True,
        )
        assert r.status_code == 200, r.text
        done_payload = None
        deltas = 0
        for raw in r.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data:"):
                continue
            payload = json.loads(raw[5:].strip())
            if "delta" in payload:
                deltas += 1
            elif "done" in payload:
                done_payload = payload
                break
            elif "error" in payload:
                pytest.fail(f"stream error: {payload}")
        assert done_payload is not None, "no done event received"
        assert deltas > 0
        assert "project" in done_payload
        TestBuilderGenerate._pid = done_payload["project"]["id"]

    def test_get_project_has_html(self, admin_sess):
        pid = TestBuilderGenerate._pid
        assert pid, "no project id from generate"
        r = admin_sess.get(f"{API}/builder/projects/{pid}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "<html" in d.get("html", "").lower()

    def test_list_projects_hides_html(self, admin_sess):
        r = admin_sess.get(f"{API}/builder/projects", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        for it in items:
            assert "html" not in it

    def test_publish_admin(self, admin_sess):
        pid = TestBuilderGenerate._pid
        r = admin_sess.post(f"{API}/builder/projects/{pid}/publish", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("slug")
        TestBuilderGenerate._slug = d["slug"]

    def test_public_slug_serves_html(self):
        slug = getattr(TestBuilderGenerate, "_slug", None)
        assert slug
        r = requests.get(f"{API}/p/{slug}", timeout=15)
        assert r.status_code == 200
        assert "<html" in r.text.lower()

    def test_publish_free_402(self, free_sess):
        # Create a project directly in DB for free user so publish returns 402 (not 404).
        s, email = free_sess
        from pymongo import MongoClient
        mc = MongoClient(os.environ["MONGO_URL"])
        db = mc[os.environ["DB_NAME"]]
        u = db.users.find_one({"email": email.lower()})
        assert u is not None
        pid = str(uuid.uuid4())
        db.builder_projects.insert_one({
            "id": pid, "user_id": u["id"], "type": "website",
            "title": "t", "html": "<html></html>", "published": False, "slug": None,
            "custom_domain": None, "created_at": "x", "updated_at": "x",
        })
        r = s.post(f"{API}/builder/projects/{pid}/publish", timeout=10)
        assert r.status_code == 402
        assert "pro_required" in r.text

    def test_domain_admin_ok(self, admin_sess):
        pid = TestBuilderGenerate._pid
        r = admin_sess.post(f"{API}/builder/projects/{pid}/domain", json={"domain": "test.example.com"}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["domain"] == "test.example.com"
        assert isinstance(d.get("dns"), list) and len(d["dns"]) >= 2

    def test_delete_project(self, admin_sess):
        pid = TestBuilderGenerate._pid
        r = admin_sess.delete(f"{API}/builder/projects/{pid}", timeout=10)
        assert r.status_code == 200


# ── chat regression ─────────────────────────
class TestChatRegression:
    def test_chat_guest(self):
        r = requests.post(f"{API}/chat", json={"message": "hi", "session_id": f"t-{uuid.uuid4().hex[:6]}"}, timeout=60, stream=True)
        assert r.status_code == 200, r.text
        # consume at least one chunk
        got = False
        for chunk in r.iter_content(chunk_size=64):
            if chunk:
                got = True
                break
        assert got

    def test_chat_admin(self, admin_sess):
        r = admin_sess.post(f"{API}/chat", json={"message": "hello", "session_id": f"t-{uuid.uuid4().hex[:6]}"}, timeout=60, stream=True)
        assert r.status_code == 200
        got = False
        for chunk in r.iter_content(chunk_size=64):
            if chunk:
                got = True
                break
        assert got
