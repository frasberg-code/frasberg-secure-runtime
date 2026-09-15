import re
import uuid
import secrets
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

import auth as auth_module
from core import db

router = APIRouter()


# ── Workspace projects — server-side persistence (like a real agent IDE) ──
class WsProjectCreate(BaseModel):
    agent: str = "builder"
    name: str = "New project"


class WsProjectSave(BaseModel):
    name: Optional[str] = None
    messages: Optional[List[dict]] = None
    html: Optional[str] = None
    session: Optional[str] = None
    model: Optional[str] = None
    publish_id: Optional[str] = None
    slug: Optional[str] = None
    publishes: Optional[List[dict]] = None


def _ws_proj_public(d, with_state=False):
    out = {"id": d["id"], "name": d.get("name", "Untitled"), "agent": d.get("agent", "builder"),
           "created_at": d.get("created_at"), "updated_at": d.get("updated_at"),
           "has_build": bool(d.get("html")), "message_count": len(d.get("messages") or [])}
    if with_state:
        out.update({"messages": d.get("messages") or [], "html": d.get("html"),
                    "session": d.get("session"), "model": d.get("model"),
                    "publish_id": d.get("publish_id"), "slug": d.get("slug"),
                    "publishes": d.get("publishes") or []})
    return out


@router.post("/workspace/projects")
async def ws_project_create(body: WsProjectCreate, user: dict = Depends(auth_module.get_current_user)):
    if await db.ws_projects.count_documents({"user_id": user["id"]}) >= 50:
        raise HTTPException(status_code=429, detail="Project limit reached (50) — delete an old project first")
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "agent": body.agent[:20],
           "name": (body.name or "New project").strip()[:60] or "New project",
           "messages": [], "html": None, "session": None, "model": None,
           "publish_id": None, "slug": None, "publishes": [],
           "created_at": now, "updated_at": now}
    await db.ws_projects.insert_one({**doc})
    return _ws_proj_public(doc)


@router.get("/workspace/projects")
async def ws_project_list(agent: Optional[str] = None, user: dict = Depends(auth_module.get_current_user)):
    q = {"user_id": user["id"]}
    if agent:
        q["agent"] = agent
    docs = await db.ws_projects.aggregate([
        {"$match": q}, {"$sort": {"updated_at": -1}}, {"$limit": 50},
        {"$project": {"_id": 0, "id": 1, "name": 1, "agent": 1, "created_at": 1, "updated_at": 1,
                      "has_build": {"$gt": [{"$strLenCP": {"$ifNull": ["$html", ""]}}, 0]},
                      "message_count": {"$size": {"$ifNull": ["$messages", []]}}}},
    ]).to_list(50)
    return {"projects": docs}


@router.get("/workspace/projects/{pid}")
async def ws_project_get(pid: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.ws_projects.find_one({"id": pid, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return _ws_proj_public(doc, with_state=True)


@router.put("/workspace/projects/{pid}")
async def ws_project_save(pid: str, body: WsProjectSave, user: dict = Depends(auth_module.get_current_user)):
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if body.name is not None:
        update["name"] = body.name.strip()[:60] or "Untitled"
    if body.messages is not None:
        update["messages"] = [{"role": str(m.get("role", ""))[:12], "content": str(m.get("content", ""))[:80000]}
                              for m in body.messages[-40:]]
    if body.html is not None:
        if len(body.html) > 500_000:
            raise HTTPException(status_code=413, detail="Build too large to save")
        update["html"] = body.html
    for k in ("session", "model", "publish_id", "slug"):
        v = getattr(body, k)
        if v is not None:
            update[k] = v
    if body.publishes is not None:
        update["publishes"] = body.publishes[:10]
    res = await db.ws_projects.update_one({"id": pid, "user_id": user["id"]}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True, "saved_at": update["updated_at"]}


@router.delete("/workspace/projects/{pid}")
async def ws_project_delete(pid: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.ws_projects.delete_one({"id": pid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"deleted": pid}


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
