import os
import base64
import hashlib
import secrets
import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet
from fastapi import APIRouter, Request, Response, HTTPException, Cookie
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

import auth as auth_module

db = None
router = APIRouter()

GITHUB_HEADERS = {"Accept": "application/vnd.github+json"}


def setup(database):
    global db
    db = database


def _cipher() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(os.environ["JWT_SECRET"].encode()).digest())
    return Fernet(key)


def _client_id() -> str:
    return os.environ.get("GITHUB_CLIENT_ID", "").strip()


def _client_secret() -> str:
    return os.environ.get("GITHUB_CLIENT_SECRET", "").strip()


def _redirect_uri(request: Request) -> str:
    configured = os.environ.get("GITHUB_REDIRECT_URI", "").strip()
    if configured:
        return configured
    proto = request.headers.get("x-forwarded-proto", "https")
    host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    return f"{proto}://{host}/api/auth/github/callback"


@router.get("/auth/github/status")
async def github_status(request: Request):
    has_id = bool(_client_id())
    has_secret = bool(_client_secret())
    linked = False
    login = None
    try:
        user = await auth_module.get_current_user(request)
        full = await db.users.find_one({"id": user["id"]})
        linked = bool(full and full.get("github_id"))
        login = full.get("github_login") if full else None
    except HTTPException:
        pass
    return {"configured": has_id and has_secret, "has_client_id": has_id,
            "has_client_secret": has_secret, "linked": linked, "github_login": login}


@router.get("/auth/github/login")
async def github_login(request: Request):
    if not _client_id():
        raise HTTPException(status_code=503, detail="GitHub login is not configured yet — add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.")
    if not _client_secret():
        raise HTTPException(status_code=503, detail="Almost there — GITHUB_CLIENT_ID is set, but GITHUB_CLIENT_SECRET is missing. Generate a client secret in your GitHub App settings and add it.")
    state = secrets.token_urlsafe(32)
    query = urlencode({
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(request),
        "scope": "read:user user:email repo",
        "state": state,
    })
    resp = RedirectResponse(f"https://github.com/login/oauth/authorize?{query}")
    resp.set_cookie("gh_oauth_state", state, httponly=True, secure=True, samesite="lax", max_age=600, path="/")
    return resp


@router.get("/auth/github/callback")
async def github_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    gh_oauth_state: str | None = Cookie(default=None),
):
    if error:
        return RedirectResponse(f"/auth?github_error={error}")
    if not code or not state or not gh_oauth_state or not secrets.compare_digest(state, gh_oauth_state):
        return RedirectResponse("/auth?github_error=invalid_state")

    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "code": code,
                "redirect_uri": _redirect_uri(request),
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_res.json() if token_res.status_code == 200 else {}
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse("/auth?github_error=token_exchange_failed")

        gh_auth = {**GITHUB_HEADERS, "Authorization": f"Bearer {access_token}"}
        profile_res = await client.get("https://api.github.com/user", headers=gh_auth)
        emails_res = await client.get("https://api.github.com/user/emails", headers=gh_auth)

    if profile_res.status_code != 200:
        return RedirectResponse("/auth?github_error=profile_failed")
    profile = profile_res.json()
    emails = emails_res.json() if emails_res.status_code == 200 else []
    primary = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None) \
        or next((e["email"] for e in emails if e.get("verified")), None) \
        or profile.get("email") or f"{profile['login']}@users.noreply.github.com"
    primary = primary.lower()

    github_id = str(profile["id"])
    encrypted = _cipher().encrypt(access_token.encode()).decode()
    gh_fields = {
        "github_id": github_id,
        "github_login": profile["login"],
        "github_avatar": profile.get("avatar_url"),
        "github_token_encrypted": encrypted,
        "github_linked_at": datetime.now(timezone.utc).isoformat(),
    }

    user = await db.users.find_one({"github_id": github_id}) or await db.users.find_one({"email": primary})
    if user:
        await db.users.update_one({"id": user["id"]}, {"$set": gh_fields})
    else:
        user = {
            "id": str(uuid.uuid4()), "email": primary,
            "name": profile.get("name") or profile["login"],
            "password_hash": auth_module.hash_password(secrets.token_urlsafe(24)),
            "role": "user",
            "plan": "scale" if primary.endswith(auth_module.TEAM_DOMAIN) else "free",
            "created_at": datetime.now(timezone.utc).isoformat(),
            **gh_fields,
        }
        await db.users.insert_one({**user})

    resp = RedirectResponse("/dashboard?github=connected")
    resp.set_cookie("access_token", auth_module.create_access_token(user["id"], user["email"]),
                    httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    resp.set_cookie("refresh_token", auth_module.create_refresh_token(user["id"]),
                    httponly=True, secure=True, samesite="none", max_age=2592000, path="/")
    resp.delete_cookie("gh_oauth_state", path="/")
    return resp


class ForkBody(BaseModel):
    owner: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    repo: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")


@router.post("/github/fork")
async def fork_repo(body: ForkBody, request: Request):
    user = await auth_module.get_current_user(request)
    full = await db.users.find_one({"id": user["id"]})
    if not full or not full.get("github_token_encrypted"):
        raise HTTPException(status_code=403, detail="Link your GitHub account first — use Login with GitHub.")
    token = _cipher().decrypt(full["github_token_encrypted"].encode()).decode()
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"https://api.github.com/repos/{body.owner}/{body.repo}/forks",
            headers={**GITHUB_HEADERS, "Authorization": f"Bearer {token}"},
            json={},
        )
    if res.status_code in (401, 403):
        raise HTTPException(status_code=403, detail="GitHub token invalid or lacks permission — re-login with GitHub.")
    if res.status_code == 404:
        raise HTTPException(status_code=404, detail=f"Repository {body.owner}/{body.repo} not found.")
    if res.status_code not in (201, 202):
        raise HTTPException(status_code=502, detail=f"GitHub fork failed ({res.status_code})")
    data = res.json()
    return {"ok": True, "full_name": data.get("full_name"), "html_url": data.get("html_url")}


async def _user_gh_token(request: Request) -> tuple[dict, str]:
    user = await auth_module.get_current_user(request)
    full = await db.users.find_one({"id": user["id"]})
    if not full or not full.get("github_token_encrypted"):
        raise HTTPException(status_code=403, detail="Link your GitHub account first — use Login with GitHub.")
    return full, _cipher().decrypt(full["github_token_encrypted"].encode()).decode()


def _parse_agent(file_name: str, raw: str):
    try:
        if file_name.lower().endswith(".json"):
            import json as json_mod
            parsed = json_mod.loads(raw)
        else:
            import yaml as yaml_mod
            parsed = yaml_mod.safe_load(raw)
        if isinstance(parsed, dict):
            return {
                "file": file_name,
                "id": parsed.get("id"), "name": parsed.get("name"),
                "model": parsed.get("model"), "description": parsed.get("description"),
                "entrypoint": parsed.get("entrypoint"),
                "capabilities": parsed.get("capabilities") or {},
                "env_keys": sorted((parsed.get("env") or {}).keys()),
                "tools": sorted((parsed.get("tools") or {}).keys()),
            }
    except Exception:
        pass
    return {"file": file_name, "error": "Could not parse agent file"}


AGENT_FILES = ("agent.json", "luchii.yaml", "luchii.yml")


async def _fetch_agent_file(client, gh: dict, full_name: str):
    """Fetch and parse the first agent file found at a repo root. Returns agent dict or None."""
    for path in AGENT_FILES:
        res = await client.get(f"https://api.github.com/repos/{full_name}/contents/{path}", headers=gh)
        if res.status_code == 200:
            raw = base64.b64decode(res.json().get("content", "")).decode("utf-8", errors="replace")
            return _parse_agent(path, raw)
    return None


class ImportBody(BaseModel):
    owner: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    repo: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")


@router.post("/github/import")
async def import_repo(body: ImportBody, request: Request):
    """Load a repo's main HTML file (or README) plus agent.json/luchii.yaml so the workspace can edit it with Luchii."""
    _, token = await _user_gh_token(request)
    gh = {**GITHUB_HEADERS, "Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=30) as client:
        listing = await client.get(f"https://api.github.com/repos/{body.owner}/{body.repo}/contents/", headers=gh)
        if listing.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Repository {body.owner}/{body.repo} not found.")
        if listing.status_code != 200:
            raise HTTPException(status_code=502, detail=f"GitHub listing failed ({listing.status_code})")
        files = [f for f in listing.json() if f.get("type") == "file"]
        names = {f["name"].lower(): f for f in files}

        async def fetch_text(entry):
            res = await client.get(entry["url"], headers=gh)
            if res.status_code != 200:
                return None
            return base64.b64decode(res.json().get("content", "")).decode("utf-8", errors="replace")

        # Agent file sync — agent.json or luchii.yaml
        agent = None
        agent_file = names.get("agent.json") or names.get("luchii.yaml") or names.get("luchii.yml")
        if agent_file:
            raw = await fetch_text(agent_file)
            if raw:
                agent = _parse_agent(agent_file["name"], raw)

        target = names.get("index.html") \
            or next((f for n, f in names.items() if n.endswith(".html")), None) \
            or names.get("readme.md")
        if not target and not agent:
            raise HTTPException(status_code=404, detail="No index.html, .html file, README.md, agent.json or luchii.yaml found at the repo root.")
        content = None
        file_name = None
        if target:
            content = await fetch_text(target)
            file_name = target["name"]
            if content and file_name.lower().endswith(".md"):
                content = ("<!doctype html><html><head><meta charset='utf-8'><title>{r}</title>"
                           "<style>body{{font-family:sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6}}</style>"
                           "</head><body><pre style='white-space:pre-wrap'>{c}</pre></body></html>").format(r=body.repo, c=content.replace("<", "&lt;"))
    return {"ok": True, "file": file_name, "repo": f"{body.owner}/{body.repo}",
            "content": (content or "")[:400000] or None, "agent": agent}


SCAFFOLD_FILES = {
    "frasberg.json": '{\n  "regions": ["us-west", "us-east", "eu-central"],\n  "sdk": "luchii",\n  "version": "1.0.0"\n}\n',
    "src/index.ts": 'import { Luchii } from "@frasbergai/sdk";\n\nconsole.log("Frasberg project ready");\n',
}


@router.post("/github/scaffold")
async def scaffold_repo(body: ImportBody, request: Request):
    """Inject Frasberg SDK starter files into a repo the user owns (e.g. their fresh fork)."""
    full, token = await _user_gh_token(request)
    gh = {**GITHUB_HEADERS, "Authorization": f"Bearer {token}"}
    added, skipped = [], []
    async with httpx.AsyncClient(timeout=30) as client:
        for path, content in SCAFFOLD_FILES.items():
            res = await client.put(
                f"https://api.github.com/repos/{body.owner}/{body.repo}/contents/{path}",
                headers=gh,
                json={"message": f"Add Frasberg scaffolding: {path}",
                      "content": base64.b64encode(content.encode()).decode()},
            )
            if res.status_code in (200, 201):
                added.append(path)
            elif res.status_code == 422:
                skipped.append(path)
            elif res.status_code in (401, 403):
                raise HTTPException(status_code=403, detail="Your GitHub token can't write to this repo — scaffold your own fork.")
            elif res.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Repository {body.owner}/{body.repo} not found.")
            else:
                raise HTTPException(status_code=502, detail=f"Scaffold failed on {path} ({res.status_code})")
    return {"ok": True, "added": added, "skipped_existing": skipped,
            "repo_url": f"https://github.com/{body.owner}/{body.repo}"}


@router.get("/github/repos")
async def list_repos(request: Request):
    """List the signed-in user's own GitHub repositories."""
    full, token = await _user_gh_token(request)
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            "https://api.github.com/user/repos?sort=updated&per_page=30&affiliation=owner",
            headers={**GITHUB_HEADERS, "Authorization": f"Bearer {token}"},
        )
    if res.status_code in (401, 403):
        raise HTTPException(status_code=403, detail="GitHub token invalid — re-login with GitHub.")
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail=f"GitHub repos listing failed ({res.status_code})")
    return {"login": full.get("github_login"), "repos": [
        {"name": r["name"], "owner": r["owner"]["login"], "full_name": r["full_name"],
         "description": r.get("description"), "private": r.get("private", False),
         "language": r.get("language"), "updated_at": r.get("updated_at"), "html_url": r.get("html_url")}
        for r in res.json()
    ]}


@router.post("/github/agent-sync")
async def agent_sync(request: Request):
    """Scan the user's repos for agent.json / luchii.yaml (real GitHub API) and sync them into the registry."""
    import asyncio
    full, token = await _user_gh_token(request)
    gh = {**GITHUB_HEADERS, "Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=45) as client:
        res = await client.get(
            "https://api.github.com/user/repos?sort=updated&per_page=30&affiliation=owner", headers=gh)
        if res.status_code in (401, 403):
            raise HTTPException(status_code=403, detail="GitHub token invalid — re-login with GitHub.")
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail=f"GitHub repos listing failed ({res.status_code})")
        repos = res.json()
        results = await asyncio.gather(*[_fetch_agent_file(client, gh, r["full_name"]) for r in repos])
    synced, now = [], datetime.now(timezone.utc).isoformat()
    for repo, agent in zip(repos, results):
        if not agent or agent.get("error"):
            continue
        doc = {"user_id": full["id"], "repo": repo["full_name"], "agent": agent,
               "default_branch": repo.get("default_branch", "main"),
               "synced_at": now, "source": "manual_sync"}
        await db.synced_agents.update_one(
            {"user_id": full["id"], "repo": repo["full_name"]}, {"$set": doc}, upsert=True)
        synced.append({"repo": repo["full_name"], "agent": agent})
    return {"ok": True, "scanned": len(repos), "synced": synced}


@router.get("/github/synced-agents")
async def list_synced_agents(request: Request):
    user = await auth_module.get_current_user(request)
    rows = await db.synced_agents.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("synced_at", -1).to_list(100)
    return {"agents": rows}


class ExportBody(BaseModel):
    owner: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    repo: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.-]+$")
    html: str = Field(min_length=10, max_length=800000)
    path: str = Field(default="index.html", max_length=200)
    message: str = Field(default="Publish from Frasberg Workspace", max_length=200)


@router.post("/github/export")
async def export_to_repo(body: ExportBody, request: Request):
    """Commit the workspace app to a GitHub repo (real API) — creates the repo if it's the user's own and missing."""
    full, token = await _user_gh_token(request)
    gh = {**GITHUB_HEADERS, "Authorization": f"Bearer {token}"}
    created = False
    async with httpx.AsyncClient(timeout=45) as client:
        check = await client.get(f"https://api.github.com/repos/{body.owner}/{body.repo}", headers=gh)
        if check.status_code == 404:
            if body.owner.lower() != (full.get("github_login") or "").lower():
                raise HTTPException(status_code=404, detail=f"Repository {body.owner}/{body.repo} not found.")
            create = await client.post("https://api.github.com/user/repos", headers=gh,
                                       json={"name": body.repo, "description": "Built with Luchii — Frasberg Agent Workspace", "auto_init": False})
            if create.status_code not in (201, 202):
                raise HTTPException(status_code=502, detail=f"Could not create repository ({create.status_code})")
            created = True
        elif check.status_code in (401, 403):
            raise HTTPException(status_code=403, detail="GitHub token invalid or lacks permission — re-login with GitHub.")
        existing = await client.get(f"https://api.github.com/repos/{body.owner}/{body.repo}/contents/{body.path}", headers=gh)
        payload = {"message": body.message, "content": base64.b64encode(body.html.encode()).decode()}
        if existing.status_code == 200:
            payload["sha"] = existing.json().get("sha")
        put = await client.put(f"https://api.github.com/repos/{body.owner}/{body.repo}/contents/{body.path}",
                               headers=gh, json=payload)
    if put.status_code in (401, 403):
        raise HTTPException(status_code=403, detail="Your GitHub token can't write to this repo.")
    if put.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"GitHub commit failed ({put.status_code})")
    data = put.json()
    return {"ok": True, "created_repo": created,
            "repo_url": f"https://github.com/{body.owner}/{body.repo}",
            "commit_url": (data.get("commit") or {}).get("html_url"),
            "file_url": (data.get("content") or {}).get("html_url")}


@router.post("/github/webhook")
async def github_webhook(request: Request):
    """GitHub App webhook ingestion with HMAC SHA-256 signature verification."""
    import hmac as hmac_mod
    secret = os.environ.get("GITHUB_WEBHOOK_SECRET", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Webhook not configured — set GITHUB_WEBHOOK_SECRET.")
    body_bytes = await request.body()
    signature = request.headers.get("x-hub-signature-256", "")
    digest = "sha256=" + hmac_mod.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
    if not hmac_mod.compare_digest(signature, digest):
        raise HTTPException(status_code=401, detail="Invalid signature")
    event = request.headers.get("x-github-event", "unknown")
    import json as json_mod
    try:
        payload = json_mod.loads(body_bytes.decode() or "{}")
    except Exception:
        payload = {}
    await db.github_events.insert_one({
        "id": str(uuid.uuid4()), "event": event,
        "repo": (payload.get("repository") or {}).get("full_name"),
        "installation_id": (payload.get("installation") or {}).get("id"),
        "action": payload.get("action"),
        "received_at": datetime.now(timezone.utc).isoformat(),
    })
    synced_agent = None
    if event == "push" and (payload.get("repository") or {}).get("full_name"):
        try:
            repo_full = payload["repository"]["full_name"]
            owner_login = (payload["repository"].get("owner") or {}).get("login") or (payload["repository"].get("owner") or {}).get("name")
            user = await db.users.find_one({"github_login": owner_login}) if owner_login else None
            if user and user.get("github_token_encrypted"):
                token = _cipher().decrypt(user["github_token_encrypted"].encode()).decode()
                gh = {**GITHUB_HEADERS, "Authorization": f"Bearer {token}"}
                async with httpx.AsyncClient(timeout=30) as client:
                    agent = await _fetch_agent_file(client, gh, repo_full)
                if agent and not agent.get("error"):
                    await db.synced_agents.update_one(
                        {"user_id": user["id"], "repo": repo_full},
                        {"$set": {"user_id": user["id"], "repo": repo_full, "agent": agent,
                                  "synced_at": datetime.now(timezone.utc).isoformat(), "source": "webhook_push"}},
                        upsert=True)
                    synced_agent = agent.get("name") or agent.get("id")
        except Exception:
            pass
    return {"ok": True, "event": event, "synced_agent": synced_agent}
