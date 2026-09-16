"""
Iteration 59 — Workspace projects API + Builder EDIT MODE regression tests.

Covers:
  * POST/GET/PUT/DELETE /api/workspace/projects  (cookie auth, admin)
  * 401 for unauthenticated
  * POST /api/builder/generate (SSE) — CREATE mode → project id
  * POST /api/builder/generate (SSE, same project_id) — EDIT MODE emits edit_summary,
      ops_applied >= 1, and the persisted html contains the edit while preserving
      the rest of the page (no rewrite).
"""
import os
import json
import time

import pytest
import requests

def _load_base_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        v = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
    if not v:
        raise RuntimeError("REACT_APP_BACKEND_URL not set")
    return v.rstrip("/")


BASE_URL = _load_base_url()
ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text[:200]}"
    return s


# ── Workspace projects CRUD ────────────────────────────────────────────────
class TestWorkspaceProjects:
    def test_unauth_401(self):
        r = requests.get(f"{BASE_URL}/api/workspace/projects", timeout=15)
        assert r.status_code == 401, f"expected 401 got {r.status_code}"

    def test_crud_flow(self, admin_session):
        # CREATE
        r = admin_session.post(f"{BASE_URL}/api/workspace/projects",
                               json={"agent": "builder", "name": "TEST_QA Project"}, timeout=20)
        assert r.status_code == 200, r.text
        proj = r.json()
        assert proj["name"] == "TEST_QA Project"
        assert proj["agent"] == "builder"
        assert proj["has_build"] is False
        assert proj["message_count"] == 0
        pid = proj["id"]
        assert isinstance(pid, str) and len(pid) > 8

        # LIST — must include our project with has_build / message_count
        r = admin_session.get(f"{BASE_URL}/api/workspace/projects?agent=builder", timeout=20)
        assert r.status_code == 200
        projects = r.json().get("projects", [])
        match = next((p for p in projects if p["id"] == pid), None)
        assert match is not None, "created project not returned in list"
        assert "has_build" in match and "message_count" in match

        # SAVE (PUT)
        html = "<!DOCTYPE html><html><body><h1>Hello Alex</h1></body></html>"
        msgs = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "ok"}]
        r = admin_session.put(f"{BASE_URL}/api/workspace/projects/{pid}",
                              json={"name": "TEST_QA Project v2", "messages": msgs,
                                    "html": html, "model": "luchii-70b"}, timeout=20)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # GET — verify persisted state
        r = admin_session.get(f"{BASE_URL}/api/workspace/projects/{pid}", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_QA Project v2"
        assert d["html"] == html
        assert d["model"] == "luchii-70b"
        assert len(d["messages"]) == 2
        assert d["has_build"] is True
        assert d["message_count"] == 2

        # DELETE
        r = admin_session.delete(f"{BASE_URL}/api/workspace/projects/{pid}", timeout=20)
        assert r.status_code == 200
        # GET now 404
        r = admin_session.get(f"{BASE_URL}/api/workspace/projects/{pid}", timeout=20)
        assert r.status_code == 404


# ── Builder EDIT MODE via SSE ──────────────────────────────────────────────
def _consume_sse(session, prompt, project_id=None, timeout=90):
    """POST to /api/builder/generate and return list[dict] of SSE payloads."""
    body = {"prompt": prompt, "type": "website"}
    if project_id:
        body["project_id"] = project_id
    events = []
    with session.post(f"{BASE_URL}/api/builder/generate", json=body,
                      stream=True, timeout=timeout) as r:
        assert r.status_code == 200, f"builder generate failed {r.status_code} {r.text[:300]}"
        start = time.time()
        for raw in r.iter_lines(decode_unicode=True):
            if raw is None:
                continue
            if not raw:
                continue
            if raw.startswith("data:"):
                try:
                    events.append(json.loads(raw[5:].strip()))
                except Exception:
                    pass
            if events and events[-1].get("done"):
                break
            if events and events[-1].get("error"):
                break
            if time.time() - start > timeout:
                break
    return events


class TestBuilderEditMode:
    def test_create_then_edit(self, admin_session):
        # CREATE
        create_events = _consume_sse(
            admin_session,
            "A tiny personal bio page for Alex with a heading and one paragraph.",
            timeout=120,
        )
        # Expect delta events + done
        deltas = [e for e in create_events if "delta" in e]
        done = next((e for e in create_events if e.get("done")), None)
        assert done is not None, f"no done event; events={create_events[:5]}"
        assert deltas, "no delta events on CREATE (expected streaming rewrite)"
        pid = done["project"]["id"]

        # Fetch initial html
        r = admin_session.get(f"{BASE_URL}/api/builder/projects/{pid}", timeout=20)
        assert r.status_code == 200
        original_html = r.json()["html"]
        assert "Alex" in original_html, "original build must contain 'Alex'"
        original_len = len(original_html)

        # EDIT — same project_id
        edit_events = _consume_sse(
            admin_session,
            "Change the name Alex to Jordan everywhere on the page.",
            project_id=pid,
            timeout=120,
        )
        statuses = [e for e in edit_events if "edit_status" in e]
        summary_ev = next((e for e in edit_events if "edit_summary" in e), None)
        edit_deltas = [e for e in edit_events if "delta" in e]

        assert statuses, f"expected edit_status event; got {edit_events[:5]}"

        # Retry-once policy — LLM non-determinism may return full html on first try.
        if summary_ev is None:
            retry_events = _consume_sse(
                admin_session,
                "Rename Alex to Jordan on the page (targeted edit only).",
                project_id=pid,
                timeout=120,
            )
            summary_ev = next((e for e in retry_events if "edit_summary" in e), None)
            edit_deltas = [e for e in retry_events if "delta" in e]

        assert summary_ev is not None, "EDIT MODE never produced edit_summary across 2 attempts"
        assert summary_ev.get("ops_applied", 0) >= 1
        # Edit path should NOT emit a full-rewrite delta stream
        assert len(edit_deltas) == 0, "edit_summary path leaked delta rewrite events"

        # Verify persisted html now contains Jordan and roughly the same size
        r = admin_session.get(f"{BASE_URL}/api/builder/projects/{pid}", timeout=20)
        assert r.status_code == 200
        new_html = r.json()["html"]
        assert "Jordan" in new_html
        assert "Alex" not in new_html or new_html.count("Alex") < original_html.count("Alex")
        # Rest of page preserved — size should be within 30% of original (edit, not rewrite)
        ratio = len(new_html) / max(original_len, 1)
        assert 0.7 <= ratio <= 1.3, f"html size ratio {ratio:.2f} suggests full rewrite"

        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/builder/projects/{pid}", timeout=20)
