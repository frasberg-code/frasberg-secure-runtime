"""
Backend tests for iteration 8:
- Admin dashboard endpoints (stats/users/conversations/knowledge CRUD)
- Auth guards (401 unauth, 403 non-admin)
- Memory extraction + GET/DELETE /api/memory
- KB RAG in /api/chat (Five Realms)
- Tone (warm vs firm) and /api/voice/speak tone
"""
import os
import time
import uuid
import json
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASS = "LuchiiAdmin2026!"


def _login(session, email, password):
    r = session.post(f"{API}/auth/login", json={"email": email, "password": password})
    return r


def _register(session, email, password, name="Tester"):
    r = session.post(f"{API}/auth/register", json={"email": email, "password": password, "name": name})
    return r


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = _login(s, ADMIN_EMAIL, ADMIN_PASS)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def user_session():
    s = requests.Session()
    email = f"tester+{uuid.uuid4().hex[:8]}@frasberg.com"
    r = _register(s, email, "Test1234!")
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    # register should log in and set cookies OR require login
    r2 = _login(s, email, "Test1234!")
    assert r2.status_code == 200
    s.email = email  # type: ignore
    return s


# ---------------- Admin auth guards ----------------

class TestAdminGuards:
    def test_stats_unauth_401(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_users_unauth_401(self):
        r = requests.get(f"{API}/admin/users")
        assert r.status_code == 401

    def test_conversations_unauth_401(self):
        r = requests.get(f"{API}/admin/conversations")
        assert r.status_code == 401

    def test_knowledge_unauth_401(self):
        r = requests.get(f"{API}/admin/knowledge")
        assert r.status_code == 401

    def test_stats_non_admin_403(self, user_session):
        r = user_session.get(f"{API}/admin/stats")
        assert r.status_code == 403

    def test_knowledge_non_admin_403(self, user_session):
        r = user_session.get(f"{API}/admin/knowledge")
        assert r.status_code == 403


# ---------------- Admin endpoints ----------------

class TestAdminEndpoints:
    def test_stats_ok(self, admin_session):
        r = admin_session.get(f"{API}/admin/stats")
        assert r.status_code == 200
        data = r.json()
        for k in ["users", "messages", "sessions", "court_filings", "api_keys", "knowledge_docs", "upstream_active"]:
            assert k in data, f"missing key {k}"
        assert data["knowledge_docs"] >= 5

    def test_users_list(self, admin_session):
        r = admin_session.get(f"{API}/admin/users")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        # no password hashes leaked
        for u in arr:
            assert "password_hash" not in u

    def test_conversations_list(self, admin_session):
        r = admin_session.get(f"{API}/admin/conversations")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Knowledge CRUD ----------------

class TestKnowledgeCRUD:
    def test_full_crud_cycle(self, admin_session):
        # CREATE
        payload = {"title": "TEST_Doc_Zorbits", "content": "Frasberg test knowledge about zorbits and their orbits.",
                   "tags": ["test", "zorbits"]}
        rc = admin_session.post(f"{API}/admin/knowledge", json=payload)
        assert rc.status_code == 200, rc.text
        created = rc.json()
        assert created["title"] == payload["title"]
        assert created["content"] == payload["content"]
        assert "id" in created
        doc_id = created["id"]

        # LIST contains it
        rl = admin_session.get(f"{API}/admin/knowledge")
        assert rl.status_code == 200
        assert any(d["id"] == doc_id for d in rl.json())

        # UPDATE
        payload2 = {"title": "TEST_Doc_Zorbits_v2", "content": "Updated content about zorbits.", "tags": ["test"]}
        ru = admin_session.put(f"{API}/admin/knowledge/{doc_id}", json=payload2)
        assert ru.status_code == 200
        # verify persistence
        rl2 = admin_session.get(f"{API}/admin/knowledge")
        found = next((d for d in rl2.json() if d["id"] == doc_id), None)
        assert found is not None
        assert found["title"] == "TEST_Doc_Zorbits_v2"

        # DELETE
        rd = admin_session.delete(f"{API}/admin/knowledge/{doc_id}")
        assert rd.status_code == 200

        rl3 = admin_session.get(f"{API}/admin/knowledge")
        assert not any(d["id"] == doc_id for d in rl3.json())


# ---------------- RAG in chat ----------------

def _collect_chat_stream(payload, session=None):
    sess = session or requests.Session()
    with sess.post(f"{API}/chat", json=payload, stream=True, timeout=90) as r:
        assert r.status_code == 200, r.text
        buf = ""
        for line in r.iter_lines():
            if not line:
                continue
            if isinstance(line, bytes):
                line = line.decode("utf-8", errors="ignore")
            if line.startswith("data: "):
                try:
                    obj = json.loads(line[6:])
                except Exception:
                    continue
                if "delta" in obj:
                    buf += obj["delta"]
                if obj.get("done"):
                    break
        return buf


class TestRAG:
    def test_five_realms_from_kb(self):
        text = _collect_chat_stream({"message": "What are the Five Realms?"})
        low = text.lower()
        hits = sum(k in low for k in ["earth", "mars", "europa", "titan", "meta"])
        assert hits >= 4, f"Expected realm names in reply, got: {text[:400]}"


# ---------------- Memory ----------------

class TestMemory:
    def test_memory_flow(self, user_session):
        # send a memorable message
        msg = f"My name is Marcus_{uuid.uuid4().hex[:5]} and I am building a bakery website"
        _collect_chat_stream({"message": msg}, session=user_session)
        # poll GET /api/memory
        found = None
        for _ in range(8):
            time.sleep(4)
            r = user_session.get(f"{API}/memory")
            if r.status_code == 200 and len(r.json()) > 0:
                docs = r.json()
                for d in docs:
                    f = d.get("fact", "").lower()
                    if "marcus" in f or "bakery" in f:
                        found = d
                        break
                if found:
                    break
        assert found is not None, "memory extraction produced no matching fact after ~32s"

        # DELETE
        rd = user_session.delete(f"{API}/memory/{found['id']}")
        assert rd.status_code == 200
        rl = user_session.get(f"{API}/memory")
        assert not any(d["id"] == found["id"] for d in rl.json())


# ---------------- Tone ----------------

class TestTone:
    def test_tone_differs(self):
        prompt = "Give me one sentence of advice on shipping a new product."
        warm = _collect_chat_stream({"message": prompt, "tone": "warm"})
        firm = _collect_chat_stream({"message": prompt, "tone": "firm"})
        assert warm and firm
        # different outputs, at least
        assert warm.strip() != firm.strip(), "warm and firm returned identical replies"

    def test_voice_speak_tone(self, user_session):
        r = user_session.post(f"{API}/voice/speak", json={"text": "Hello", "tone": "business"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "audio_base64" in data and len(data["audio_base64"]) > 100


# ---------------- Regression: agent persona ----------------

class TestRegression:
    def test_agent_debugger_streams(self):
        text = _collect_chat_stream({"message": "TypeError: cannot read property x of undefined", "agent": "debugger"})
        assert text and len(text) > 20
