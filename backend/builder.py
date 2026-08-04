import os
import re
import json
import uuid
import asyncio
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

import dns.resolver

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

import auth as auth_module
from sse_utils import guard_stream

logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

router = APIRouter()

FREE_DAILY = 5
PRO_DAILY = 30
DOC_PRICE = "1.00"

WEBSITE_SYSTEM = (
    "You are Luchii Builder, Frasberg's website generation engine. "
    "Given a description, output ONE complete, production-quality single-file HTML document. "
    "Rules: inline all CSS in a <style> tag and all JS in a <script> tag; no external requests except Google Fonts; "
    "modern, distinctive, responsive design with real copy (no lorem ipsum); smooth hover/scroll micro-interactions; "
    "keep it under ~300 lines. Output ONLY the raw HTML starting with <!DOCTYPE html>. No markdown fences, no commentary."
)

GAME_SYSTEM = (
    "You are Luchii Builder, Frasberg's game generation engine. "
    "Given a description, output ONE complete, playable single-file HTML5 game. "
    "Rules: use <canvas> with inline CSS/JS only, no external assets; include start screen, score, game-over + restart; "
    "support BOTH keyboard and touch controls; polished visuals (gradients, particles where fitting); "
    "keep it under ~350 lines. Output ONLY the raw HTML starting with <!DOCTYPE html>. No markdown fences, no commentary."
)

APP_SYSTEM = (
    "You are Luchii Builder, Frasberg's mobile app generation engine. "
    "Given a description, output ONE complete, fully functional single-file HTML mobile web app. "
    "Rules: inline all CSS and JS; no external requests except Google Fonts; MOBILE-FIRST layout (max-width phone frame "
    "centered on desktop, bottom nav / large touch targets); the app must actually WORK — real state, real interactions, "
    "localStorage persistence where useful; keep it under ~350 lines. Output ONLY the raw HTML starting with <!DOCTYPE html>. No markdown fences, no commentary."
)

LANDING_SYSTEM = (
    "You are Luchii Builder, Frasberg's landing page generation engine. "
    "Given a description, output ONE complete, high-converting single-file landing page. "
    "Rules: inline all CSS and JS; no external requests except Google Fonts; strong hero headline + CTA, "
    "features/benefits, social proof, pricing or signup section, footer; distinctive modern design with subtle "
    "scroll/hover animations; responsive; keep it under ~300 lines. Output ONLY the raw HTML starting with <!DOCTYPE html>. No markdown fences, no commentary."
)

_SYSTEMS = {"website": WEBSITE_SYSTEM, "game": GAME_SYSTEM, "app": APP_SYSTEM, "landing": LANDING_SYSTEM}
_BUILD_TASKS: set = set()


def _is_pro(user: dict) -> bool:
    return user.get("plan") in ("pro", "premium", "builder", "trial") or user.get("role") == "admin"


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
    if body.type not in _SYSTEMS:
        raise HTTPException(status_code=400, detail="Unknown builder type")
    limit = PRO_DAILY if _is_pro(user) else FREE_DAILY
    used = await db.builder_generations.count_documents({"user_id": user["id"], "day": _today()})
    if used >= limit:
        raise HTTPException(status_code=429, detail=f"Daily build limit reached ({limit}/day). Upgrade to Luchii Pro for {PRO_DAILY} builds/day.")

    project = None
    if body.project_id:
        project = await db.builder_projects.find_one({"id": body.project_id, "user_id": user["id"]})

    system = _SYSTEMS[body.type]
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

    async def produce(queue: asyncio.Queue):
        full = ""
        try:
            llm = LlmChat(
                api_key=EMERGENT_LLM_KEY, session_id=f"builder-{uuid.uuid4()}",
                system_message=system,
            ).with_model("anthropic", "claude-sonnet-4-6")
            async for event in llm.stream_message(UserMessage(text=llm_text)):
                if isinstance(event, TextDelta):
                    full += event.content
                    await queue.put({"delta": event.content})
                elif isinstance(event, StreamDone):
                    break
        except Exception:
            logger.exception("builder LLM stream failed")
        html = _clean_html(full)
        if not html or "<html" not in html.lower():
            await queue.put({"error": "The Luchii Builder engine could not complete this build. Please try again."})
            await queue.put(None)
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
        await queue.put({"done": True, "project": {"id": pid, "title": title, "type": body.type}, "generations_used": used + 1, "daily_limit": limit})
        await queue.put(None)

    async def event_gen():
        yield ": stream-start\n\n"
        queue: asyncio.Queue = asyncio.Queue()
        # Generation runs as an independent task: if the client connection drops
        # mid-stream, the build still completes and saves to the user's projects.
        task = asyncio.create_task(produce(queue))
        _BUILD_TASKS.add(task)
        task.add_done_callback(_BUILD_TASKS.discard)
        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

    return StreamingResponse(
        guard_stream(event_gen(), [
            {"error": "The Luchii Builder engine hit turbulence — please try again."},
        ]),
        media_type="text/event-stream",
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


@router.post("/builder/projects/{pid}/domain/verify")
async def builder_domain_verify(pid: str, user: dict = Depends(auth_module.get_current_user)):
    doc = await db.builder_projects.find_one({"id": pid, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    if not _is_pro(user):
        raise HTTPException(status_code=402, detail="pro_required")
    domain = doc.get("custom_domain")
    if not domain:
        raise HTTPException(status_code=400, detail="Attach a domain first")
    expected_cname = "sites.frasberg.com"
    expected_txt = f"luchii-verify={doc['id'][:12]}"

    def _resolve(qname, rtype):
        try:
            answers = dns.resolver.resolve(qname, rtype, lifetime=6)
            if rtype == "CNAME":
                return [str(r.target).rstrip(".").lower() for r in answers]
            return [b"".join(r.strings).decode("utf-8", "ignore") for r in answers]
        except Exception:
            return []

    cname_found = await asyncio.to_thread(_resolve, domain, "CNAME")
    txt_found = await asyncio.to_thread(_resolve, f"_luchii.{domain}", "TXT")
    cname_ok = expected_cname in cname_found
    txt_ok = expected_txt in txt_found
    verified = cname_ok and txt_ok
    await db.builder_projects.update_one({"id": pid}, {"$set": {
        "domain_verified": verified,
        "domain_checked_at": datetime.now(timezone.utc).isoformat(),
    }})
    return {
        "verified": verified,
        "checks": [
            {"type": "CNAME", "host": domain, "expected": expected_cname, "found": cname_found, "ok": cname_ok},
            {"type": "TXT", "host": f"_luchii.{domain}", "expected": expected_txt, "found": txt_found, "ok": txt_ok},
        ],
    }


@router.get("/builder/gallery")
async def builder_gallery(type: Optional[str] = None):
    q = {"published": True, "hidden": {"$ne": True}}
    if type in _SYSTEMS:
        q["type"] = type
    docs = await db.builder_projects.find(
        q, {"_id": 0, "html": 0, "user_id": 0, "last_prompt": 0}
    ).sort([("featured", -1), ("updated_at", -1)]).to_list(60)
    return docs


@router.get("/builder/site/{slug}/meta")
async def builder_site_meta(slug: str):
    doc = await db.builder_projects.find_one({"slug": slug, "published": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Site not found")
    return {"slug": slug, "title": doc.get("title"), "type": doc.get("type"),
            "plays": int(doc.get("plays", 0)), "created_at": doc.get("created_at")}


@router.post("/builder/site/{slug}/play")
async def builder_site_play(slug: str):
    week = datetime.now(timezone.utc).strftime("%G-W%V")
    doc = await db.builder_projects.find_one({"slug": slug, "published": True})
    if not doc:
        raise HTTPException(status_code=404, detail="Site not found")
    if doc.get("week_key") != week:
        await db.builder_projects.update_one(
            {"id": doc["id"]}, {"$set": {"week_key": week, "weekly_plays": 1}, "$inc": {"plays": 1}})
    else:
        await db.builder_projects.update_one({"id": doc["id"]}, {"$inc": {"plays": 1, "weekly_plays": 1}})
    return {"plays": int(doc.get("plays", 0)) + 1}


@router.get("/builder/leaderboard")
async def builder_leaderboard():
    week = datetime.now(timezone.utc).strftime("%G-W%V")
    q = {"published": True, "type": "game", "hidden": {"$ne": True}}
    proj = {"_id": 0, "html": 0, "user_id": 0, "last_prompt": 0}
    top = await db.builder_projects.find({**q, "plays": {"$gt": 0}}, proj).sort("plays", -1).to_list(10)
    spotlight = await db.builder_projects.find_one(
        {**q, "week_key": week, "weekly_plays": {"$gt": 0}}, proj, sort=[("weekly_plays", -1)])
    return {"week": week, "top": top, "spotlight": spotlight}


class RemixReq(BaseModel):
    slug: str


@router.post("/builder/remix")
async def builder_remix(body: RemixReq, user: dict = Depends(auth_module.get_current_user)):
    src = await db.builder_projects.find_one({"slug": body.slug, "published": True, "hidden": {"$ne": True}})
    if not src:
        raise HTTPException(status_code=404, detail="Build not found")
    now = datetime.now(timezone.utc).isoformat()
    pid = str(uuid.uuid4())
    title = (f"Remix of {src.get('title') or 'build'}")[:60]
    await db.builder_projects.insert_one({
        "id": pid, "user_id": user["id"], "type": src.get("type", "website"), "title": title,
        "last_prompt": f"Remixed from /{body.slug}", "html": src["html"], "published": False,
        "slug": None, "custom_domain": None, "remixed_from": body.slug,
        "created_at": now, "updated_at": now,
    })
    return {"id": pid, "title": title, "type": src.get("type", "website")}


async def _require_admin(user: dict = Depends(auth_module.get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/admin/builder")
async def admin_builder_list(admin: dict = Depends(_require_admin)):
    docs = await db.builder_projects.find(
        {"published": True}, {"_id": 0, "html": 0, "last_prompt": 0}
    ).sort("updated_at", -1).to_list(200)
    return docs


class CurateReq(BaseModel):
    featured: Optional[bool] = None
    hidden: Optional[bool] = None


@router.patch("/admin/builder/{pid}")
async def admin_builder_curate(pid: str, body: CurateReq, admin: dict = Depends(_require_admin)):
    sets = {k: v for k, v in body.dict().items() if v is not None}
    if not sets:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db.builder_projects.update_one({"id": pid}, {"$set": sets})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True, **sets}


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
    existing = await db.doc_purchases.find_one({"user_id": user["id"], "doc_id": body.doc_id})
    if _is_pro(fresh):
        if not existing:
            await db.doc_purchases.insert_one({
                "id": str(uuid.uuid4()), "user_id": user["id"], "doc_id": body.doc_id,
                "kind": body.kind, "title": (body.title or "")[:120], "ts": now, "pro": True,
            })
        return {"ok": True, "free": True, "remaining": None, "receipt_eligible": not existing}
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
    return {"ok": True, "free": False, "remaining": credits - 1, "receipt_eligible": True}


class ReceiptReq(BaseModel):
    doc_id: str
    title: Optional[str] = None
    pdf_base64: str


@router.post("/docs/receipt")
async def docs_receipt(body: ReceiptReq, user: dict = Depends(auth_module.get_current_user)):
    owned = await db.doc_purchases.find_one({"user_id": user["id"], "doc_id": body.doc_id})
    if not owned:
        raise HTTPException(status_code=403, detail="Document not owned")
    if len(body.pdf_base64) > 8_000_000:
        raise HTTPException(status_code=413, detail="PDF too large")
    if not (RESEND_API_KEY and user.get("email")):
        return {"sent": False, "reason": "email_not_configured"}
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        name = body.title or body.doc_id
        params = {
            "from": SENDER_EMAIL,
            "to": [user["email"]],
            "subject": f"Your certified document — {name}",
            "html": (
                f"<p>Thank you for your purchase from Frasberg Inc.</p>"
                f"<p>Your certified PDF <strong>{name}</strong> is attached. "
                f"You can re-download it any time from your <a href='https://frasberg.com/downloads'>My Downloads</a> page.</p>"
                f"<p>— The AI World Court · Frasberg Inc.</p>"
            ),
            "attachments": [{"filename": f"{body.doc_id}.pdf", "content": body.pdf_base64}],
        }
        res = await asyncio.to_thread(resend.Emails.send, params)
        return {"sent": True, "id": res.get("id")}
    except Exception:
        return {"sent": False, "reason": "send_error"}


@router.get("/docs/purchases")
async def docs_purchases(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.doc_purchases.find({"user_id": user["id"]}, {"_id": 0}).sort("ts", -1).to_list(200)
    return docs
