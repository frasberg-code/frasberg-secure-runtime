import os
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException

from core import db, PAID_PLANS, PLAN_QUOTAS, _is_team_email, _enforce_plan_quotas, _log_email

logger = logging.getLogger(__name__)

TRIAL_KEY_CREDITS = 2500
LOW_CREDIT_THRESHOLD = 500
QUOTA_ALERT_PCT = 0.8


async def _key_owner_unmetered(key_doc: dict) -> bool:
    owner = await db.users.find_one({"id": key_doc.get("user_id")}, {"role": 1, "plan": 1, "email": 1})
    return bool(owner and (owner.get("role") == "admin" or owner.get("plan") in PAID_PLANS
                           or _is_team_email(owner.get("email"))))


def _insufficient_credits():
    return HTTPException(status_code=402, detail={
        "error": "insufficient_credits",
        "message": "This key is out of credits. Top up at half the price of other providers.",
        "purchase_url": "https://frasberg.com/pay"})


async def _key_period_usage(key_id: str, period: Optional[str]) -> int:
    now = datetime.now(timezone.utc)
    if period == "daily":
        q = {"key_id": key_id, "day": now.strftime("%Y-%m-%d")}
    elif period == "weekly":
        days = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
        q = {"key_id": key_id, "day": {"$in": days}}
    elif period == "monthly":
        q = {"key_id": key_id, "day": {"$regex": f"^{now.strftime('%Y-%m')}"}}
    else:
        q = {"key_id": key_id}
    docs = await db.api_key_usage.find(q, {"tokens": 1}).to_list(2000)
    return sum(d.get("tokens", 0) for d in docs)


async def _validate_bearer_key(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key")
    key = authorization.split(" ", 1)[1].strip()
    key_doc = await db.api_keys.find_one({"key": key}, {"_id": 0})
    if not key_doc:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if key_doc.get("suspended"):
        raise HTTPException(status_code=403, detail="Account suspended — contact support@frasberg.com")
    exp = key_doc.get("expires_at")
    if exp and exp < datetime.now(timezone.utc).isoformat():
        raise HTTPException(status_code=401, detail="API key expired")
    await _enforce_plan_quotas(key, key_doc)
    if key_doc.get("restrict_key") and key_doc.get("usage_limit_credits") and not key_doc.get("unlimited"):
        used = await _key_period_usage(key_doc["id"], key_doc.get("credit_refresh_period"))
        if used >= key_doc["usage_limit_credits"]:
            period_lbl = key_doc.get("credit_refresh_period") or "lifetime"
            raise HTTPException(status_code=429, detail={
                "error": "key_usage_limit", "code": "FK-429",
                "message": f"This key hit its usage limit of {key_doc['usage_limit_credits']} credits per {period_lbl}. Raise it in Edit API Key."})
    key_doc["_unmetered"] = key_doc.get("unlimited") or await _key_owner_unmetered(key_doc)
    if not key_doc["_unmetered"] and key_doc.get("credits", 0) <= 0:
        raise _insufficient_credits()
    return key_doc


async def _maybe_autotopup(key_id: str):
    key_doc = await db.api_keys.find_one({"id": key_id}, {"_id": 0})
    if not key_doc:
        return
    at = key_doc.get("autotopup") or {}
    if not at.get("enabled") or key_doc.get("credits", 0) >= at.get("threshold", 500):
        return
    owner_id = key_doc.get("user_id")
    owner = await db.users.find_one({"id": owner_id}, {"credit_balance": 1})
    wallet = (owner or {}).get("credit_balance", 0)
    transfer = min(int(at.get("amount", 5000)), int(wallet))
    if transfer <= 0:
        return
    await db.users.update_one({"id": owner_id}, {"$inc": {"credit_balance": -transfer}})
    await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": transfer}})
    await db.credit_transfers.insert_one({
        "id": str(uuid.uuid4()), "key_id": key_id, "user_id": owner_id,
        "amount": transfer, "kind": "autotopup",
        "ts": datetime.now(timezone.utc).isoformat()})
    logger.info("auto top-up: %s tokens -> key %s", transfer, key_id)


async def _maybe_quota_alert(key_id: str):
    key_doc = await db.api_keys.find_one({"id": key_id}, {"user_id": 1})
    if not key_doc:
        return
    owner = await db.users.find_one({"id": key_doc["user_id"]}, {"id": 1, "email": 1, "plan": 1, "name": 1, "role": 1})
    if not owner or owner.get("role") == "admin" or _is_team_email(owner.get("email")):
        return
    plan = owner.get("plan", "free")
    cap = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["pro"])["monthly_tokens"]
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    key_ids = [k["id"] async for k in db.api_keys.find({"user_id": owner["id"]}, {"id": 1})]
    if not key_ids:
        return
    agg = await db.api_key_usage.aggregate([
        {"$match": {"key_id": {"$in": key_ids}, "day": {"$regex": f"^{month}"}}},
        {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}}}]).to_list(1)
    used = agg[0]["tokens"] if agg else 0
    if used < QUOTA_ALERT_PCT * cap:
        return
    res = await db.quota_alerts.update_one(
        {"user_id": owner["id"], "month": month},
        {"$setOnInsert": {"sent_at": datetime.now(timezone.utc).isoformat(), "used": used, "cap": cap}},
        upsert=True)
    if res.upserted_id is None:
        return
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    email = owner.get("email")
    if not (api_key_env and email):
        return
    pct = min(100, round(used / cap * 100))
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:#f59e0b;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Quota Alert</p>"
            f"<h2 style='margin:8px 0;'>You've used {pct}% of your monthly token quota</h2>"
            f"<p style='color:#94a3b8;'><b style='color:#f8fafc'>{used:,}</b> of <b style='color:#f8fafc'>{cap:,}</b> tokens used this month on your "
            f"<b style='color:#f8fafc'>{plan}</b> plan. Requests are blocked once the quota is reached.</p>"
            f"<div style='background:#1e293b;border-radius:8px;height:10px;margin:16px 0;overflow:hidden;'>"
            f"<div style='background:#f59e0b;height:10px;width:{pct}%;'></div></div>"
            f"<p style='margin-top:16px;'><a href='https://frasberg.com/dashboard' style='color:#1A4FFF;'>Upgrade your plan \u2192</a> "
            f"<span style='color:#64748b;font-size:12px;'>for a higher monthly quota and faster rate limits.</span></p></div>")
    try:
        import resend as _resend
        _resend.api_key = api_key_env
        params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [email],
                  "subject": f"\u26a0\ufe0f {pct}% of your monthly Luchii quota used \u2014 {used:,}/{cap:,} tokens", "html": html}
        await asyncio.to_thread(_resend.Emails.send, params)
        await _log_email("quota_alert", email, params["subject"], True, owner["id"])
        logger.info("quota alert sent to %s (%s%%)", email, pct)
    except Exception:
        await _log_email("quota_alert", email, "quota alert", False, owner["id"])
        logger.exception("quota alert email failed")


async def _maybe_low_credit_alert(key_id: str):
    key_doc = await db.api_keys.find_one({"id": key_id})
    if not key_doc:
        return
    credits = key_doc.get("credits", 0)
    threshold = int(key_doc.get("alert_threshold", LOW_CREDIT_THRESHOLD))
    if credits >= threshold:
        if key_doc.get("low_credit_alerted"):
            await db.api_keys.update_one({"id": key_id}, {"$unset": {"low_credit_alerted": ""}})
        return
    if key_doc.get("low_credit_alerted"):
        return
    api_key_env = os.environ.get("RESEND_API_KEY", "")
    owner = await db.users.find_one({"id": key_doc.get("user_id")}, {"email": 1})
    email = (owner or {}).get("email")
    if not (api_key_env and email):
        return
    await db.api_keys.update_one({"id": key_id}, {"$set": {"low_credit_alerted": True}})
    html = (f"<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
            f"<p style='color:#f59e0b;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Low Credit Alert</p>"
            f"<h2 style='margin:8px 0;'>Key \u201c{key_doc.get('name', 'API key')}\u201d is running low</h2>"
            f"<p style='color:#94a3b8;'>Only <b style='color:#f8fafc'>{credits:,}</b> credits left (alert threshold: {threshold:,}). "
            f"Requests will stop streaming once credits hit zero.</p>"
            f"<p style='margin-top:16px;'><a href='https://frasberg.com/dashboard' style='color:#1A4FFF;'>Top up now \u2192</a> "
            f"<span style='color:#64748b;font-size:12px;'>or enable Auto Top-Up in your dashboard so this never happens again.</span></p></div>")
    try:
        import resend as _resend
        _resend.api_key = api_key_env
        params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [email],
                  "subject": f"\u26a0\ufe0f Low credits on \u201c{key_doc.get('name', 'API key')}\u201d \u2014 {credits:,} left", "html": html}
        await asyncio.to_thread(_resend.Emails.send, params)
        await _log_email("low_credit_alert", email, params["subject"], True, key_doc.get("user_id"))
        logger.info("low credit alert sent for key %s", key_id)
    except Exception:
        logger.exception("low credit alert failed")
        await _log_email("low_credit_alert", email, f"Low credits on {key_doc.get('name', 'API key')}", False, key_doc.get("user_id"))


async def _meter_key(key_id: str, tokens: int, deduct: bool = False):
    now = datetime.now(timezone.utc)
    inc = {"request_count": 1, "token_count": tokens}
    if deduct:
        inc["credits"] = -tokens
    await db.api_keys.update_one({"id": key_id}, {"$inc": inc,
                                                  "$set": {"last_used": now.isoformat()}})
    await db.api_key_usage.update_one({"key_id": key_id, "day": now.strftime("%Y-%m-%d")},
                                      {"$inc": {"requests": 1, "tokens": tokens}}, upsert=True)
    if deduct:
        await _maybe_autotopup(key_id)
        await _maybe_low_credit_alert(key_id)
