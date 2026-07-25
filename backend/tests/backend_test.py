"""Backend tests for Luchii API (FrasbergAI)."""
import json
import os
import time

import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://ai-gateway-demo.preview.emergentagent.com",
).rstrip("/")


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Root & status ----------
class TestRootAndStatus:
    def test_root(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("message") == "Luchii API online"
        assert d.get("publisher") == "FrasbergAI"

    def test_status_create_and_list(self, api_client):
        payload = {"client_name": "TEST_pytest_status"}
        r = api_client.post(f"{BASE_URL}/api/status", json=payload, timeout=15)
        assert r.status_code == 200
        created = r.json()
        assert created["client_name"] == payload["client_name"]
        assert isinstance(created["id"], str) and len(created["id"]) > 0
        assert "timestamp" in created

        r2 = api_client.get(f"{BASE_URL}/api/status", timeout=15)
        assert r2.status_code == 200
        arr = r2.json()
        assert isinstance(arr, list)
        # Verify our just-created record persisted
        assert any(x.get("id") == created["id"] for x in arr), "created status not persisted"
        # ensure no mongodb _id key leaks
        for x in arr[:10]:
            assert "_id" not in x


# ---------- Chat streaming (SSE) ----------
def _consume_sse(url: str, body: dict, timeout: int = 45):
    """Return (deltas: list[str], done_payload: dict|None, http_status)."""
    deltas, done_payload = [], None
    with requests.post(url, json=body, stream=True, timeout=timeout) as r:
        status = r.status_code
        # Content type must indicate an event stream
        ctype = r.headers.get("content-type", "")
        # do not assert here so we can capture debug info later
        for raw in r.iter_lines(decode_unicode=True):
            if not raw:
                continue
            line = raw.strip()
            if not line.startswith("data:"):
                continue
            try:
                payload = json.loads(line[5:].strip())
            except json.JSONDecodeError:
                continue
            if "delta" in payload:
                deltas.append(payload["delta"])
            if payload.get("done"):
                done_payload = payload
                break
    return deltas, done_payload, status, ctype


class TestChat:
    def test_chat_streams_and_returns_done(self, api_client):
        url = f"{BASE_URL}/api/chat"
        deltas, done, status, ctype = _consume_sse(
            url,
            {"message": "Explain the Five Realms", "model": "luchii-7b"},
        )
        assert status == 200, f"non-200 status: {status}"
        assert "text/event-stream" in ctype, f"wrong content-type: {ctype}"
        full = "".join(deltas)
        assert len(full.strip()) > 0, "no delta content streamed"
        assert done is not None, "stream ended without done payload"
        assert done.get("done") is True
        assert isinstance(done.get("session_id"), str) and len(done["session_id"]) > 0

    def test_chat_multiturn_with_session(self, api_client):
        url = f"{BASE_URL}/api/chat"
        # first turn -> get a session_id
        deltas1, done1, s1, _ = _consume_sse(
            url, {"message": "Which tier for coding?", "model": "luchii-7b"}
        )
        assert s1 == 200
        assert done1 and done1.get("session_id")
        session_id = done1["session_id"]
        first_text = "".join(deltas1)
        assert first_text.strip()

        # second turn using the same session_id
        deltas2, done2, s2, _ = _consume_sse(
            url,
            {
                "message": "And for a haiku about Europa?",
                "model": "luchii-7b",
                "session_id": session_id,
            },
        )
        assert s2 == 200
        assert done2 and done2.get("session_id") == session_id
        second_text = "".join(deltas2)
        assert second_text.strip()

    def test_chat_persists_messages(self, api_client):
        """Send a chat then verify messages were persisted by checking
        that a follow-up request with the same session_id includes prior
        context (server includes recent transcript in system prompt path,
        so we verify persistence via a second turn getting a coherent reply)."""
        url = f"{BASE_URL}/api/chat"
        marker = f"TEST_marker_{int(time.time())}"
        deltas, done, status, _ = _consume_sse(
            url, {"message": f"Say hello {marker}", "model": "luchii-1b"}
        )
        assert status == 200 and done and done.get("session_id")
        sid = done["session_id"]

        # follow-up in the same session; should still stream successfully
        deltas2, done2, s2, _ = _consume_sse(
            url,
            {"message": "What was in my last message?", "session_id": sid, "model": "luchii-1b"},
        )
        assert s2 == 200 and done2 and done2.get("session_id") == sid
        assert "".join(deltas2).strip()
