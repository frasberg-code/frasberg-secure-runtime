"""Tests for agent persona routing on POST /api/chat."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"


def _stream_text(payload, timeout=90):
    """POST /api/chat and concatenate all delta content from SSE stream."""
    import json as _json
    r = requests.post(f"{API}/chat", json=payload, stream=True, timeout=timeout)
    assert r.status_code == 200, f"status {r.status_code}: {r.text[:200]}"
    buf = []
    for line in r.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        try:
            data = _json.loads(line[5:].strip())
        except Exception:
            continue
        if "delta" in data:
            buf.append(str(data["delta"]))
        if data.get("done"):
            break
    return "".join(buf)


def test_agent_none_streams():
    txt = _stream_text({"message": "hello there"})
    assert len(txt) > 0


def test_agent_architect_plans():
    txt = _stream_text({"message": "design a todo app backend", "agent": "architect"}).lower()
    assert len(txt) > 40
    # Should mention planning/architecture concepts rather than just dumping code
    planning_keywords = ["requirement", "architect", "design", "plan", "data model",
                         "api", "service", "trade-off", "tradeoff", "risk", "endpoint",
                         "schema", "diagram"]
    hits = sum(1 for k in planning_keywords if k in txt)
    assert hits >= 2, f"Architect reply missing planning language. hits={hits}, txt={txt[:400]}"


def test_agent_debugger_traces():
    err_msg = ("I'm getting TypeError: 'NoneType' object is not subscriptable "
               "at line 42 of app.py when user['name'] is accessed. Trace the root cause and give a minimal fix.")
    txt = _stream_text({"message": err_msg, "agent": "debugger"}).lower()
    assert len(txt) > 40
    debug_keywords = ["root cause", "nonetype", "none", "fix", "traceback",
                      "trace", "line", "check", "guard", "if user"]
    hits = sum(1 for k in debug_keywords if k in txt)
    assert hits >= 2, f"Debugger reply missing debug language. hits={hits}, txt={txt[:400]}"


def test_agent_architect_vs_debugger_differ():
    a = _stream_text({"message": "design a todo app backend", "agent": "architect"})
    d = _stream_text({"message": "design a todo app backend", "agent": "debugger"})
    assert a != d
    # They should be materially different (>30% different chars) — coarse check via length or hash
    assert abs(len(a) - len(d)) > 0 or a[:100] != d[:100]
