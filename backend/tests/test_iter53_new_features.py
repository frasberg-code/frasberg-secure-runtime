"""Iteration 53 — API Key Forge permissions matrix, key test endpoint, Studio jobs, Engine v2 video contract."""
import os
import time

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Admin login failed {r.status_code}: {r.text[:300]}")
    return s


@pytest.fixture(scope="module")
def created_keys():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(client, created_keys):
    yield
    for kid in created_keys:
        client.delete(f"{API}/keys/{kid}", timeout=30)


# ---------------- API Keys: permission matrix ----------------
class TestKeyForge:
    def test_create_key_with_permissions(self, client, created_keys):
        r = client.post(f"{API}/keys", json={
            "name": "TEST_iter53_key",
            "permissions": {"models": "read", "text_to_speech": "access"},
            "auto_disable_if_leaked": True,
            "workspace_name": "Frasberg HQ",
        }, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        created_keys.append(d["id"])
        assert d["key"].startswith("luchii-sk-")
        assert d["status"] == "active"
        assert d["auto_disable_if_leaked"] is True
        assert d["workspace_name"] == "Frasberg HQ"
        perms = d["permissions"]
        assert perms["models"] == "read"
        assert perms["text_to_speech"] == "access"
        # all 26 matrix keys present, unspecified default to no_access
        assert perms["billing"] == "no_access"
        assert len(perms) >= 20
        assert "_id" not in d

    def test_unknown_permission_key_fk003(self, client):
        r = client.post(f"{API}/keys", json={"name": "TEST_bad", "permissions": {"nope": "read"}}, timeout=30)
        assert r.status_code == 422
        assert r.json()["detail"]["code"] == "FK-003"

    def test_invalid_level_fk002(self, client):
        r = client.post(f"{API}/keys", json={"name": "TEST_bad", "permissions": {"models": "superuser"}}, timeout=30)
        assert r.status_code == 422
        assert r.json()["detail"]["code"] == "FK-002"

    def test_empty_name_fk009(self, client):
        r = client.post(f"{API}/keys", json={"name": "   ", "permissions": {}}, timeout=30)
        assert r.status_code == 422
        assert r.json()["detail"]["code"] == "FK-009"

    def test_key_test_endpoint_pass_and_denied(self, client, created_keys):
        r = client.post(f"{API}/keys", json={
            "name": "TEST_iter53_partial",
            "permissions": {"models": "read", "text_to_speech": "access"},
        }, timeout=30)
        assert r.status_code == 200
        kid = r.json()["id"]
        created_keys.append(kid)
        t = client.post(f"{API}/keys/{kid}/test", timeout=30)
        assert t.status_code == 200, t.text[:300]
        data = t.json()
        assert data["gateway"] == "https://api.frasberg.com"
        by_route = {x["route"]: x for x in data["results"]}
        assert by_route["GET /llm/models"]["status"] == "pass"
        assert by_route["POST /audio/tts"]["status"] == "pass"
        denied = by_route["POST /agents/run"]
        assert denied["status"] == "denied"
        assert denied["error"]["code"] == "FL-403"
        assert denied["required_permission"] == "frasberg_agents:access"

    def test_key_test_unknown_key_404(self, client):
        r = client.post(f"{API}/keys/does-not-exist/test", timeout=30)
        assert r.status_code == 404
        assert r.json()["detail"]["code"] == "FK-005"

    def test_list_keys_masked_and_revoke(self, client):
        r = client.post(f"{API}/keys", json={"name": "TEST_iter53_revoke", "permissions": {}}, timeout=30)
        kid = r.json()["id"]
        lst = client.get(f"{API}/keys", timeout=30)
        assert lst.status_code == 200
        keys = lst.json()
        mine = [k for k in keys if k["id"] == kid]
        assert mine, "created key not listed"
        assert "\u2022" in mine[0]["key"], f"key not masked: {mine[0]['key']}"
        d = client.delete(f"{API}/keys/{kid}", timeout=30)
        assert d.status_code == 200
        again = client.get(f"{API}/keys", timeout=30).json()
        assert not [k for k in again if k["id"] == kid]

    def test_keys_requires_auth(self):
        r = requests.post(f"{API}/keys", json={"name": "x"}, timeout=30)
        assert r.status_code in (401, 403)


# ---------------- Creative Studio jobs ----------------
class TestStudio:
    def test_music_job_completed(self, client):
        r = client.post(f"{API}/studio/generate", json={"tool": "music", "prompt": "TEST_epic score"}, timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["status"] == "completed"
        assert d["cluster"] == "Music Cluster"
        assert d["output_url"].startswith("https://cdn.frasberg.com/audio/")
        assert isinstance(d["latency_ms"], int) and d["latency_ms"] > 0
        assert d["duration_sec"] > 0
        assert d["format"] == "wav"
        assert "_id" not in d

    def test_unknown_tool_fk003(self, client):
        r = client.post(f"{API}/studio/generate", json={"tool": "hologram", "prompt": "x"}, timeout=30)
        assert r.status_code == 422
        assert r.json()["detail"]["code"] == "FK-003"

    def test_empty_prompt_400(self, client):
        r = client.post(f"{API}/studio/generate", json={"tool": "music", "prompt": "  "}, timeout=30)
        assert r.status_code == 400

    def test_jobs_list(self, client):
        r = client.get(f"{API}/studio/jobs", timeout=30)
        assert r.status_code == 200
        jobs = r.json()
        assert isinstance(jobs, list) and jobs
        assert any(j["prompt"] == "TEST_epic score" for j in jobs)
        assert all("_id" not in j for j in jobs)

    def test_studio_requires_auth(self):
        r = requests.post(f"{API}/studio/generate", json={"tool": "music", "prompt": "x"}, timeout=30)
        assert r.status_code in (401, 403)


# ---------------- Frasberg Engine v2 video contract ----------------
VIDEO_BODY = {"prompt": "TEST_a neon skyline at dusk", "duration": 5, "model": "frasberg-engine",
              "ratio": "16:9", "motion": "medium", "guidance_scale": 7, "seed": None, "output_format": "mp4"}


class TestVideoEngineV2:
    def test_create_task_and_poll_to_completed(self, client):
        r = client.post(f"{API}/generate/video", json=VIDEO_BODY, timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["status"] == "queued"
        assert d["task_id"].startswith("task_")
        assert isinstance(d["eta_seconds"], int) and d["eta_seconds"] > 0
        assert d["region"] == "us-west"
        assert d["gpu_class"] == "gpu-medium"
        tid, eta = d["task_id"], d["eta_seconds"]

        first = client.get(f"{API}/generate/video/task/{tid}", timeout=30)
        assert first.status_code == 200
        assert first.json()["status"] == "running"

        deadline = time.time() + eta + 20
        status = "running"
        payload = {}
        while time.time() < deadline:
            time.sleep(3)
            p = client.get(f"{API}/generate/video/task/{tid}", timeout=30)
            assert p.status_code == 200
            payload = p.json()
            status = payload["status"]
            if status == "completed":
                break
        assert status == "completed", f"task never completed (last={payload})"
        assert payload["video_url"] == f"https://cdn.frasberg.com/tasks/{tid}/output.mp4"

    def test_cancel_task(self, client):
        r = client.post(f"{API}/generate/video", json={**VIDEO_BODY, "duration": 60}, timeout=60)
        tid = r.json()["task_id"]
        c = client.post(f"{API}/generate/video/task/{tid}/cancel", timeout=30)
        assert c.status_code == 200
        assert c.json()["status"] == "cancelled"
        assert client.get(f"{API}/generate/video/task/{tid}", timeout=30).json()["status"] == "cancelled"
        # second cancel conflicts
        assert client.post(f"{API}/generate/video/task/{tid}/cancel", timeout=30).status_code == 409

    def test_invalid_ratio_400(self, client):
        r = client.post(f"{API}/generate/video", json={**VIDEO_BODY, "ratio": "4:3"}, timeout=30)
        assert r.status_code == 400
        assert r.json()["detail"]["field"] == "ratio"

    def test_invalid_motion_400(self, client):
        r = client.post(f"{API}/generate/video", json={**VIDEO_BODY, "motion": "turbo"}, timeout=30)
        assert r.status_code == 400

    def test_empty_prompt_400(self, client):
        r = client.post(f"{API}/generate/video", json={**VIDEO_BODY, "prompt": " "}, timeout=30)
        assert r.status_code == 400

    def test_unknown_task_404(self, client):
        assert client.get(f"{API}/generate/video/task/task_nope", timeout=30).status_code == 404

    def test_video_requires_auth(self):
        r = requests.post(f"{API}/generate/video", json=VIDEO_BODY, timeout=30)
        assert r.status_code in (401, 403)
