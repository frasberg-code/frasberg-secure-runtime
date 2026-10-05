import os
import time
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

import auth as auth_module
import mesh_ws
import voice_engine
from core import (db, PLANS, UPGRADE_PLANS, PLAN_QUOTAS, SERVER_STARTED_AT, _START_TIME,
                  _REQ_METRICS, _is_team_email, _mask_key, _audit, _log_email, require_admin)

logger = logging.getLogger(__name__)
router = APIRouter()


def _upstream_active() -> bool:
    import server
    return bool(server.ACTIVE_UPSTREAM)


@router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    users_count = await db.users.count_documents({})
    messages_count = await db.chat_messages.count_documents({})
    sessions = await db.chat_messages.distinct("session_id")
    filings = len(await db.chat_messages.distinct("session_id", {"model": "court"}))
    keys_count = await db.api_keys.count_documents({})
    purchases = await db.purchases.find({}, {"_id": 0}).sort("ts", -1).to_list(20)
    kb_count = await db.knowledge.count_documents({})
    memories_count = await db.user_memories.count_documents({})
    builds_count = await db.builder_projects.count_documents({})
    paid_users = await db.users.count_documents({"plan": {"$nin": [None, "free"]}})

    def _plan_price(pid):
        p = UPGRADE_PLANS.get(pid) or PLANS.get(pid)
        return float(p["price"]) if p else 0.0

    monthly: dict = {}
    for doc in await db.purchases.find({}, {"plan": 1, "ts": 1}).to_list(5000):
        month = (doc.get("ts") or "")[:7]
        if month:
            monthly[month] = monthly.get(month, 0.0) + _plan_price(doc.get("plan"))
    for doc in await db.cashapp_payments.find({"status": "approved"}, {"plan_id": 1, "approved_at": 1, "created_at": 1}).to_list(5000):
        month = (doc.get("approved_at") or doc.get("created_at") or "")[:7]
        if month:
            monthly[month] = monthly.get(month, 0.0) + _plan_price(doc.get("plan_id"))
    revenue_monthly = [{"month": m, "revenue": round(v, 2)} for m, v in sorted(monthly.items())][-12:]

    return {
        "users": users_count, "messages": messages_count, "sessions": len(sessions),
        "court_filings": filings, "api_keys": keys_count, "knowledge_docs": kb_count,
        "memories": memories_count, "builds": builds_count, "paid_users": paid_users,
        "uptime_seconds": int(time.time() - SERVER_STARTED_AT),
        "revenue_monthly": revenue_monthly, "revenue_total": round(sum(monthly.values()), 2),
        "upstream_active": _upstream_active(), "recent_purchases": purchases,
    }


@router.get("/admin/upstream")
async def admin_upstream(admin: dict = Depends(require_admin)):
    import server
    url = os.environ.get("LUCHII_UPSTREAM_URL", "").strip()
    key = os.environ.get("LUCHII_UPSTREAM_API_KEY", "").strip()
    return {
        "configured_url": url or None,
        "active": bool(server.ACTIVE_UPSTREAM),
        "active_url": server.ACTIVE_UPSTREAM,
        "key": _mask_key(key) if key else None,
        "routing": "frasberg-gateway-primary" if url else "engine-core-only",
        "note": "Chats route through the Frasberg gateway with the frb_live_ key when the upstream is reachable; otherwise the local engine core answers.",
    }


@router.get("/admin/audit")
async def admin_audit_log(admin: dict = Depends(require_admin)):
    return await db.admin_audit.find({}, {"_id": 0}).sort("ts", -1).to_list(100)


@router.get("/admin/health")
async def admin_health(admin: dict = Depends(require_admin)):
    now = time.time()
    recent = [m for m in _REQ_METRICS if now - m[0] < 300]
    lat = sorted(m[1] for m in recent)
    errors = sum(1 for m in recent if m[2] >= 500)
    t0 = time.time()
    await db.command("ping")
    db_ms = round((time.time() - t0) * 1000, 1)
    return {
        "window_seconds": 300,
        "requests": len(recent),
        "avg_latency_ms": round(sum(lat) / len(lat), 1) if lat else 0,
        "p95_latency_ms": round(lat[int(len(lat) * 0.95) - 1], 1) if lat else 0,
        "error_count": errors,
        "error_rate": round(errors / len(recent) * 100, 2) if recent else 0.0,
        "db_ping_ms": db_ms,
        "uptime_seconds": int((datetime.now(timezone.utc) - _START_TIME).total_seconds()),
    }


@router.get("/quotas")
async def my_quotas(user: dict = Depends(auth_module.get_current_user)):
    plan = user.get("plan", "free")
    q = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["pro"])
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    key_ids = [k["id"] async for k in db.api_keys.find({"user_id": user["id"]}, {"id": 1})]
    used = 0
    if key_ids:
        agg = await db.api_key_usage.aggregate([
            {"$match": {"key_id": {"$in": key_ids}, "day": {"$regex": f"^{month}"}}},
            {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}}}]).to_list(1)
        used = agg[0]["tokens"] if agg else 0
    if _is_team_email(user.get("email")):
        return {"plan": "team", "rpm_limit": 0, "monthly_token_limit": 0,
                "monthly_tokens_used": used, "unlimited": True}
    return {"plan": plan, "rpm_limit": q["rpm"], "monthly_token_limit": q["monthly_tokens"],
            "monthly_tokens_used": used}


@router.get("/admin/support-chats")
async def admin_support_chats(admin: dict = Depends(require_admin)):
    docs = await db.support_chats.find({}, {"_id": 0}).sort("updated", -1).to_list(100)
    return {"chats": docs}


@router.get("/admin/contact-messages")
async def admin_contact_messages(admin: dict = Depends(require_admin)):
    docs = await db.contact_messages.find({}, {"_id": 0}).sort("created", -1).to_list(200)
    return {"messages": docs, "unreplied": sum(1 for d in docs if not d.get("replied_at"))}


class ContactReplyBody(BaseModel):
    reply: str


@router.post("/admin/contact-messages/{mid}/reply")
async def admin_contact_reply(mid: str, body: ContactReplyBody, admin: dict = Depends(require_admin)):
    msg = await db.contact_messages.find_one({"id": mid})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    reply = body.reply.strip()[:4000]
    if not reply:
        raise HTTPException(status_code=400, detail="Reply cannot be empty")
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    sent = False
    if api_key_env:
        html = (f"<div style='font-family:Arial,sans-serif;color:#1f2937;line-height:1.7;max-width:560px;'>"
                f"<p>Hi {msg['name']},</p><p>{reply.replace(chr(10), '<br/>')}</p>"
                f"<p style='margin-top:24px;'>— The Frasberg Team<br/><a href='https://frasberg.com' style='color:#1A4FFF;'>frasberg.com</a></p>"
                f"<hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0;'/>"
                f"<p style='font-size:12px;color:#9ca3af;'>Your original message:<br/><em>{msg['message'][:800]}</em></p>"
                f"<p style='font-size:11px;color:#c4c8cf;'>Copyright © 2003-2026 FRASBERG, INC., All Rights Reserved.</p></div>")
        try:
            import resend as _resend
            _resend.api_key = api_key_env
            await asyncio.to_thread(_resend.Emails.send, {
                "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [msg["email"]],
                "subject": "Re: your message to Frasberg", "html": html})
            sent = True
            await _log_email("contact_reply", msg["email"], "Re: your message to Frasberg", True, admin.get("id"))
        except Exception:
            await _log_email("contact_reply", msg["email"], "Re: your message to Frasberg", False, admin.get("id"))
            logger.exception("contact reply email failed")
    await db.contact_messages.update_one({"id": mid}, {"$set": {
        "reply": reply, "replied_at": datetime.now(timezone.utc).isoformat(),
        "replied_by": admin.get("email"), "email_sent": sent}})
    return {"ok": True, "email_sent": sent}


@router.get("/admin/team")
async def admin_team(admin: dict = Depends(require_admin)):
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    users = await db.users.find(
        {"email": {"$regex": "@frasbergai\\.com$", "$options": "i"}},
        {"_id": 0, "id": 1, "email": 1, "name": 1, "plan": 1, "created_at": 1}).to_list(200)
    members = []
    for u in users:
        keys = await db.api_keys.find({"user_id": u["id"]}, {"id": 1, "last_used": 1}).to_list(100)
        kids = [k["id"] for k in keys]
        tokens = reqs = 0
        if kids:
            agg = await db.api_key_usage.aggregate([
                {"$match": {"key_id": {"$in": kids}, "day": {"$regex": f"^{month}"}}},
                {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}, "requests": {"$sum": "$requests"}}}]).to_list(1)
            if agg:
                tokens, reqs = agg[0]["tokens"], agg[0]["requests"]
        last = max([k.get("last_used") or "" for k in keys], default="") or None
        members.append({"id": u["id"], "name": u.get("name"), "email": u["email"], "plan": u.get("plan", "scale"),
                        "created_at": u.get("created_at"), "keys": len(kids),
                        "monthly_tokens": tokens, "monthly_requests": reqs, "last_active": last})
    members.sort(key=lambda m: -m["monthly_tokens"])
    return {"month": month, "members": members,
            "totals": {"members": len(members),
                       "tokens": sum(m["monthly_tokens"] for m in members),
                       "requests": sum(m["monthly_requests"] for m in members)}}


@router.get("/admin/tenants")
async def admin_tenants(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "id": 1, "email": 1, "name": 1, "plan": 1, "role": 1,
                                     "credit_balance": 1, "created_at": 1, "suspended": 1}).to_list(1000)
    keys = await db.api_keys.find({}, {"_id": 0, "user_id": 1, "request_count": 1,
                                       "token_count": 1, "credits": 1}).to_list(5000)
    by_user: dict = {}
    for k in keys:
        agg = by_user.setdefault(k.get("user_id"), {"keys": 0, "requests": 0, "tokens": 0, "credits": 0})
        agg["keys"] += 1
        agg["requests"] += k.get("request_count", 0)
        agg["tokens"] += k.get("token_count", 0)
        agg["credits"] += k.get("credits", 0)

    def _plan_price(pid):
        p = UPGRADE_PLANS.get(pid) or PLANS.get(pid)
        return float(p["price"]) if p else 0.0

    spend_by_email: dict = {}
    for p in await db.purchases.find({}, {"email": 1, "plan": 1}).to_list(5000):
        em = (p.get("email") or "").lower()
        if em:
            spend_by_email[em] = spend_by_email.get(em, 0.0) + _plan_price(p.get("plan"))
    for p in await db.cashapp_payments.find({"status": "approved"}, {"user_email": 1, "plan_id": 1}).to_list(5000):
        em = (p.get("user_email") or "").lower()
        if em:
            spend_by_email[em] = spend_by_email.get(em, 0.0) + _plan_price(p.get("plan_id"))

    tenants = []
    for u in users:
        agg = by_user.get(u["id"], {"keys": 0, "requests": 0, "tokens": 0, "credits": 0})
        tenants.append({
            "id": u["id"], "email": u.get("email"), "name": u.get("name"), "plan": u.get("plan", "free"),
            "joined": (u.get("created_at") or "")[:10], "wallet": u.get("credit_balance", 0),
            "suspended": bool(u.get("suspended")), "role": u.get("role", "user"),
            **agg, "spend": round(spend_by_email.get((u.get("email") or "").lower(), 0.0), 2),
        })
    tenants.sort(key=lambda t: (t["spend"], t["tokens"]), reverse=True)
    return {"tenants": tenants, "totals": {
        "tenants": len(tenants),
        "revenue": round(sum(t["spend"] for t in tenants), 2),
        "tokens": sum(t["tokens"] for t in tenants),
        "requests": sum(t["requests"] for t in tenants),
    }}


@router.get("/admin/tenants/analytics")
async def admin_tenant_analytics(admin: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    usage = await db.api_key_usage.find({"day": {"$gte": days[0]}}, {"_id": 0}).to_list(20000)
    key_ids = list({u["key_id"] for u in usage if u.get("key_id")})
    keys = await db.api_keys.find({"id": {"$in": key_ids}}, {"_id": 0, "id": 1, "user_id": 1}).to_list(5000)
    key_owner = {k["id"]: k.get("user_id") for k in keys}
    owner_ids = list({v for v in key_owner.values() if v})
    users = await db.users.find({"id": {"$in": owner_ids}}, {"_id": 0, "id": 1, "email": 1}).to_list(5000)
    email_of = {u["id"]: (u.get("email") or "unknown") for u in users}
    totals, series = {}, {}
    for u in usage:
        uid = key_owner.get(u.get("key_id"))
        if not uid:
            continue
        em = email_of.get(uid, "unknown")
        totals[em] = totals.get(em, 0) + u.get("tokens", 0)
        series.setdefault(em, {d: 0 for d in days})
        if u.get("day") in series[em]:
            series[em][u["day"]] += u.get("tokens", 0)
    top = sorted(totals.items(), key=lambda x: -x[1])[:6]
    data = [{"day": d[5:], **{em: series[em][d] for em, _ in top}} for d in days]
    return {"top": [{"email": em, "tokens": t} for em, t in top], "days": data}


@router.get("/admin/tenants/{user_id}")
async def admin_tenant_detail(user_id: str, admin: dict = Depends(require_admin)):
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "email": 1, "name": 1,
                                                  "plan": 1, "credit_balance": 1, "created_at": 1, "suspended": 1})
    if not u:
        raise HTTPException(status_code=404, detail="Tenant not found")
    keys = await db.api_keys.find({"user_id": user_id}, {"_id": 0, "id": 1, "name": 1, "key": 1,
                                                         "credits": 1, "request_count": 1, "token_count": 1,
                                                         "last_used": 1, "created": 1}).to_list(100)
    key_ids = [k["id"] for k in keys]
    for k in keys:
        k["key"] = _mask_key(k.get("key", ""))
    now = datetime.now(timezone.utc)
    days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    by_day = {d: {"day": d, "requests": 0, "tokens": 0} for d in days}
    if key_ids:
        for ud in await db.api_key_usage.find({"key_id": {"$in": key_ids}, "day": {"$gte": days[0]}},
                                              {"_id": 0}).to_list(2000):
            if ud.get("day") in by_day:
                by_day[ud["day"]]["requests"] += ud.get("requests", 0)
                by_day[ud["day"]]["tokens"] += ud.get("tokens", 0)
    purchases = await db.purchases.find({"email": (u.get("email") or "").lower()},
                                        {"_id": 0}).sort("ts", -1).to_list(50)
    return {"tenant": u, "keys": keys, "daily": list(by_day.values()), "purchases": purchases}


HOSTING_REGIONS = ["us-west", "us-east", "eu-central", "ap-south", "sa-east"]


@router.get("/admin/hosting")
async def admin_hosting(admin: dict = Depends(require_admin)):
    """Enterprise multi-tenant hosting view — isolation, safety, evolution, regions, billing meters."""
    users = await db.users.find({}, {"_id": 0, "id": 1, "email": 1, "name": 1, "plan": 1, "role": 1,
                                     "suspended": 1, "region_permissions": 1, "credit_balance": 1}).to_list(1000)
    keys = await db.api_keys.find({}, {"_id": 0, "user_id": 1, "request_count": 1, "token_count": 1}).to_list(5000)
    agg: dict = {}
    for k in keys:
        a = agg.setdefault(k.get("user_id"), {"keys": 0, "requests": 0, "tokens": 0})
        a["keys"] += 1
        a["requests"] += k.get("request_count", 0)
        a["tokens"] += k.get("token_count", 0)
    evo_by_owner: dict = {}
    async for m in db.marketplace.find({"owner_id": {"$exists": True}}, {"owner_id": 1, "history": 1, "evolution_mode": 1}):
        e = evo_by_owner.setdefault(m["owner_id"], {"items": 0, "evolution_events": 0, "evolution_on": 0})
        e["items"] += 1
        e["evolution_events"] += len(m.get("history", []))
        e["evolution_on"] += 1 if m.get("evolution_mode") else 0
    tenants = []
    for u in users:
        a = agg.get(u["id"], {"keys": 0, "requests": 0, "tokens": 0})
        e = evo_by_owner.get(u["id"], {"items": 0, "evolution_events": 0, "evolution_on": 0})
        plan = u.get("plan", "free")
        tenants.append({
            "id": u["id"], "email": u.get("email"), "name": u.get("name"), "plan": plan,
            "role": u.get("role", "user"), "suspended": bool(u.get("suspended")),
            "isolation": "dedicated sandbox" if plan in ("scale", "enterprise") else "shared pool",
            "safety_profile": {
                "membrane": "enforced", "hinge": "policy-driven" if plan != "free" else "standard",
                "classifier": "v3-enterprise" if plan in ("scale", "enterprise") else "v3",
                "ethics": "compliance profile" if plan == "enterprise" else "default",
            },
            "evolution_policy": "audited pipelines" if e["evolution_on"] else ("mutation-ready" if e["items"] else "disabled"),
            "region_permissions": u.get("region_permissions") or (HOSTING_REGIONS if plan in ("scale", "enterprise") else ["us-west"]),
            "billing": {"cognition_cycles": a["requests"], "tokens": a["tokens"], "keys": a["keys"],
                        "evolution_events": e["evolution_events"], "marketplace_items": e["items"],
                        "wallet": u.get("credit_balance", 0)},
        })
    tenants.sort(key=lambda t: -t["billing"]["cognition_cycles"])
    return {"tenants": tenants, "regions": HOSTING_REGIONS}


@router.post("/admin/tenants/{user_id}/regions")
async def admin_set_tenant_regions(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    regions = [r for r in (body.get("regions") or []) if r in HOSTING_REGIONS]
    if not regions:
        raise HTTPException(status_code=400, detail="At least one valid region required.")
    res = await db.users.update_one({"id": user_id}, {"$set": {"region_permissions": regions}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    await _audit(admin, "set_region_permissions", {"tenant_id": user_id, "regions": regions})
    return {"ok": True, "regions": regions}


@router.post("/admin/tenants/{user_id}/grant-credits")
async def admin_grant_credits(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    amount = max(1, min(int(body.get("amount", 0)), 1000000))
    res = await db.users.update_one({"id": user_id}, {"$inc": {"credit_balance": amount}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    await db.credit_transfers.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id, "amount": amount, "kind": "admin_grant",
        "granted_by": admin["id"], "ts": datetime.now(timezone.utc).isoformat()})
    await _audit(admin, "grant_credits", {"tenant_id": user_id, "amount": amount})
    doc = await db.users.find_one({"id": user_id}, {"credit_balance": 1})
    return {"ok": True, "granted": amount, "wallet": int((doc or {}).get("credit_balance", 0))}


async def _send_suspension_notice(email: str, name: str, suspended: bool, reason: str = ""):
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    if not (api_key_env and email):
        return
    if suspended:
        title, color, body = ("Your Frasberg account has been suspended", "#ef4444",
                              "Your account and all API keys have been suspended by an administrator. "
                              "API requests will return 403 until access is restored. "
                              "If you believe this is a mistake, contact support@frasberg.com.")
    else:
        title, color, body = ("Your Frasberg account has been reinstated", "#34d399",
                              "Good news — your account has been reinstated. All API keys are active again "
                              "and requests will resume immediately.")
    reason_html = (f"<p style='color:#f8fafc;background:#1e293b;border-radius:10px;padding:12px 16px;"
                   f"font-size:13px;'><b>Reason from the admin team:</b><br/>{reason}</p>") if reason else ""
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:{color};font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Account Notice</p>"
            f"<h2 style='margin:8px 0;'>{title}</h2>"
            f"<p style='color:#94a3b8;'>Hi {name or 'there'},</p>"
            f"<p style='color:#94a3b8;'>{body}</p>"
            f"{reason_html}"
            f"<p style='color:#64748b;font-size:12px;margin-top:16px;'>support@frasberg.com · https://frasberg.com/legal</p></div>")
    subject = title
    try:
        import resend
        resend.api_key = api_key_env
        await asyncio.to_thread(resend.Emails.send, {
            "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
            "to": [email], "subject": subject, "html": html})
        await _log_email("suspension_notice", email, subject, True)
    except Exception:
        logger.exception("suspension notice failed")
        await _log_email("suspension_notice", email, subject, False)


@router.post("/admin/tenants/{user_id}/suspend")
async def admin_suspend_tenant(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    suspended = bool(body.get("suspended", True))
    reason = str(body.get("reason", "") or "").strip()[:500]
    target = await db.users.find_one({"id": user_id}, {"role": 1, "email": 1, "name": 1})
    if not target:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot suspend an admin account")
    update = {"suspended": suspended}
    if suspended and reason:
        update["suspend_reason"] = reason
    await db.users.update_one({"id": user_id}, {"$set": update} if suspended else
                              {"$set": {"suspended": False}, "$unset": {"suspend_reason": ""}})
    await db.api_keys.update_many({"user_id": user_id}, {"$set": {"suspended": suspended}})
    asyncio.create_task(_send_suspension_notice(target.get("email"), target.get("name"), suspended, reason))
    await _audit(admin, "suspend_tenant" if suspended else "reinstate_tenant",
                 {"tenant_id": user_id, "reason": reason})
    return {"ok": True, "suspended": suspended}


@router.get("/admin/tenants-export.csv")
async def admin_tenants_export(admin: dict = Depends(require_admin)):
    data = await admin_tenants(admin)
    import io, csv
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Email", "Name", "Plan", "Role", "Suspended", "Keys", "Requests", "Tokens",
                "Key Credits", "Wallet", "Spend USD", "Joined"])
    for t in data["tenants"]:
        w.writerow([t["email"], t["name"], t["plan"], t["role"], "yes" if t["suspended"] else "no",
                    t["keys"], t["requests"], t["tokens"], t["credits"], t["wallet"], t["spend"], t["joined"]])
    fname = f"frasberg-tenants-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.csv"
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={fname}"})


@router.get("/metrics")
async def prometheus_metrics():
    users_count = await db.users.count_documents({})
    messages_count = await db.chat_messages.count_documents({})
    sessions = await db.chat_messages.distinct("session_id")
    builds_count = await db.builder_projects.count_documents({})
    memories_count = await db.user_memories.count_documents({})
    paid_users = await db.users.count_documents({"plan": {"$nin": [None, "free"]}})
    lines = [
        "# HELP luchii_users_total Registered users",
        "# TYPE luchii_users_total gauge",
        f"luchii_users_total {users_count}",
        "# TYPE luchii_messages_total gauge",
        f"luchii_messages_total {messages_count}",
        "# TYPE luchii_sessions_total gauge",
        f"luchii_sessions_total {len(sessions)}",
        "# TYPE luchii_builds_total gauge",
        f"luchii_builds_total {builds_count}",
        "# TYPE luchii_memories_total gauge",
        f"luchii_memories_total {memories_count}",
        "# TYPE luchii_paid_users_total gauge",
        f"luchii_paid_users_total {paid_users}",
        "# TYPE luchii_upstream_active gauge",
        f"luchii_upstream_active {1 if _upstream_active() else 0}",
        "# TYPE luchii_uptime_seconds counter",
        f"luchii_uptime_seconds {int(time.time() - SERVER_STARTED_AT)}",
        "# TYPE luchii_ws_active_connections gauge",
        f"luchii_ws_active_connections {len(mesh_ws.manager.active)}",
        "# TYPE luchii_ws_messages_total counter",
        f"luchii_ws_messages_total {mesh_ws.STATS['messages_in'] + mesh_ws.STATS['messages_out']}",
        "# TYPE luchii_tamper_attempts_total counter",
        f"luchii_tamper_attempts_total {mesh_ws.STATS['tamper_attempts']}",
        "# TYPE luchii_e2e_frames_total counter",
        f"luchii_e2e_frames_total {mesh_ws.STATS['e2e_frames']}",
    ]
    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")


@router.get("/admin/mesh/live")
async def admin_mesh_live(admin: dict = Depends(require_admin)):
    alerts = await db.mesh_alerts.find({}, {"_id": 0}).sort("ts", -1).to_list(20)
    sk = await mesh_ws.get_e2e_key()
    return {
        "active_clients": len(mesh_ws.manager.active),
        "client_ids": list(mesh_ws.manager.active.keys()),
        "stats": mesh_ws.STATS, "alerts": alerts,
        "e2e_pubkey": mesh_ws.e2e_pubkey_b64(sk),
        "offline_buffer": await mesh_ws.buffer_backend(),
    }


@router.post("/admin/mesh/rotate-key")
async def admin_mesh_rotate(admin: dict = Depends(require_admin)):
    pubkey = await mesh_ws.rotate_e2e_key()
    return {"ok": True, "pubkey": pubkey}


def _fmt_uptime(seconds: int) -> str:
    d, rem = divmod(seconds, 86400)
    h, rem = divmod(rem, 3600)
    m, _ = divmod(rem, 60)
    return f"{d}d {h}h {m}m" if d else f"{h}h {m}m"


@router.get("/admin/mesh/overview")
async def admin_mesh_overview(admin: dict = Depends(require_admin)):
    uptime = int(time.time() - SERVER_STARTED_AT)
    qs = await mesh_ws.queue_stats()
    return {
        "active_connections": len(mesh_ws.manager.active),
        "encrypted_sessions": sum(1 for m in mesh_ws.client_meta.values() if m.get("e2e")),
        "msg_per_min": mesh_ws.msg_per_min(),
        "avg_latency_ms": mesh_ws.avg_latency_ms(),
        "uptime": _fmt_uptime(uptime), "uptime_seconds": uptime, "uptime_pct": 99.99,
        "redis_queue_size": qs["total_queued"], "queue_backend": qs["backend"],
        "regions_online": len(mesh_ws.REGIONS),
        "voice_requests_today": sum(mesh_ws.VOICE_USAGE.values()),
        "stats": mesh_ws.STATS,
    }


@router.get("/admin/mesh/metrics")
async def admin_mesh_metrics(admin: dict = Depends(require_admin)):
    return {
        "message_history": mesh_ws.message_history(15),
        "latency_history": mesh_ws.latency_history(20),
        "msg_per_min": mesh_ws.msg_per_min(),
        "avg_latency_ms": mesh_ws.avg_latency_ms(),
    }


@router.get("/admin/mesh/regions")
async def admin_mesh_regions(admin: dict = Depends(require_admin)):
    return {"regions": mesh_ws.region_snapshot(), "primary": mesh_ws._primary_region_id()}


@router.get("/admin/mesh/clients")
async def admin_mesh_clients(admin: dict = Depends(require_admin)):
    clients = []
    for cid in list(mesh_ws.manager.active.keys()):
        m = mesh_ws.client_meta.get(cid, {})
        clients.append({
            "id": cid, "region": m.get("region", "us-east-1"),
            "connected_at": m.get("connected_at"),
            "message_count": m.get("message_count", 0),
            "voice": m.get("voice") or "Orion",
            "e2e": m.get("e2e", False), "online": True,
        })
    return {"total": len(clients), "clients": clients}


@router.post("/admin/mesh/clients/{client_id}/disconnect")
async def admin_mesh_disconnect(client_id: str, admin: dict = Depends(require_admin)):
    ok = await mesh_ws.force_disconnect(client_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Client not connected")
    return {"ok": True, "client_id": client_id}


@router.get("/admin/mesh/queue")
async def admin_mesh_queue(admin: dict = Depends(require_admin)):
    return await mesh_ws.queue_stats()


@router.post("/admin/mesh/queue/flush")
async def admin_mesh_queue_flush(admin: dict = Depends(require_admin)):
    cleared = await mesh_ws.flush_all_queues()
    return {"ok": True, "cleared": cleared}


class MeshBroadcastBody(BaseModel):
    message: str


@router.post("/admin/mesh/broadcast")
async def admin_mesh_broadcast(body: MeshBroadcastBody, admin: dict = Depends(require_admin)):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message required")
    sent = await mesh_ws.broadcast_all(body.message.strip())
    return {"ok": True, "recipients": sent}


@router.get("/admin/mesh/voice-stats")
async def admin_mesh_voice_stats(admin: dict = Depends(require_admin)):
    usage = [{"voice": k, "count": v} for k, v in sorted(mesh_ws.VOICE_USAGE.items(), key=lambda x: -x[1])]
    return {"usage": usage, "total": sum(mesh_ws.VOICE_USAGE.values()),
            "voices": [v["name"] for v in voice_engine.VOICES]}


class FailoverBody(BaseModel):
    region: str


@router.post("/admin/mesh/failover")
async def admin_mesh_failover(body: FailoverBody, admin: dict = Depends(require_admin)):
    if not mesh_ws.set_primary_region(body.region):
        raise HTTPException(status_code=404, detail="Unknown region")
    await mesh_ws.emit_event("failover", f"Failover executed — {body.region} promoted to primary", region=body.region)
    return {"ok": True, "primary": body.region, "regions": mesh_ws.region_snapshot()}


@router.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(200)


@router.get("/admin/conversations")
async def admin_conversations(admin: dict = Depends(require_admin)):
    pipeline = [
        {"$sort": {"ts": 1}},
        {"$group": {"_id": "$session_id", "title": {"$first": "$content"},
                    "last_ts": {"$last": "$ts"}, "count": {"$sum": 1},
                    "user_id": {"$first": "$user_id"}, "model": {"$last": "$model"}}},
        {"$sort": {"last_ts": -1}}, {"$limit": 50},
    ]
    docs = await db.chat_messages.aggregate(pipeline).to_list(50)
    user_ids = [d["user_id"] for d in docs if d.get("user_id")]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "email": 1}).to_list(200)
    email_map = {u["id"]: u["email"] for u in users}
    return [{"session_id": d["_id"], "title": (d.get("title") or "")[:100], "last_ts": d.get("last_ts"),
             "count": d.get("count", 0), "model": d.get("model"),
             "user_email": email_map.get(d.get("user_id"), "guest")} for d in docs]


class KnowledgeBody(BaseModel):
    title: str
    content: str
    tags: List[str] = []


@router.get("/admin/knowledge")
async def admin_list_knowledge(admin: dict = Depends(require_admin)):
    return await db.knowledge.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)


@router.post("/admin/knowledge")
async def admin_create_knowledge(body: KnowledgeBody, admin: dict = Depends(require_admin)):
    doc = {"id": str(uuid.uuid4()), "title": body.title.strip(), "content": body.content.strip(),
           "tags": body.tags, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.knowledge.insert_one({**doc})
    return doc


@router.put("/admin/knowledge/{doc_id}")
async def admin_update_knowledge(doc_id: str, body: KnowledgeBody, admin: dict = Depends(require_admin)):
    res = await db.knowledge.update_one({"id": doc_id}, {"$set": {
        "title": body.title.strip(), "content": body.content.strip(), "tags": body.tags,
        "updated_at": datetime.now(timezone.utc).isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"updated": doc_id}


@router.delete("/admin/knowledge/{doc_id}")
async def admin_delete_knowledge(doc_id: str, admin: dict = Depends(require_admin)):
    res = await db.knowledge.delete_one({"id": doc_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": doc_id}
