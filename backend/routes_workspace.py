import re
import uuid
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from core import db

router = APIRouter()


class WorkspacePublishBody(BaseModel):
    agent: str = "builder"
    title: str = "Untitled build"
    html: str


class WorkspaceUpdateBody(BaseModel):
    html: str


def _wp_public(d):
    slug = d.get("slug")
    return {"id": d["id"], "agent": d["agent"], "title": d["title"], "hash": d["hash"],
            "version": d.get("version", 1), "created": d["created"], "updated": d["updated"],
            "published": True, "url": f"/api/workspace/publishes/{d['id']}/view",
            "slug": slug,
            "slug_url": f"/api/workspace/app/{slug}" if slug else None,
            "custom_url": f"https://{slug}.preview.frasberg.com" if slug else None}


@router.post("/workspace/publishes")
async def create_workspace_publish(body: WorkspacePublishBody):
    if len(body.html) > 400_000:
        raise HTTPException(status_code=413, detail="Build too large")
    if await db.workspace_publishes.count_documents({}) >= 100:
        raise HTTPException(status_code=429, detail="Publish limit reached")
    now = datetime.now(timezone.utc).isoformat()
    pid = uuid.uuid4().hex[:10]
    doc = {"_id": pid, "id": pid, "agent": body.agent[:20], "title": body.title[:80],
           "html": body.html, "hash": uuid.uuid4().hex[:7], "version": 1,
           "created": now, "updated": now}
    await db.workspace_publishes.insert_one(doc)
    return _wp_public(doc)


@router.put("/workspace/publishes/{pid}")
async def update_workspace_publish(pid: str, body: WorkspaceUpdateBody):
    doc = await db.workspace_publishes.find_one({"_id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Publish not found")
    doc["html"] = body.html
    doc["hash"] = uuid.uuid4().hex[:7]
    doc["version"] = doc.get("version", 1) + 1
    doc["updated"] = datetime.now(timezone.utc).isoformat()
    await db.workspace_publishes.replace_one({"_id": pid}, doc)
    return _wp_public(doc)


@router.get("/workspace/publishes")
async def list_workspace_publishes():
    docs = await db.workspace_publishes.find({}, {"html": 0}).sort("updated", -1).to_list(100)
    return {"publishes": [_wp_public(d) for d in docs]}


@router.get("/workspace/publishes/{pid}/view")
async def view_workspace_publish(pid: str):
    doc = await db.workspace_publishes.find_one({"_id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Publish not found")
    return HTMLResponse(content=doc["html"])


@router.delete("/workspace/publishes/{pid}")
async def delete_workspace_publish(pid: str):
    res = await db.workspace_publishes.delete_one({"_id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Publish not found")
    return {"deleted": pid}


WS_SLUG_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$")
WS_RESERVED_SLUGS = {"www", "api", "app", "apps", "admin", "mail", "demo", "docs", "chat", "cloud", "status", "dashboard"}


class WorkspaceSlugBody(BaseModel):
    name: str


@router.get("/workspace/slug-check")
async def workspace_slug_check(name: str = ""):
    n = name.strip().lower()
    valid = bool(WS_SLUG_RE.match(n)) and n not in WS_RESERVED_SLUGS
    taken = bool(valid and await db.workspace_publishes.count_documents({"slug": n}))
    suggestions = []
    if valid and taken:
        candidates = [f"{n}-app", f"{n}-hq", f"{n}-live", f"get-{n}", f"try-{n}",
                      f"{n}-{secrets.token_hex(1)}", f"{n}-{secrets.token_hex(1)}"]
        for c in candidates:
            c = c[:30].rstrip("-")
            if len(suggestions) >= 3:
                break
            if c in suggestions or not WS_SLUG_RE.match(c) or c in WS_RESERVED_SLUGS:
                continue
            if await db.workspace_publishes.count_documents({"slug": c}) == 0:
                suggestions.append(c)
    return {"name": n, "valid": valid, "available": valid and not taken, "suggestions": suggestions}


@router.post("/workspace/publishes/{pid}/slug")
async def set_workspace_slug(pid: str, body: WorkspaceSlugBody):
    n = body.name.strip().lower()
    if not WS_SLUG_RE.match(n) or n in WS_RESERVED_SLUGS:
        raise HTTPException(status_code=400, detail="Name must be 3-30 chars: lowercase letters, numbers and hyphens (like a GitHub username)")
    existing = await db.workspace_publishes.find_one({"slug": n})
    if existing and existing["_id"] != pid:
        raise HTTPException(status_code=409, detail=f"'{n}' is already taken — try another name")
    doc = await db.workspace_publishes.find_one({"_id": pid})
    if not doc:
        raise HTTPException(status_code=404, detail="Publish not found")
    await db.workspace_publishes.update_one({"_id": pid}, {"$set": {"slug": n}})
    doc["slug"] = n
    return _wp_public(doc)


@router.get("/workspace/app/{slug}")
async def view_workspace_app(slug: str):
    doc = await db.workspace_publishes.find_one({"slug": slug.strip().lower()})
    if not doc:
        raise HTTPException(status_code=404, detail="App not found")
    return HTMLResponse(content=doc["html"])
