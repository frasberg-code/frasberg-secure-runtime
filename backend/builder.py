import os
import re
import json
import uuid
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

import auth as auth_module

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

router = APIRouter()

FREE_DAILY = 5
PRO_DAILY = 30
DOC_PRICE = "1.00"

WEBSITE_SYSTEM = (
    "You are Luchii Builder, Frasberg's sovereign website generation engine. "
    "Given a description, output ONE complete, production-quality single-file HTML document. "
    "Rules: inline all CSS in a <style> tag and all JS in a <script> tag; no external requests except Google Fonts; "
    "modern, distinctive, responsive design with real copy (no lorem ipsum); smooth hover/scroll micro-interactions; "
    "keep it under ~300 lines. Output ONLY the raw HTML starting with <!DOCTYPE html>. No markdown fences, no commentary."
)

GAME_SYSTEM = (
    "You are Luchii Builder, Frasberg's sovereign game generation engine. "
    "Given a description, output ONE complete, playable single-file HTML5 game. "
    "Rules: use <canvas> with inline CSS/JS only, no external assets; include start screen, score, game-over + restart; "
    "support BOTH keyboard and touch controls; polished visuals (gradients, particles where fitting); "
    "keep it under ~350 lines. Output ONLY the raw HTML starting with <!DOCTYPE html>. No markdown fences, no commentary."
)


def _is_pro(user: dict) -> bool:
    return user.get("plan") == "pro" or user.get("role") == "admin"


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _clean_html(text: str) -> str:
    m = re.search(r"```(?:html)?\s*(.*?)```", text, re.S)
    if m:
        text = m.group(1)
    i = text.find("<!DOCTYPE")
    if i == -1:
        i = text.find("<html")
    if i > 0:
        text = text[i:]
    return text.strip()


class GenerateReq(BaseModel):
    prompt: str
    type: str = "website"
    project_id: Optional[str] = None


@router.get("/builder/quota")
async def builder_quota(user: dict = Depends(auth_module.get_current_user)):
    limit = PRO_DAILY if _is_pro(user) else FREE_DAILY
    used = await db.builder_generations.count_documents({"user_id": user["id"], "day": _today()})
    return {"used": used, "limit": limit, "pro": _is_pro(user)}


@router.post("/builder/generate")
async def builder_generate(body: GenerateReq, user: dict = Depends(auth_module.get_current_user)):
    prompt = (body.prompt or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Describe what you want to build")
    if body.type not in ("website", "game"):
        raise HTTPException(status_code=400, detail="Unknown builder type")
    limit = PRO_DAILY if _is_pro(user) else FREE_DAILY
    used = await db.builder_generations.count_documents({"user_id": user["id"], "day": _today()})
    if used >= limit:
        raise HTTPException(status_code=429, detail=f"Daily build limit reached ({limit}/day). Upgrade to Luchii Pro for {PRO_DAILY} builds/day.")

    project = None
    if body.project_id:
        project = await db.builder_projects.find_one({"id": body.project_id, "user_id": user["id"]})

    system = WEBSITE_SYSTEM if body.type == "website" else GAME_SYSTEM
    llm_text = prompt[:3000]
    if project and project.get("html"):
        llm_text = (
            f"Here is the current code:\n\n{project['html'][:24000]}\n\n"
            f"Apply this change and return the FULL updated single-file HTML: {prompt[:2000]}"
        )

    await db.builder_generations.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "day": _today(),
        "type": body.type, "ts": datetime.now(timezone.utc).isoformat(),
    })

    async def event_gen():
        full = ""
        try:
            llm = LlmChat(
                api_key=EMERGENT_LLM_KEY, session_id=f"builder-{uuid.uuid4()}",
                system_message=system,
            ).with_model("anthropic", "claude-sonnet-4-6")
            async for event in llm.stream_message(UserMessage(text=llm_text)):
                if isinstance(event, TextDelta):
                    full += event.content
                    yield f"data: {json.dumps({'delta': event.content})}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception:
            pass
        html = _clean_html(full)
        if not html or "<html" not in html.lower():
            yield f"data: {json.dumps({'error': 'The Luchii Builder engine could not complete this build. Please try again.'})}\n\n"
            return
        now = datetime.now(timezone.utc).isoformat()
        if project:
            await db.builder_projects.update_one(
                {"id": project["id"]},
                {"$set": {"html": html, "updated_at": now, "last_prompt": prompt[:300]}},
            )
            pid = project["id"]
            title = project.get("title") or prompt[:60]
        else:
            pid = str(uuid.uuid4())
            title = prompt[:60]
            await db.builder_projects.insert_one({
                "id": pid, "user_id": user["id"], "type": body.type, "title": title,
                "last_prompt": prompt[:300], "html": html, "published": False, "slug": None,
                "custom_domain": None, "created_at": now, "updated_at": now,
            })
        yield f"data: {json.dumps({'done': True, 'project': {'id': pid, 'title': title, 'type': body.type}, 'generations_used': used + 1, 'daily_limit': limit})}\n\n"

    return StreamingResponse(
        event_gen(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/builder/projects")
async def builder_projects(type: Optional[str] = None, user: dict = Depends(auth_module.get_current_user)):
    q = {"user_id": user["id"]}
    if type:
        q["type"] = type
    docs = await db.builder_projects.find(q, {"_id": 0, "html": 0}).sort("updated_at", -1).to_list(50)
    return docs


@router.get("/builder/projects/{pid}")
async def builder_project(pid: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.builder_projects.find_one({"id": pid, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return doc


@router.delete("/builder/projects/{pid}")
async def builder_delete(pid: str, user: dict = Depends(auth_module.get_current_user)):
    res = await db.builder_projects.delete_one({"id": pid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


@router.post("/builder/projects/{pid}/publish")
async def builder_publish(pid: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.builder_projects.find_one({"id": pid, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _is_pro(user):
        raise HTTPException(status_code=402, detail="pro_required")
    slug = doc.get("slug")
    if not slug:
        base = re.sub(r"[^a-z0-9]+", "-", (doc.get("title") or "site").lower())[:24].strip("-") or "site"
        slug = f"{base}-{secrets.token_hex(3)}"
    await db.builder_projects.update_one({"id": pid}, {"$set": {"published": True, "slug": slug}})
    return {"ok": True, "slug": slug, "url": f"/api/p/{slug}"}


class DomainReq(BaseModel):
    domain: str


@router.post("/builder/projects/{pid}/domain")
async def builder_domain(pid: str, body: DomainReq, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.builder_projects.find_one({"id": pid, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _is_pro(user):
        raise HTTPException(status_code=402, detail="pro_required")
    domain = (body.domain or "").strip().lower()
    if not re.match(r"^([a-z0-9-]+\.)+[a-z]{2,}$", domain):
        raise HTTPException(status_code=400, detail="Enter a valid domain, e.g. mysite.com")
    await db.builder_projects.update_one({"id": pid}, {"$set": {"custom_domain": domain}})
    return {
        "ok": True, "domain": domain,
        "dns": [
            {"type": "CNAME", "host": domain, "value": "sites.frasberg.com"},
            {"type": "TXT", "host": f"_luchii.{domain}", "value": f"luchii-verify={doc['id'][:12]}"},
        ],
        "note": "Add these records at your DNS provider. Verification usually completes within 24h.",
    }


@router.get("/p/{slug}")
async def builder_public(slug: str):
    doc = await db.builder_projects.find_one({"slug": slug, "published": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Site not found")
    return HTMLResponse(content=doc["html"])


# ── PACER-style document paywall ───────────────────────────────────────────

@router.get("/docs/entitlement")
async def docs_entitlement(user: dict = Depends(auth_module.get_current_user)):
    fresh = await db.users.find_one({"id": user["id"]}) or user
    owned = await db.doc_purchases.find({"user_id": user["id"]}, {"_id": 0, "doc_id": 1}).to_list(500)
    return {
        "pro": _is_pro(fresh),
        "doc_credits": int(fresh.get("doc_credits", 0)),
        "price": DOC_PRICE,
        "owned": [o["doc_id"] for o in owned],
    }


class UnlockReq(BaseModel):
    doc_id: str
    kind: str = "law"
    title: Optional[str] = None


@router.post("/docs/unlock")
async def docs_unlock(body: UnlockReq, user: dict = Depends(auth_module.get_current_user)):
    fresh = await db.users.find_one({"id": user["id"]}) or user
    now = datetime.now(timezone.utc).isoformat()
    if _is_pro(fresh):
        return {"ok": True, "free": True, "remaining": None}
    existing = await db.doc_purchases.find_one({"user_id": user["id"], "doc_id": body.doc_id})
    if existing:
        return {"ok": True, "free": False, "already_owned": True,
                "remaining": int(fresh.get("doc_credits", 0))}
    credits = int(fresh.get("doc_credits", 0))
    if credits <= 0:
        raise HTTPException(status_code=402, detail="payment_required")
    await db.users.update_one({"id": user["id"]}, {"$inc": {"doc_credits": -1}})
    await db.doc_purchases.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "doc_id": body.doc_id,
        "kind": body.kind, "title": (body.title or "")[:120], "ts": now,
    })
    return {"ok": True, "free": False, "remaining": credits - 1}
