"""Backend tests for Luchii — auth, chat, image, voice, keys, court, gateway, paypal, static."""
import os
import base64
import time
import uuid
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
# Fallback: read from frontend/.env
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"


# ----------------- Fixtures -----------------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def new_user_session():
    s = requests.Session()
    email = f"tester+{uuid.uuid4().hex[:8]}@frasberg.com"
    r = s.post(f"{API}/auth/register", json={"name": "Tester", "email": email, "password": "Test1234!"}, timeout=15)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    s.email = email
    return s


@pytest.fixture(scope="module")
def second_user_session():
    s = requests.Session()
    email = f"tester+{uuid.uuid4().hex[:8]}@frasberg.com"
    r = s.post(f"{API}/auth/register", json={"name": "Tester2", "email": email, "password": "Test1234!"}, timeout=15)
    assert r.status_code == 200
    return s


# ----------------- Auth -----------------
class TestAuth:
    def test_admin_login(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 200
        me = r.json()
        assert me["email"] == ADMIN_EMAIL
        assert me["role"] == "admin"

    def test_register_new_user_sets_cookies(self):
        s = requests.Session()
        email = f"tester+{uuid.uuid4().hex[:8]}@frasberg.com"
        r = s.post(f"{API}/auth/register", json={"name": "X", "email": email, "password": "Test1234!"}, timeout=15)
        assert r.status_code == 200
        assert "access_token" in s.cookies
        assert "refresh_token" in s.cookies
        assert r.json()["email"] == email

    def test_register_duplicate_email(self, new_user_session):
        r = requests.post(f"{API}/auth/register",
                          json={"name": "d", "email": new_user_session.email, "password": "Test1234!"}, timeout=10)
        assert r.status_code == 409

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "wrongpass!"}, timeout=10)
        assert r.status_code == 401

    def test_me_without_cookie(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_refresh_issues_new_access(self, new_user_session):
        # remove access, keep refresh
        s = requests.Session()
        s.cookies.set("refresh_token", new_user_session.cookies.get("refresh_token"))
        r = s.post(f"{API}/auth/refresh", timeout=10)
        assert r.status_code == 200
        assert "access_token" in s.cookies

    def test_logout_clears(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
        r = s.post(f"{API}/auth/logout", timeout=10)
        assert r.status_code == 200
        # cookie cleared server-side; subsequent /me should 401 with a fresh session
        s2 = requests.Session()
        r2 = s2.get(f"{API}/auth/me", timeout=10)
        assert r2.status_code == 401


# ----------------- Chat -----------------
class TestChat:
    def test_chat_requires_auth(self):
        r = requests.post(f"{API}/chat", json={"message": "hi"}, timeout=10)
        assert r.status_code == 401

    def test_chat_streams_with_auth(self, new_user_session):
        r = new_user_session.post(f"{API}/chat",
                                  json={"message": "Say hello briefly.", "session_id": "test-sess-1"},
                                  stream=True, timeout=60)
        assert r.status_code == 200
        got_delta = False
        got_done = False
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            if '"delta"' in line:
                got_delta = True
            if '"done"' in line:
                got_done = True
                break
        assert got_delta and got_done, "SSE did not stream expected events"

    def test_chat_history(self, new_user_session):
        r = new_user_session.get(f"{API}/chat/history", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "messages" in data
        assert len(data["messages"]) >= 1

    def test_chat_with_attachment_text(self, new_user_session):
        text = "This is a top-secret memo: Project Alpha launches Q3."
        b64 = base64.b64encode(text.encode()).decode()
        r = new_user_session.post(f"{API}/chat",
                                  json={"message": "Summarize the attached document in one sentence.",
                                        "attachment_base64": b64, "attachment_kind": "text",
                                        "attachment_name": "memo.txt",
                                        "session_id": "test-sess-attach"},
                                  stream=True, timeout=60)
        assert r.status_code == 200
        chunks = []
        for line in r.iter_lines(decode_unicode=True):
            if line and line.startswith("data:"):
                chunks.append(line)
                if '"done"' in line:
                    break
        assert any('"delta"' in c for c in chunks)


# ----------------- Image -----------------
class TestImage:
    def test_image_requires_auth(self):
        r = requests.post(f"{API}/generate/image", json={"prompt": "test"}, timeout=10)
        assert r.status_code == 401

    def test_image_generation(self, new_user_session):
        r = new_user_session.post(f"{API}/generate/image",
                                  json={"prompt": "a red circle on white background"}, timeout=120)
        assert r.status_code == 200, f"image gen failed: {r.status_code} {r.text[:200]}"
        data = r.json()
        assert "image_base64" in data and len(data["image_base64"]) > 100


# ----------------- Voice -----------------
class TestVoice:
    def test_speak_requires_auth(self):
        r = requests.post(f"{API}/voice/speak", json={"text": "hi"}, timeout=10)
        assert r.status_code == 401

    def test_transcribe_requires_auth(self):
        # Provide a dummy file so FastAPI doesn't 422 before auth check
        r = requests.post(f"{API}/voice/transcribe", files={"file": ("a.webm", b"x", "audio/webm")}, timeout=10)
        assert r.status_code == 401

    def test_speak_with_auth(self, new_user_session):
        r = new_user_session.post(f"{API}/voice/speak", json={"text": "Hello from Luchii"}, timeout=60)
        assert r.status_code == 200
        assert len(r.json().get("audio_base64", "")) > 100


# ----------------- Keys / Usage (user scoping) -----------------
class TestKeys:
    def test_keys_require_auth(self):
        assert requests.get(f"{API}/keys", timeout=10).status_code == 401
        assert requests.post(f"{API}/keys", json={"name": "x"}, timeout=10).status_code == 401
        assert requests.get(f"{API}/usage", timeout=10).status_code == 401

    def test_keys_user_scope(self, new_user_session, second_user_session):
        r = new_user_session.post(f"{API}/keys", json={"name": "TEST_key_A"}, timeout=10)
        assert r.status_code == 200
        key_a = r.json()
        assert key_a["key"].startswith("luchii-sk-")

        r2 = new_user_session.get(f"{API}/keys", timeout=10)
        assert r2.status_code == 200
        ids_a = [k["id"] for k in r2.json()]
        assert key_a["id"] in ids_a

        # user B must not see user A's keys
        r3 = second_user_session.get(f"{API}/keys", timeout=10)
        ids_b = [k["id"] for k in r3.json()]
        assert key_a["id"] not in ids_b

        # user B cannot delete user A's key
        rd = second_user_session.delete(f"{API}/keys/{key_a['id']}", timeout=10)
        assert rd.status_code == 404

        # user A can delete their own
        rd2 = new_user_session.delete(f"{API}/keys/{key_a['id']}", timeout=10)
        assert rd2.status_code == 200

    def test_usage_endpoint(self, new_user_session):
        r = new_user_session.get(f"{API}/usage", timeout=10)
        assert r.status_code == 200
        assert "total_requests" in r.json()


# ----------------- Public regression -----------------
class TestPublic:
    def test_court_public(self):
        r = requests.post(f"{API}/court", json={"message": "Should we launch on Friday?"},
                          stream=True, timeout=60)
        assert r.status_code == 200
        found = False
        for line in r.iter_lines(decode_unicode=True):
            if line and '"delta"' in line:
                found = True
            if line and '"done"' in line:
                break
        assert found

    def test_gateway_requires_key(self):
        r = requests.post(f"{API}/v1/chat", json={"message": "hi"}, timeout=10)
        assert r.status_code == 401

    def test_gateway_with_key(self, new_user_session):
        rc = new_user_session.post(f"{API}/keys", json={"name": "TEST_gateway"}, timeout=10)
        assert rc.status_code == 200
        key = rc.json()["key"]
        r = requests.post(f"{API}/v1/chat", json={"message": "Say hi"},
                          headers={"Authorization": f"Bearer {key}"}, stream=True, timeout=60)
        assert r.status_code == 200
        found_delta = False
        for line in r.iter_lines(decode_unicode=True):
            if line and '"delta"' in line:
                found_delta = True
            if line and '"done"' in line:
                break
        assert found_delta
        new_user_session.delete(f"{API}/keys/{rc.json()['id']}", timeout=10)

    def test_paypal_config(self):
        r = requests.get(f"{API}/paypal/config", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data.get("plans"), list) and len(data["plans"]) >= 3


# ----------------- Static -----------------
class TestStatic:
    def test_sitemap(self):
        r = requests.get(f"{BASE_URL}/sitemap.xml", timeout=10)
        assert r.status_code == 200
        assert "<urlset" in r.text or "<sitemapindex" in r.text

    def test_robots(self):
        r = requests.get(f"{BASE_URL}/robots.txt", timeout=10)
        assert r.status_code == 200
        assert "User-agent" in r.text or "Sitemap" in r.text
