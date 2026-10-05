"""Iteration 32: FrasbergAI OpenAI-compatible provider gateway tests."""
import os
import time
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"
ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}
FREE = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, f"admin login failed {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def api_key(admin_session):
    m = admin_session.post(f"{API}/keys", json={"name": "TEST_iter32_gateway"}, timeout=15)
    assert m.status_code in (200, 201), f"mint key failed {m.status_code} {m.text}"
    body = m.json()
    key = body.get("key") or body.get("secret") or body.get("api_key")
    assert key and key.startswith("luchii-sk"), f"expected luchii-sk key, got {body}"
    return {"key": key, "id": body.get("id") or body.get("_id"), "session": admin_session}


# -------- Models catalog --------
def test_models_list_no_auth():
    r = requests.get(f"{API}/v1/models", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("object") == "list"
    data = body.get("data") or []
    ids = [m.get("id") for m in data]
    for expected in ["luchii-6-plus", "luchii-6-mini", "luchii-6-embed",
                     "luchii-70b", "luchii-7b", "luchii-1b", "luchii-200m"]:
        assert expected in ids, f"missing model {expected} in {ids}"
    for m in data:
        assert m.get("owned_by") == "frasbergai", f"owned_by wrong: {m}"


# -------- Provider registry / manifest --------
def test_provider_registry():
    r = requests.get(f"{API}/v1/provider", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    reg = body.get("registry") or {}
    assert reg.get("id") == "frasbergai"
    assert reg.get("auth") == "bearer"
    assert reg.get("sse") is True
    man = body.get("manifest") or {}
    assert man.get("openai_compatible") is True
    providers = body.get("providers") or []
    ids = [p.get("id") if isinstance(p, dict) else p for p in providers]
    assert "frasbergai" in ids, f"frasbergai missing from providers: {ids}"
    assert body.get("verified") is True


def test_well_known_backend():
    for path in ["/.well-known/frasbergai-provider.json",
                 "/.well-known/provider-manifest.json",
                 "/.well-known/openapi.yaml"]:
        r = requests.get(f"{API}{path}", timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code}"


def test_well_known_frontend_static():
    for path in ["/.well-known/frasbergai-provider.json",
                 "/.well-known/provider-manifest.json"]:
        r = requests.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code}"


# -------- Chat completions --------
def test_chat_completions_no_auth():
    r = requests.post(f"{API}/v1/chat/completions",
                      json={"model": "luchii-6-mini", "messages": [{"role": "user", "content": "hi"}]},
                      timeout=15)
    assert r.status_code == 401, f"expected 401 got {r.status_code}"


def test_chat_completions_bad_model(api_key):
    r = requests.post(f"{API}/v1/chat/completions",
                      headers={"Authorization": f"Bearer {api_key['key']}"},
                      json={"model": "does-not-exist", "messages": [{"role": "user", "content": "hi"}]},
                      timeout=30)
    assert r.status_code == 404, f"expected 404 got {r.status_code} {r.text[:200]}"


def test_chat_completions_nonstream(api_key):
    r = requests.post(f"{API}/v1/chat/completions",
                      headers={"Authorization": f"Bearer {api_key['key']}"},
                      json={"model": "luchii-6-mini",
                            "messages": [{"role": "user", "content": "Reply with just OK."}]},
                      timeout=90)
    assert r.status_code == 200, r.text[:400]
    body = r.json()
    assert body.get("object") == "chat.completion", body
    choices = body.get("choices") or []
    assert choices and choices[0].get("message", {}).get("content"), body
    assert "usage" in body


def test_chat_completions_multiturn(api_key):
    msgs = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say hi in one word."},
        {"role": "assistant", "content": "Hi"},
        {"role": "user", "content": "Now say bye in one word."},
    ]
    r = requests.post(f"{API}/v1/chat/completions",
                      headers={"Authorization": f"Bearer {api_key['key']}"},
                      json={"model": "luchii-6-mini", "messages": msgs},
                      timeout=90)
    assert r.status_code == 200, r.text[:400]
    body = r.json()
    assert body.get("choices", [{}])[0].get("message", {}).get("content")


def test_chat_completions_stream(api_key):
    r = requests.post(f"{API}/v1/chat/completions",
                      headers={"Authorization": f"Bearer {api_key['key']}"},
                      json={"model": "luchii-6-mini",
                            "messages": [{"role": "user", "content": "Count 1 2 3"}],
                            "stream": True},
                      timeout=90, stream=True)
    assert r.status_code == 200, r.text[:200]
    saw_chunk = False
    saw_finish = False
    saw_done = False
    for raw in r.iter_lines(decode_unicode=True):
        if not raw:
            continue
        if raw.strip() == "data: [DONE]":
            saw_done = True
            break
        if raw.startswith("data:"):
            payload = raw[5:].strip()
            try:
                obj = json.loads(payload)
                if obj.get("object") == "chat.completion.chunk":
                    saw_chunk = True
                    ch = (obj.get("choices") or [{}])[0]
                    if ch.get("finish_reason") == "stop":
                        saw_finish = True
            except Exception:
                pass
    assert saw_chunk, "no chat.completion.chunk frames"
    assert saw_done, "no [DONE] terminator"
    assert saw_finish, "no finish_reason=stop"


# -------- Embeddings --------
def test_embeddings_no_auth():
    r = requests.post(f"{API}/v1/embeddings",
                      json={"model": "luchii-6-embed", "input": ["a"]}, timeout=15)
    assert r.status_code == 401, f"expected 401 got {r.status_code}"


def test_embeddings_ok(api_key):
    def call():
        return requests.post(f"{API}/v1/embeddings",
                             headers={"Authorization": f"Bearer {api_key['key']}"},
                             json={"model": "luchii-6-embed", "input": ["alpha", "beta"]},
                             timeout=90)
    r = call()
    if r.status_code == 503:
        time.sleep(20)
        r = call()
    assert r.status_code == 200, r.text[:300]
    body = r.json()
    data = body.get("data") or []
    assert len(data) == 2, f"expected 2 vectors, got {len(data)}"
    for v in data:
        emb = v.get("embedding") or []
        assert len(emb) == 384, f"expected 384 dims got {len(emb)}"
    assert "usage" in body


# -------- Usage metering --------
def test_usage_metering(api_key):
    s = api_key["session"]
    r = s.get(f"{API}/keys", timeout=15)
    assert r.status_code == 200
    body = r.json()
    keys = body if isinstance(body, list) else body.get("keys", [])
    kid = api_key["id"]
    found = next((k for k in keys if k.get("id") == kid or k.get("_id") == kid or k.get("name") == "TEST_iter32_gateway"), None)
    assert found, f"key {kid} not in list"
    rc = found.get("request_count") or found.get("requests") or 0
    tc = found.get("token_count") or found.get("tokens") or 0
    assert rc > 0, f"request_count not incremented: {found}"
    # token_count is best-effort
    print(f"key metering: requests={rc} tokens={tc}")


# -------- Tip leaderboard --------
def test_tip_leaderboard():
    r = requests.get(f"{API}/rooms/room-linq-001/tips/leaderboard", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("roomId") == "room-linq-001"
    assert isinstance(body.get("leaderboard"), list)


# -------- Regression: native /api/v1/chat streaming --------
def test_native_chat_stream(api_key):
    r = requests.post(f"{API}/v1/chat",
                      headers={"Authorization": f"Bearer {api_key['key']}"},
                      json={"message": "Reply briefly: hi"},
                      timeout=90, stream=True)
    assert r.status_code == 200, r.text[:200]
    got_any = False
    for raw in r.iter_lines(decode_unicode=True):
        if raw:
            got_any = True
            break
    assert got_any, "no data streamed from native /v1/chat"


# -------- Cleanup --------
def test_cleanup_key(api_key):
    s = api_key["session"]
    kid = api_key["id"]
    if kid:
        r = s.delete(f"{API}/keys/{kid}", timeout=15)
        assert r.status_code in (200, 204), f"cleanup delete failed {r.status_code}"
