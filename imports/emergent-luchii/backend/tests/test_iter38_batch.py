"""Iteration 38 backend tests: GitHub OAuth endpoints + fork protection."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ai-gateway-demo.preview.emergentagent.com").rstrip("/")


def test_github_status_unconfigured():
    r = requests.get(f"{BASE_URL}/api/auth/github/status")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("configured") is False
    assert data.get("linked") is False


def test_github_login_returns_503():
    r = requests.get(f"{BASE_URL}/api/auth/github/login", allow_redirects=False)
    assert r.status_code == 503, f"expected 503, got {r.status_code}: {r.text}"
    body = r.json()
    detail = body.get("detail", "")
    assert "GITHUB_CLIENT_ID" in detail, f"detail missing GITHUB_CLIENT_ID: {detail}"


def test_github_fork_requires_auth():
    r = requests.post(f"{BASE_URL}/api/github/fork", json={"owner": "octocat", "repo": "Hello-World"})
    assert r.status_code in (401, 403), f"expected 401/403 unauth, got {r.status_code}: {r.text}"
