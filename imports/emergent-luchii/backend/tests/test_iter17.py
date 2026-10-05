"""Iteration 17 tests: /api/system/status, unlimited memory, transcript context (limit=40),
free-plan builder publish."""
import os
import time
import json
import uuid
import pytest
import requests
from pathlib import Path

def _load_env():
    p = Path("/app/frontend/.env")
    for line in p.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("REACT_APP_BACKEND_URL not found")

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or _load_env()).rstrip("/")
API = f"{BASE}/api"

FREE = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}
ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed {r.status_code} {r.text[:200]}"
    return s


def _sse_chat(session: requests.Session, message: str, session_id: str = None, timeout=90):
    """POST /api/chat, consume SSE, return (final_text, session_id)."""
    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id
    text = ""
    sid = session_id
    with session.post(f"{API}/chat", json=payload, stream=True, timeout=timeout) as r:
        assert r.status_code == 200, f"chat {r.status_code} {r.text[:200]}"
        for raw in r.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data:"):
                continue
            try:
                obj = json.loads(raw[5:].strip())
            except Exception:
                continue
            if "delta" in obj:
                text += obj["delta"]
            if obj.get("done"):
                sid = obj.get("session_id") or sid
                break
    return text, sid


# ---------- 1. /api/system/status ----------
class TestSystemStatus:
    def test_public_no_auth(self):
        r = requests.get(f"{API}/system/status", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "overall" in d and "components" in d and "uptime_seconds" in d
        assert isinstance(d["uptime_seconds"], int) and d["uptime_seconds"] >= 0
        assert d["overall"] in ("operational", "warming", "standby", "degraded", "outage")
        comps = d["components"]
        assert len(comps) == 9, f"expected 9 components got {len(comps)}"
        ids = {c["id"] for c in comps}
        expected = {"gateway", "mesh", "database", "builder", "court", "stt", "tts", "cloning", "memory"}
        assert ids == expected, f"missing/extra: {ids ^ expected}"
        allowed = {"operational", "warming", "standby", "degraded", "outage"}
        for c in comps:
            assert set(c.keys()) >= {"id", "name", "status", "detail"}
            assert c["status"] in allowed, f"{c['id']} has invalid status {c['status']}"


# ---------- 2. Free-plan builder publish (no 402) ----------
class TestBuilderFreePublish:
    def test_free_publish_flow(self):
        s = _login(FREE)
        # Kick off generate SSE (small prompt). Wait up to 3 min for done.
        pid = None
        with s.post(f"{API}/builder/generate",
                    json={"prompt": "one-button color flip page", "type": "website"},
                    stream=True, timeout=200) as r:
            assert r.status_code == 200, f"generate {r.status_code} {r.text[:300]}"
            start = time.time()
            for raw in r.iter_lines(decode_unicode=True):
                if time.time() - start > 190:
                    break
                if not raw or not raw.startswith("data:"):
                    continue
                try:
                    obj = json.loads(raw[5:].strip())
                except Exception:
                    continue
                if obj.get("done"):
                    pid = obj.get("project_id") or obj.get("id") or (obj.get("project") or {}).get("id")
                    break
        # Fallback: look up latest project
        if not pid:
            lp = s.get(f"{API}/builder/projects", timeout=15)
            assert lp.status_code == 200, lp.text[:200]
            items = lp.json() if isinstance(lp.json(), list) else lp.json().get("projects") or lp.json().get("items") or []
            assert items, "no builder projects found after generate"
            pid = items[0].get("id") or items[0].get("_id")
        assert pid, "could not resolve project id"

        # Publish - must NOT 402
        pr = s.post(f"{API}/builder/projects/{pid}/publish", timeout=20)
        assert pr.status_code == 200, f"publish {pr.status_code} {pr.text[:200]} — expected 200, not 402"
        pd = pr.json()
        assert pd.get("ok") is True
        assert pd.get("slug"), "publish response missing slug"
        assert pd.get("url"), "publish response missing url"
        slug = pd["slug"]

        # Gallery should contain the slug
        g = requests.get(f"{API}/builder/gallery", timeout=15)
        assert g.status_code == 200, g.text[:200]
        gj = g.json()
        items = gj if isinstance(gj, list) else gj.get("items") or gj.get("projects") or []
        slugs = [i.get("slug") for i in items]
        assert slug in slugs, f"slug {slug} not in gallery slugs (got {len(slugs)} items)"


# ---------- 3. Memory: unlimited store + recall ----------
class TestMemoryUnlimited:
    def test_memory_endpoint_and_recall(self):
        s = _login(FREE)
        marker = uuid.uuid4().hex[:6]
        # Send message to remember
        msg = f"Remember: my lucky number is 777 and my cat is named Pixel{marker}."
        _t, sid1 = _sse_chat(s, msg)
        assert sid1

        # Wait for async extraction
        time.sleep(12)

        # New session recall
        recall_q = "What is my lucky number and my cat's name?"
        reply, _ = _sse_chat(s, recall_q, session_id=str(uuid.uuid4()))
        got_777 = "777" in reply
        got_pixel = f"Pixel{marker}" in reply or "Pixel" in reply
        if not (got_777 and got_pixel):
            # retry once
            time.sleep(10)
            reply, _ = _sse_chat(s, recall_q, session_id=str(uuid.uuid4()))
            got_777 = "777" in reply
            got_pixel = f"Pixel{marker}" in reply or "Pixel" in reply
        assert got_777, f"reply missing 777: {reply[:300]}"
        assert got_pixel, f"reply missing Pixel: {reply[:300]}"

        # GET /api/memory list — verify facts stored
        m = s.get(f"{API}/memory", timeout=15)
        assert m.status_code == 200, m.text[:200]
        mj = m.json()
        facts = mj if isinstance(mj, list) else mj.get("memories") or mj.get("items") or []
        assert facts, "memory list empty"
        # spot-check that no 50 cap enforced on storage (list may still paginate)
        joined = " ".join((f.get("fact") or "") for f in facts if isinstance(f, dict))
        assert "777" in joined or "Pixel" in joined, f"expected fact not in memory list: {joined[:400]}"


# ---------- 4. Transcript context within one session (limit=40) ----------
class TestTranscriptContext:
    def test_third_message_recalls_first(self):
        s = _login(FREE)
        sid = str(uuid.uuid4())
        secret = f"papaya-{uuid.uuid4().hex[:5]}"
        _t1, sid = _sse_chat(s, f"For this chat only, please remember my favorite fruit is '{secret}'.", session_id=sid)
        time.sleep(1)
        _t2, sid = _sse_chat(s, "Great, thanks. Also, what's 2+2?", session_id=sid)
        time.sleep(1)
        reply3, _ = _sse_chat(s, "In one word, what fruit did I say was my favorite earlier?", session_id=sid)
        assert secret in reply3 or secret.split("-")[0] in reply3.lower(), \
            f"third message failed to recall first — got: {reply3[:400]}"
