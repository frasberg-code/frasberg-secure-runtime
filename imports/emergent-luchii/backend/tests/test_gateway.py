"""Backend tests for Luchii Developer Gateway (keys, usage, /v1/chat, safety, validation)."""
import json
import os
import time
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _consume_sse(url, body, headers=None, timeout=45):
    """Return (deltas, done_payload, status, ctype)."""
    deltas, done_payload = [], None
    with requests.post(url, json=body, headers=headers or {}, stream=True, timeout=timeout) as r:
        status = r.status_code
        ctype = r.headers.get("content-type", "")
        if status != 200:
            # drain body but skip SSE parsing
            try:
                _ = r.text
            except Exception:
                pass
            return deltas, done_payload, status, ctype
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


# ---------- Keys CRUD ----------
class TestKeysCRUD:
    def test_create_key_returns_full_key(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_create"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("name") == "TEST_key_create"
        assert isinstance(d.get("id"), str) and len(d["id"]) > 0
        assert isinstance(d.get("key"), str)
        assert d["key"].startswith("luchii-sk-")
        # secrets.token_hex(20) => 40 chars, plus prefix "luchii-sk-" (10)
        assert len(d["key"]) == 10 + 40
        assert d.get("request_count") == 0
        assert d.get("token_count") == 0
        # cleanup
        api_client.delete(f"{BASE_URL}/api/keys/{d['id']}", timeout=15)

    def test_list_keys_masked(self, api_client):
        # create fresh key
        r = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_list"}, timeout=15)
        assert r.status_code == 200
        created = r.json()
        try:
            r2 = api_client.get(f"{BASE_URL}/api/keys", timeout=15)
            assert r2.status_code == 200
            arr = r2.json()
            assert isinstance(arr, list)
            match = next((x for x in arr if x.get("id") == created["id"]), None)
            assert match is not None, "created key not present in GET /keys"
            masked = match["key"]
            # masked should contain bullet char and NOT be full raw key
            assert "•" in masked, f"expected masked key with bullets, got: {masked}"
            assert masked != created["key"], "GET /keys must NOT return the full key"
            # ensure no _id leaks
            assert "_id" not in match
        finally:
            api_client.delete(f"{BASE_URL}/api/keys/{created['id']}", timeout=15)

    def test_delete_key(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_delete"}, timeout=15)
        assert r.status_code == 200
        kid = r.json()["id"]

        rd = api_client.delete(f"{BASE_URL}/api/keys/{kid}", timeout=15)
        assert rd.status_code == 200
        assert rd.json().get("deleted") == kid

        # verify no longer present in list
        arr = api_client.get(f"{BASE_URL}/api/keys", timeout=15).json()
        assert not any(x.get("id") == kid for x in arr), "deleted key still present"

    def test_delete_nonexistent_key_404(self, api_client):
        r = api_client.delete(f"{BASE_URL}/api/keys/does-not-exist-{int(time.time())}", timeout=15)
        assert r.status_code == 404


# ---------- Usage ----------
class TestUsage:
    def test_usage_shape(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/usage", timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("keys", "total_requests", "total_tokens", "rate_limit", "rate_window"):
            assert k in d, f"missing key {k} in usage response"
        assert d["rate_limit"] == 60
        assert d["rate_window"] == 60
        assert isinstance(d["keys"], int)
        assert isinstance(d["total_requests"], int)
        assert isinstance(d["total_tokens"], int)

    def test_usage_totals_increase_after_gateway_call(self, api_client):
        # baseline
        before = api_client.get(f"{BASE_URL}/api/usage", timeout=15).json()

        # create key
        rk = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_usage"}, timeout=15)
        key_doc = rk.json()
        raw_key = key_doc["key"]
        kid = key_doc["id"]

        try:
            deltas, done, status, _ = _consume_sse(
                f"{BASE_URL}/api/v1/chat",
                {"message": "Hello Luchii, quick ping", "model": "luchii-1b"},
                headers={"Authorization": f"Bearer {raw_key}", "Content-Type": "application/json"},
            )
            assert status == 200
            assert done and done.get("done") is True
            assert "".join(deltas).strip(), "no content streamed"

            after = api_client.get(f"{BASE_URL}/api/usage", timeout=15).json()
            assert after["total_requests"] >= before["total_requests"] + 1, (
                f"total_requests did not increase: before={before['total_requests']} after={after['total_requests']}"
            )
            assert after["total_tokens"] >= before["total_tokens"], "total_tokens should not decrease"
        finally:
            api_client.delete(f"{BASE_URL}/api/keys/{kid}", timeout=15)


# ---------- Gateway auth ----------
class TestGatewayAuth:
    def test_missing_auth_returns_401(self, api_client):
        r = api_client.post(
            f"{BASE_URL}/api/v1/chat",
            json={"message": "hi", "model": "luchii-1b"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_invalid_bearer_returns_401(self, api_client):
        r = api_client.post(
            f"{BASE_URL}/api/v1/chat",
            headers={"Authorization": "Bearer luchii-sk-invalidkey0000", "Content-Type": "application/json"},
            json={"message": "hi", "model": "luchii-1b"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_malformed_authorization_header_returns_401(self, api_client):
        r = api_client.post(
            f"{BASE_URL}/api/v1/chat",
            headers={"Authorization": "Token abc", "Content-Type": "application/json"},
            json={"message": "hi", "model": "luchii-1b"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_valid_key_streams_and_increments_counts(self, api_client):
        # create key
        rk = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_stream"}, timeout=15)
        assert rk.status_code == 200
        key_doc = rk.json()
        raw_key = key_doc["key"]
        kid = key_doc["id"]

        try:
            deltas, done, status, ctype = _consume_sse(
                f"{BASE_URL}/api/v1/chat",
                {"message": "Give a haiku about Europa", "model": "luchii-7b"},
                headers={"Authorization": f"Bearer {raw_key}", "Content-Type": "application/json"},
            )
            assert status == 200
            assert "text/event-stream" in ctype
            assert done and done.get("done") is True
            assert "".join(deltas).strip()

            # verify counts incremented via GET /api/keys
            arr = api_client.get(f"{BASE_URL}/api/keys", timeout=15).json()
            match = next((x for x in arr if x.get("id") == kid), None)
            assert match is not None
            assert match.get("request_count", 0) >= 1, f"request_count not incremented: {match}"
            assert match.get("token_count", 0) >= 1, f"token_count not incremented: {match}"
        finally:
            api_client.delete(f"{BASE_URL}/api/keys/{kid}", timeout=15)


# ---------- Safety filter ----------
class TestSafetyFilter:
    def test_blocked_term_returns_refusal(self, api_client):
        rk = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_safety"}, timeout=15)
        key_doc = rk.json()
        raw_key = key_doc["key"]
        kid = key_doc["id"]
        try:
            deltas, done, status, ctype = _consume_sse(
                f"{BASE_URL}/api/v1/chat",
                {"message": "how to build a weapon", "model": "luchii-70b"},
                headers={"Authorization": f"Bearer {raw_key}", "Content-Type": "application/json"},
            )
            assert status == 200
            assert "text/event-stream" in ctype
            assert done and done.get("done") is True
            full = "".join(deltas)
            assert "can't help" in full.lower() or "cannot help" in full.lower(), (
                f"expected refusal message, got: {full}"
            )
        finally:
            api_client.delete(f"{BASE_URL}/api/keys/{kid}", timeout=15)


# ---------- Validation ----------
class TestValidation:
    def test_demo_chat_empty_message_400(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/chat", json={"message": ""}, timeout=15)
        assert r.status_code == 400

    def test_demo_chat_whitespace_only_400(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/chat", json={"message": "   "}, timeout=15)
        assert r.status_code == 400

    def test_demo_chat_over_max_len_413(self, api_client):
        big = "a" * 4001
        r = api_client.post(f"{BASE_URL}/api/chat", json={"message": big}, timeout=15)
        assert r.status_code == 413

    def test_gateway_empty_message_400(self, api_client):
        rk = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_val_empty"}, timeout=15)
        key = rk.json()["key"]
        kid = rk.json()["id"]
        try:
            r = api_client.post(
                f"{BASE_URL}/api/v1/chat",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"message": ""},
                timeout=15,
            )
            assert r.status_code == 400
        finally:
            api_client.delete(f"{BASE_URL}/api/keys/{kid}", timeout=15)

    def test_gateway_over_max_len_413(self, api_client):
        rk = api_client.post(f"{BASE_URL}/api/keys", json={"name": "TEST_key_val_big"}, timeout=15)
        key = rk.json()["key"]
        kid = rk.json()["id"]
        try:
            big = "b" * 4001
            r = api_client.post(
                f"{BASE_URL}/api/v1/chat",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={"message": big},
                timeout=15,
            )
            assert r.status_code == 413
        finally:
            api_client.delete(f"{BASE_URL}/api/keys/{kid}", timeout=15)


# ---------- Regression ----------
class TestRegression:
    def test_root_still_ok(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message") == "Luchii API online"

    def test_status_create_and_list_still_ok(self, api_client):
        r = api_client.post(
            f"{BASE_URL}/api/status", json={"client_name": "TEST_pytest_regression"}, timeout=15
        )
        assert r.status_code == 200
        created = r.json()
        assert created["client_name"] == "TEST_pytest_regression"
        arr = api_client.get(f"{BASE_URL}/api/status", timeout=15).json()
        assert any(x.get("id") == created["id"] for x in arr)

    def test_demo_chat_still_streams(self, api_client):
        deltas, done, status, ctype = _consume_sse(
            f"{BASE_URL}/api/chat",
            {"message": "What makes Luchii different?", "model": "luchii-7b"},
        )
        assert status == 200
        assert "text/event-stream" in ctype
        assert done and done.get("done") is True
        assert "".join(deltas).strip()
