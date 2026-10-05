import io
import os
import time
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

import auth as auth_module
from core import db

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ FRASBERG SECURITY SHIELD ============
SHIELD_FLAGGED_EVENTS = {
    "RIGHT_CLICK_BLOCKED", "COPY_BLOCKED", "CUT_BLOCKED",
    "DEVTOOLS_OPEN_DETECTED", "DEVTOOLS_SHORTCUT_BLOCKED",
}
SHIELD_BREACH_THRESHOLD = int(os.environ.get("BREACH_THRESHOLD", "5"))
SHIELD_CD_THRESHOLD = int(os.environ.get("CD_THRESHOLD", "10"))
SHIELD_OWNER = {
    "name": os.environ.get("OWNER_NAME", "Frasberg Selassie"),
    "legal": os.environ.get("OWNER_LEGAL", "MR. CLAYTON-M. BERNARD-EX."),
    "company": os.environ.get("OWNER_COMPANY", "FRASBERG INC."),
    "email": os.environ.get("OWNER_EMAIL", "legal@frasberg.com"),
}


class SecurityLogBody(BaseModel):
    session_id: Optional[str] = None
    timestamp: Optional[str] = None
    event: str = "UNKNOWN"
    detail: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    url: Optional[str] = None


def _generate_cease_desist(ip: str, breach_count: int, events: list) -> str:
    o = SHIELD_OWNER
    d = datetime.now(timezone.utc).strftime("%B %d, %Y")
    ev_lines = "\n".join(f"  {i + 1}. {e}" for i, e in enumerate(events))
    return f"""================================================================================
                        CEASE AND DESIST NOTICE
================================================================================
Date: {d}

FROM: {o['name']} ({o['legal']}) — Founder & Owner, {o['company']} — {o['email']}
TO:   Unknown Actor / Operator — IP Address: {ip}

RE: Unauthorized Access, Attempted Cloning, and Misappropriation of Protected
    Intellectual Property — LUCHII AI & FRASBERG ENGINE

I. OWNERSHIP: {o['company']} is the sole owner of LUCHII (model weights,
architecture, identity, persona) and the FRASBERG ENGINE (source code,
configurations, pipelines), protected under the Frasberg Public License (FPL),
copyright law, trade secret law, and international IP treaties.

II. YOUR CONDUCT: Security systems have logged {breach_count} unauthorized
intrusion events from IP {ip}, including:
{ev_lines}

III. DEMANDS: You are ORDERED to immediately (1) CEASE all cloning or
replication of LUCHII or the Frasberg Engine; (2) DESTROY all unauthorized
copies; (3) CEASE all unauthorized access; (4) PROVIDE written confirmation
of compliance within 72 hours.

IV. NON-COMPLIANCE will result in civil litigation, criminal referral, and
DMCA takedown filings. All rights of {o['company']} are expressly reserved.

Signed, {o['name']} ({o['legal']}), Founder & Owner, {o['company']} — {d}
================================================================================"""


async def _shield_email(subject: str, html: str):
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    if not api_key_env:
        return
    to = os.environ.get("ALERT_TO", "")
    targets = [to] if to else [a["email"] for a in await db.users.find({"role": "admin"}, {"email": 1}).to_list(10)]
    for t in targets:
        try:
            import resend
            resend.api_key = api_key_env
            await asyncio.to_thread(resend.Emails.send, {
                "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
                "to": [t], "subject": subject, "html": html})
        except Exception as e:
            logger.warning(f"shield email failed: {e}")


@router.post("/security/log")
async def shield_log(body: SecurityLogBody, request: Request):
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    flagged = body.event in SHIELD_FLAGGED_EVENTS
    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": str(uuid.uuid4()), "session_id": body.session_id, "ip": ip,
        "event": body.event[:80], "detail": (body.detail or "")[:300],
        "user_agent": (body.user_agent or "")[:300], "referrer": (body.referrer or "")[:300],
        "url": (body.url or "")[:300], "flagged": flagged, "created_at": body.timestamp or now,
    }
    await db.security_events.insert_one({**entry})
    if flagged:
        res = await db.ip_breach_summary.find_one_and_update(
            {"ip": ip},
            {"$inc": {"breach_count": 1}, "$set": {"last_seen": now},
             "$setOnInsert": {"cd_triggered": False, "cd_triggered_at": None}},
            upsert=True, return_document=True)
        count = res["breach_count"]
        if count == SHIELD_BREACH_THRESHOLD:
            await _shield_email(
                f"FRASBERG SHIELD — Breach Alert: {body.event} from {ip}",
                f"<div style='font-family:monospace;background:#0a0a0a;color:#00ff88;padding:30px;border-radius:8px;'>"
                f"<h2 style='color:#ff3333;'>SECURITY BREACH DETECTED</h2>"
                f"<p style='color:#ccc;'>IP: <b>{ip}</b><br/>Event: <b style='color:#ff6666;'>{body.event}</b><br/>"
                f"Detail: {entry['detail']}<br/>Total breaches: <b style='color:#ff3333;'>{count}</b></p>"
                f"<p style='color:#888;font-size:11px;'>{SHIELD_OWNER['company']} Security Shield · Luchii Sovereign Intelligence</p></div>")
        if count >= SHIELD_CD_THRESHOLD and not res.get("cd_triggered"):
            ev_docs = await db.security_events.find(
                {"ip": ip, "flagged": True}, {"_id": 0, "event": 1, "detail": 1, "created_at": 1},
            ).sort("created_at", -1).to_list(10)
            ev_list = [f"{e['event']} — {e.get('detail', '')} ({e['created_at'][:19]})" for e in ev_docs]
            cd_text = _generate_cease_desist(ip, count, ev_list)
            await db.cease_desist_log.insert_one({
                "id": str(uuid.uuid4()), "ip": ip, "cd_text": cd_text,
                "drafted_at": now, "sent": bool(os.environ.get("RESEND_API_KEY"))})
            await db.ip_breach_summary.update_one(
                {"ip": ip}, {"$set": {"cd_triggered": True, "cd_triggered_at": now}})
            await _shield_email(
                f"FRASBERG SHIELD — Cease & Desist Auto-Drafted for IP: {ip}",
                f"<div style='font-family:monospace;background:#0a0a0a;color:#00ff88;padding:30px;border-radius:8px;'>"
                f"<h2 style='color:#ff3333;'>CEASE &amp; DESIST AUTO-DRAFTED</h2>"
                f"<p style='color:#ccc;'>IP <b style='color:#ff6666;'>{ip}</b> exceeded the breach threshold.</p>"
                f"<pre style='color:#aaa;font-size:12px;white-space:pre-wrap;'>{cd_text}</pre></div>")
    return {"status": "logged", "flagged": flagged, "ip": ip}


async def _shield_admin(user: dict = Depends(auth_module.get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/security/logs")
async def shield_logs(user: dict = Depends(_shield_admin)):
    logs = await db.security_events.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"total": await db.security_events.count_documents({}), "logs": logs}


@router.get("/security/breaches")
async def shield_breaches(user: dict = Depends(_shield_admin)):
    rows = await db.ip_breach_summary.find({}, {"_id": 0}).sort("breach_count", -1).to_list(200)
    return {"total": len(rows), "breaches": rows}


@router.get("/security/cease-desist")
async def shield_cd(user: dict = Depends(_shield_admin)):
    rows = await db.cease_desist_log.find({}, {"_id": 0}).sort("drafted_at", -1).to_list(100)
    return {"total": len(rows), "records": rows}


# ============ SHIELD v4/v5: IP BAN + RATE LIMIT + GEO BLOCK ============
SHIELD_RATE_MAX = int(os.environ.get("RATE_MAX_REQUESTS", "600"))
SHIELD_STRIKE_LIMIT = int(os.environ.get("RATE_STRIKE_LIMIT", "3"))
SHIELD_BAN_HOURS = int(os.environ.get("RATE_BAN_HOURS", "24"))
SHIELD_EXEMPT_PREFIXES = ("/api/auth/", "/api/admin/", "/api/geo/")

_ban_cache = {"ips": set(), "ts": 0.0}
_geo_rules = {"countries": set(), "regions": set(), "ts": 0.0}
_ip_geo_mem = {}
_ip_reqs = {}


async def _refresh_ban_cache():
    now = datetime.now(timezone.utc).isoformat()
    rows = await db.banned_ips.find(
        {"active": True, "$or": [{"expires_at": None}, {"expires_at": {"$gt": now}}]},
        {"_id": 0, "ip": 1}).to_list(5000)
    _ban_cache["ips"] = {r["ip"] for r in rows}
    _ban_cache["ts"] = time.time()


async def _refresh_geo_rules():
    cs = await db.blocked_countries.find({"active": True}, {"_id": 0, "country_code": 1}).to_list(500)
    rs = await db.blocked_regions.find({"active": True}, {"_id": 0, "country_code": 1, "region_code": 1}).to_list(500)
    _geo_rules["countries"] = {c["country_code"].upper() for c in cs}
    _geo_rules["regions"] = {f"{r['country_code'].upper()}-{r['region_code'].upper()}" for r in rs}
    _geo_rules["ts"] = time.time()


async def _ban_ip(ip: str, reason: str, banned_by: str = "AUTO_SHIELD", expires_at=None):
    now = datetime.now(timezone.utc).isoformat()
    await db.banned_ips.update_one({"ip": ip}, {"$set": {
        "ip": ip, "reason": reason, "banned_by": banned_by, "banned_at": now,
        "expires_at": expires_at, "active": True, "unban_reason": None, "unbanned_at": None,
    }}, upsert=True)
    _ban_cache["ips"].add(ip)
    await _shield_email(
        f"FRASBERG SHIELD — IP BANNED: {ip}",
        f"<div style='font-family:monospace;background:#0a0a0a;color:#00ff88;padding:30px;border-radius:8px;'>"
        f"<h2 style='color:#ff3333;'>IP ADDRESS BANNED</h2>"
        f"<p style='color:#ccc;'>IP: <b style='color:#ff8c00;'>{ip}</b><br/>Reason: <b style='color:#ff6666;'>{reason}</b><br/>"
        f"Banned by: {banned_by}<br/>Expires: {expires_at or 'PERMANENT'}</p>"
        f"<p style='color:#888;font-size:11px;'>Unban from the Shield Dashboard or POST /api/admin/unban</p></div>")


async def _lookup_geo(ip: str):
    if ip in _ip_geo_mem:
        return _ip_geo_mem[ip]
    cached = await db.geo_cache.find_one({"ip": ip}, {"_id": 0})
    if cached:
        _ip_geo_mem[ip] = cached.get("geo")
        return cached.get("geo")
    geo = None
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,region,regionName,city")
            d = r.json()
            if d.get("status") == "success":
                geo = {"countryCode": d.get("countryCode"), "countryName": d.get("country"),
                       "regionCode": d.get("region"), "regionName": d.get("regionName"), "city": d.get("city")}
    except Exception:
        return None
    _ip_geo_mem[ip] = geo
    await db.geo_cache.update_one({"ip": ip}, {"$set": {"ip": ip, "geo": geo}}, upsert=True)
    return geo


async def shield_middleware(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/api") or any(path.startswith(p) for p in SHIELD_EXEMPT_PREFIXES):
        return await call_next(request)
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    now_t = time.time()
    if now_t - _ban_cache["ts"] > 30:
        await _refresh_ban_cache()
    if ip in _ban_cache["ips"]:
        return JSONResponse(status_code=403, content={
            "error": "ACCESS DENIED",
            "message": "Your IP has been blocked by FRASBERG SECURITY SHIELD.",
            "notice": "This incident has been logged. Legal action may follow. Contact legal@frasberg.com to dispute.",
            "ip": ip, "shield": "FRASBERG INC. · Luchii Sovereign Intelligence"})
    if now_t - _geo_rules["ts"] > 60:
        await _refresh_geo_rules()
    if _geo_rules["countries"] or _geo_rules["regions"]:
        geo = await _lookup_geo(ip)
        cc = (geo or {}).get("countryCode")
        if cc:
            cc = cc.upper()
            rk = f"{cc}-{(geo.get('regionCode') or '').upper()}" if geo.get("regionCode") else None
            if cc in _geo_rules["countries"] or (rk and rk in _geo_rules["regions"]):
                await db.geo_block_log.insert_one({
                    "id": str(uuid.uuid4()), "ip": ip, "country_code": cc,
                    "country_name": geo.get("countryName"), "region_code": geo.get("regionCode"),
                    "region_name": geo.get("regionName"), "city": geo.get("city"),
                    "endpoint": path, "user_agent": (request.headers.get("user-agent") or "")[:200],
                    "blocked_at": datetime.now(timezone.utc).isoformat()})
                return JSONResponse(status_code=403, content={
                    "error": "GEO_BLOCKED", "message": "Access from your region is restricted.",
                    "country": geo.get("countryName"), "countryCode": cc,
                    "notice": "FRASBERG INC. has restricted access from this geographic region. Contact legal@frasberg.com to dispute.",
                    "shield": "FRASBERG INC. · Luchii Sovereign Intelligence"})
    entry = _ip_reqs.get(ip)
    if not entry or now_t - entry["ws"] > 60:
        entry = {"count": 0, "ws": now_t, "strikes": entry["strikes"] if entry else 0}
        _ip_reqs[ip] = entry
    entry["count"] += 1
    if entry["count"] > SHIELD_RATE_MAX:
        entry["strikes"] += 1
        await db.rate_violations.insert_one({
            "id": str(uuid.uuid4()), "ip": ip, "endpoint": path,
            "user_agent": (request.headers.get("user-agent") or "")[:200],
            "violated_at": datetime.now(timezone.utc).isoformat()})
        if entry["strikes"] >= SHIELD_STRIKE_LIMIT:
            expires = (datetime.now(timezone.utc) + timedelta(hours=SHIELD_BAN_HOURS)).isoformat()
            await _ban_ip(ip, f"Auto-ban: {entry['strikes']} rate limit strikes. Endpoint: {path}", "RATE_LIMITER", expires)
            _ip_reqs.pop(ip, None)
            return JSONResponse(status_code=403, content={
                "error": "IP BANNED", "message": "Excessive requests detected. Your IP has been blocked.",
                "strikes": entry["strikes"], "ip": ip,
                "notice": "FRASBERG INC. security systems have flagged and banned this IP."})
        return JSONResponse(status_code=429, content={
            "error": "RATE_LIMIT_EXCEEDED", "message": f"Too many requests. Limit: {SHIELD_RATE_MAX} req/min.",
            "strikes": entry["strikes"], "strikeLimit": SHIELD_STRIKE_LIMIT,
            "retryAfter": int(entry["ws"] + 60 - now_t),
            "warning": f"{SHIELD_STRIKE_LIMIT - entry['strikes']} strike(s) remaining before IP ban.",
            "shield": "FRASBERG INC. · Luchii Sovereign Intelligence"})
    response = await call_next(request)
    response.headers["X-Shield"] = "FRASBERG-PROTECTED"
    response.headers["X-RateLimit-Limit"] = str(SHIELD_RATE_MAX)
    response.headers["X-RateLimit-Remaining"] = str(max(0, SHIELD_RATE_MAX - entry["count"]))
    return response


async def _shield_admin_or_key(request: Request) -> dict:
    key = request.headers.get("x-admin-key")
    admin_key = os.environ.get("ADMIN_API_KEY")
    if key and admin_key and key == admin_key:
        return {"id": "admin-key", "role": "admin"}
    user = await auth_module.get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class BanBody(BaseModel):
    ip: str
    reason: Optional[str] = None
    expires_hours: Optional[int] = None


class GeoCountryBody(BaseModel):
    country_code: str
    country_name: str
    reason: Optional[str] = None


class GeoRegionBody(BaseModel):
    country_code: str
    region_code: str
    region_name: str
    reason: Optional[str] = None


@router.get("/admin/banned")
async def admin_banned(user: dict = Depends(_shield_admin_or_key)):
    rows = await db.banned_ips.find({}, {"_id": 0}).sort("banned_at", -1).to_list(500)
    return {"total": len(rows), "banned": rows}


@router.post("/admin/ban")
async def admin_ban(body: BanBody, user: dict = Depends(_shield_admin_or_key)):
    expires = (datetime.now(timezone.utc) + timedelta(hours=body.expires_hours)).isoformat() if body.expires_hours else None
    await _ban_ip(body.ip.strip(), body.reason or "Manual ban", "ADMIN", expires)
    return {"status": "banned", "ip": body.ip.strip(), "expiresAt": expires}


@router.post("/admin/unban")
async def admin_unban(body: BanBody, user: dict = Depends(_shield_admin_or_key)):
    ip = body.ip.strip()
    await db.banned_ips.update_one({"ip": ip}, {"$set": {
        "active": False, "unban_reason": body.reason or "Manual unban",
        "unbanned_at": datetime.now(timezone.utc).isoformat()}})
    _ban_cache["ips"].discard(ip)
    return {"status": "unbanned", "ip": ip}


@router.delete("/admin/ban/{ip}")
async def admin_ban_delete(ip: str, user: dict = Depends(_shield_admin_or_key)):
    _ban_cache["ips"].discard(ip)
    await db.banned_ips.delete_one({"ip": ip})
    return {"status": "deleted", "ip": ip}


@router.get("/admin/rate-violations")
async def admin_rate_violations(user: dict = Depends(_shield_admin_or_key)):
    rows = await db.rate_violations.find({}, {"_id": 0}).sort("violated_at", -1).to_list(500)
    return {"total": len(rows), "violations": rows}


@router.get("/geo/countries")
async def geo_countries(user: dict = Depends(_shield_admin_or_key)):
    rows = await db.blocked_countries.find({}, {"_id": 0}).sort("blocked_at", -1).to_list(500)
    return {"total": len(rows), "countries": rows}


@router.post("/geo/countries")
async def geo_block_country(body: GeoCountryBody, user: dict = Depends(_shield_admin_or_key)):
    cc = body.country_code.strip().upper()
    await db.blocked_countries.update_one({"country_code": cc}, {"$set": {
        "country_code": cc, "country_name": body.country_name,
        "reason": body.reason or "Blocked by admin", "blocked_by": "ADMIN",
        "blocked_at": datetime.now(timezone.utc).isoformat(), "active": True}}, upsert=True)
    await _refresh_geo_rules()
    return {"status": "blocked", "country_code": cc, "country_name": body.country_name}


@router.delete("/geo/countries/{code}")
async def geo_unblock_country(code: str, user: dict = Depends(_shield_admin_or_key)):
    await db.blocked_countries.update_one({"country_code": code.upper()}, {"$set": {"active": False}})
    await _refresh_geo_rules()
    return {"status": "unblocked", "country_code": code.upper()}


@router.get("/geo/regions")
async def geo_regions(user: dict = Depends(_shield_admin_or_key)):
    rows = await db.blocked_regions.find({}, {"_id": 0}).sort("blocked_at", -1).to_list(500)
    return {"total": len(rows), "regions": rows}


@router.post("/geo/regions")
async def geo_block_region(body: GeoRegionBody, user: dict = Depends(_shield_admin_or_key)):
    cc, rc = body.country_code.strip().upper(), body.region_code.strip().upper()
    await db.blocked_regions.update_one({"country_code": cc, "region_code": rc}, {"$set": {
        "country_code": cc, "region_code": rc, "region_name": body.region_name,
        "reason": body.reason or "Blocked by admin", "blocked_by": "ADMIN",
        "blocked_at": datetime.now(timezone.utc).isoformat(), "active": True}}, upsert=True)
    await _refresh_geo_rules()
    return {"status": "blocked", "country_code": cc, "region_code": rc}


@router.delete("/geo/regions/{cc}/{rc}")
async def geo_unblock_region(cc: str, rc: str, user: dict = Depends(_shield_admin_or_key)):
    await db.blocked_regions.update_one(
        {"country_code": cc.upper(), "region_code": rc.upper()}, {"$set": {"active": False}})
    await _refresh_geo_rules()
    return {"status": "unblocked", "country_code": cc.upper(), "region_code": rc.upper()}


@router.get("/geo/lookup/{ip}")
async def geo_lookup(ip: str, user: dict = Depends(_shield_admin_or_key)):
    geo = await _lookup_geo(ip)
    if not geo:
        return {"result": "No geo data (private/local IP or lookup failed)"}
    return {"ip": ip, "geo": geo}


@router.get("/geo/log")
async def geo_log(user: dict = Depends(_shield_admin_or_key)):
    rows = await db.geo_block_log.find({}, {"_id": 0}).sort("blocked_at", -1).to_list(500)
    return {"total": len(rows), "log": rows}


@router.get("/security/cease-desist/{cd_id}/pdf")
async def shield_cd_pdf(cd_id: str, user: dict = Depends(_shield_admin_or_key)):
    doc = await db.cease_desist_log.find_one({"id": cd_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="C&D record not found")
    from reportlab.lib.pagesizes import LETTER
    from reportlab.pdfgen import canvas as rl_canvas

    def build():
        buf = io.BytesIO()
        c = rl_canvas.Canvas(buf, pagesize=LETTER)
        w, h = LETTER
        y = h - 50
        c.setFont("Courier-Bold", 13)
        c.drawCentredString(w / 2, y, "FRASBERG INC. — CEASE AND DESIST NOTICE")
        y -= 26
        c.setFont("Courier", 8.2)
        for line in (doc.get("cd_text") or "").split("\n"):
            while len(line) > 105:
                c.drawString(40, y, line[:105]); line = line[105:]; y -= 11
                if y < 50: c.showPage(); c.setFont("Courier", 8.2); y = h - 50
            c.drawString(40, y, line); y -= 11
            if y < 50: c.showPage(); c.setFont("Courier", 8.2); y = h - 50
        c.save()
        buf.seek(0)
        return buf
    buf = await asyncio.to_thread(build)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="cease_desist_{doc["ip"].replace(".", "_")}.pdf"'})


async def _build_digest() -> str:
    since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    ev = await db.security_events.count_documents({"created_at": {"$gte": since}})
    fl = await db.security_events.count_documents({"created_at": {"$gte": since}, "flagged": True})
    bans = await db.banned_ips.count_documents({"banned_at": {"$gte": since}})
    geo = await db.geo_block_log.count_documents({"blocked_at": {"$gte": since}})
    cd = await db.cease_desist_log.count_documents({"drafted_at": {"$gte": since}})
    top = await db.ip_breach_summary.find({}, {"_id": 0}).sort("breach_count", -1).to_list(5)
    rows = "".join(f"<tr><td style='padding:4px 12px;color:#ff8c00;'>{t['ip']}</td>"
                   f"<td style='padding:4px 12px;color:#ff3333;'>{t['breach_count']}</td>"
                   f"<td style='padding:4px 12px;'>{'C&D SENT' if t.get('cd_triggered') else '—'}</td></tr>" for t in top)
    return (f"<div style='font-family:monospace;background:#0a0a0a;color:#00ff88;padding:30px;border-radius:8px;'>"
            f"<h2>FRASBERG SHIELD — WEEKLY DIGEST</h2>"
            f"<table style='color:#ccc;font-size:13px;line-height:2;'>"
            f"<tr><td><b>Security events (7d):</b></td><td>{ev}</td></tr>"
            f"<tr><td><b>Flagged events:</b></td><td style='color:#ff8c00;'>{fl}</td></tr>"
            f"<tr><td><b>New IP bans:</b></td><td style='color:#ff3333;'>{bans}</td></tr>"
            f"<tr><td><b>Geo blocks:</b></td><td>{geo}</td></tr>"
            f"<tr><td><b>C&amp;D drafted:</b></td><td style='color:#4da6ff;'>{cd}</td></tr></table>"
            f"<h3 style='margin-top:16px;'>Top breach IPs</h3><table style='color:#ccc;font-size:12px;'>{rows}</table>"
            f"<p style='color:#888;font-size:11px;margin-top:16px;'>FRASBERG INC. · Luchii Sovereign Intelligence</p></div>")


@router.post("/admin/digest/send")
async def digest_send(user: dict = Depends(_shield_admin_or_key)):
    html = await _build_digest()
    await _shield_email("FRASBERG SHIELD — Weekly Security Digest", html)
    await db.shield_meta.update_one({"k": "last_digest"}, {"$set": {"v": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"status": "sent", "to": os.environ.get("ALERT_TO", "admins")}


async def digest_scheduler():
    while True:
        try:
            meta = await db.shield_meta.find_one({"k": "last_digest"}, {"_id": 0})
            last = datetime.fromisoformat(meta["v"]) if meta else None
            if not last or (datetime.now(timezone.utc) - last).days >= 7:
                html = await _build_digest()
                await _shield_email("FRASBERG SHIELD — Weekly Security Digest", html)
                await db.shield_meta.update_one({"k": "last_digest"}, {"$set": {"v": datetime.now(timezone.utc).isoformat()}}, upsert=True)
                logger.info("weekly shield digest sent")
        except Exception:
            logger.exception("digest scheduler error")
        await asyncio.sleep(6 * 3600)
