import os
import re
import uuid
import asyncio
import logging
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel

db = None
JWT_ALGORITHM = "HS256"
router = APIRouter(prefix="/auth")


TEAM_DOMAIN = "@frasbergai.com"
TEAM_DOMAINS = ("@frasbergai.com", "@frasberg.com")
SIGNUP_TOKENS = 50
DAILY_TOKENS = 100
CHAT_TOKEN_COST = 1
BUILD_TOKEN_COST = 5


def setup(database):
    global db
    db = database


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=1)}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def _set_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=86400, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=2592000, path="/")


def _public(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"], "name": user.get("name", ""),
            "role": user.get("role", "user"), "plan": user.get("plan", "free"),
            "plan_expires": user.get("plan_expires"), "plan_started": user.get("plan_started"),
            "tokens": user.get("tokens", 0), "avatar": user.get("avatar")}


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        if header.lower().startswith("bearer "):
            token = header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("plan") in ("trial", "builder", "pro", "premium") and user.get("plan_expires"):
        try:
            if datetime.fromisoformat(user["plan_expires"]) < datetime.now(timezone.utc):
                await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "free"}, "$unset": {"plan_expires": "", "plan_started": ""}})
                user["plan"] = "free"
                user.pop("plan_expires", None)
                user.pop("plan_started", None)
        except Exception:
            pass
    return user


class RegisterBody(BaseModel):
    name: str = ""
    email: str
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


LOCKOUT_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


async def _check_lockout(identifier: str):
    doc = await db.login_attempts.find_one({"identifier": identifier})
    if doc and doc.get("count", 0) >= LOCKOUT_ATTEMPTS:
        last = datetime.fromisoformat(doc["last_attempt"])
        if datetime.now(timezone.utc) - last < timedelta(minutes=LOCKOUT_MINUTES):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        await db.login_attempts.delete_one({"identifier": identifier})


async def _record_failure(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )


async def _send_welcome_email(email: str, name: str):
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        return
    html = (
        "<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
        "<p style='color:#1A4FFF;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Welcome to Frasberg</p>"
        f"<h2 style='margin:8px 0;'>Hey {name} — you're in.</h2>"
        "<p style='color:#94a3b8;'>Your account is live. Here's how to make your first Luchii call in under a minute:</p>"
        "<ol style='color:#cbd5e1;font-size:14px;line-height:1.8;'>"
        "<li>Open your <a href='https://frasberg.com/dashboard' style='color:#1A4FFF;'>Developer Dashboard</a> and generate an API key</li>"
        "<li>Call the gateway:</li></ol>"
        "<pre style='background:#020617;border:1px solid #1e293b;border-radius:10px;padding:14px;color:#7dd3fc;font-size:12px;overflow-x:auto;'>"
        "curl -N -X POST https://frasberg.com/api/v1/chat/completions \\\n"
        "  -H \"Authorization: Bearer YOUR_API_KEY\" \\\n"
        "  -H \"Content-Type: application/json\" \\\n"
        "  -d '{\"model\":\"luchii-6-plus\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello Luchii\"}]}'</pre>"
        "<p style='color:#64748b;font-size:12px;margin-top:16px;'>Docs: https://frasberg.com/docs · Status: https://frasberg.com/status · support@frasberg.com</p></div>"
    )
    try:
        import resend
        resend.api_key = api_key
        params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [email],
                  "subject": "Welcome to Frasberg — your Luchii quickstart", "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        ok = True
    except Exception:
        logging.getLogger(__name__).exception("welcome email failed")
        ok = False
    try:
        await db.email_log.insert_one({"id": str(uuid.uuid4()), "kind": "welcome", "to": email,
                                       "subject": "Welcome to Frasberg — your Luchii quickstart",
                                       "ok": ok, "user_id": None,
                                       "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


@router.post("/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.strip().lower()
    if "@" not in email or len(email) < 5:
        raise HTTPException(status_code=400, detail="A valid email is required")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = {
        "id": str(uuid.uuid4()), "email": email, "name": body.name.strip() or email.split("@")[0],
        "password_hash": hash_password(body.password), "role": "user",
        "plan": "scale" if email.endswith(TEAM_DOMAINS) else "free",
        "tokens": SIGNUP_TOKENS,
        "last_token_grant": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one({**user})
    await _ledger(user["id"], "signup_grant", SIGNUP_TOKENS, "Welcome gift — 50 Frasberg tokens")
    asyncio.create_task(_send_welcome_email(email, user["name"]))
    _set_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return _public(user)


class ForgotBody(BaseModel):
    email: str
    origin_url: str = ""


class ResetBody(BaseModel):
    token: str
    password: str


async def _send_reset_email(email: str, name: str, link: str):
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        logging.getLogger(__name__).info("RESET LINK (no mailer): %s", link)
        return
    html = (
        "<div style='font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:28px;border-radius:14px;'>"
        "<p style='color:#1A4FFF;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Account</p>"
        f"<h2 style='margin:8px 0;'>Reset your password{', ' + name if name else ''}</h2>"
        "<p style='color:#94a3b8;'>We got a request to reset your Luchii password. This link works for 1 hour:</p>"
        f"<p><a href='{link}' style='display:inline-block;background:#1A4FFF;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold;'>Reset password</a></p>"
        f"<p style='color:#64748b;font-size:12px;'>Or paste this link into your browser:<br>{link}</p>"
        "<p style='color:#64748b;font-size:12px;margin-top:16px;'>Didn't ask for this? You can safely ignore this email — your password stays the same.</p></div>"
    )
    try:
        import resend
        resend.api_key = api_key
        await asyncio.to_thread(resend.Emails.send, {
            "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [email],
            "subject": "Reset your Frasberg password", "html": html})
        ok = True
    except Exception:
        logging.getLogger(__name__).exception("reset email failed")
        ok = False
    try:
        await db.email_log.insert_one({"id": str(uuid.uuid4()), "kind": "password_reset", "to": email,
                                       "subject": "Reset your Frasberg password", "ok": ok,
                                       "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


@router.post("/forgot-password")
async def forgot_password(body: ForgotBody):
    email = body.email.strip().lower()
    generic = {"ok": True, "message": "If that email has a Frasberg account, a reset link is on its way."}
    user = await db.users.find_one({"email": email})
    if not user:
        return generic
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token, "user_id": user["id"], "email": email, "used": False,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()})
    origin = (body.origin_url or "https://frasberg.com").rstrip("/")
    link = f"{origin}/auth?mode=reset&token={token}"
    asyncio.create_task(_send_reset_email(email, user.get("name", ""), link))
    return generic


@router.post("/reset-password")
async def reset_password(body: ResetBody):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    doc = await db.password_reset_tokens.find_one({"token": body.token})
    expired = not doc or doc.get("used") or datetime.fromisoformat(doc["expires_at"]) < datetime.now(timezone.utc)
    if expired:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired — request a new one.")
    await db.users.update_one({"id": doc["user_id"]}, {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    await db.login_attempts.delete_many({"identifier": {"$regex": f":{re.escape(doc['email'])}$"}})
    return {"ok": True, "message": "Password updated — sign in with your new password."}


@router.post("/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await _check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await _record_failure(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    if email.endswith(TEAM_DOMAINS) and user.get("plan") not in ("scale", "enterprise"):
        await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "scale"}})
        user["plan"] = "scale"
    granted = await _grant_daily_tokens(user["id"])
    if granted:
        user["tokens"] = user.get("tokens", 0) + granted
    _set_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return _public(user)


async def _grant_daily_tokens(user_id: str) -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    res = await db.users.update_one(
        {"id": user_id, "last_token_grant": {"$ne": today}},
        {"$inc": {"tokens": DAILY_TOKENS}, "$set": {"last_token_grant": today}})
    if res.modified_count:
        await _ledger(user_id, "daily_grant", DAILY_TOKENS, "Daily Frasberg Gift — 100 free tokens")
        return DAILY_TOKENS
    return 0


async def _ledger(user_id: str, kind: str, amount: int, note: str = ""):
    try:
        await db.token_ledger.insert_one({"id": str(uuid.uuid4()), "user_id": user_id, "kind": kind,
                                          "amount": amount, "note": note,
                                          "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


def token_exempt(user: dict) -> bool:
    return user.get("role") == "admin" or user.get("email", "").endswith(TEAM_DOMAINS)


async def spend_tokens(user_id: str, amount: int, kind: str, note: str = "") -> bool:
    res = await db.users.update_one({"id": user_id, "tokens": {"$gte": amount}},
                                    {"$inc": {"tokens": -amount}})
    if res.modified_count:
        await _ledger(user_id, kind, -amount, f"{note} — free tokens")
        return True
    res = await db.users.update_one({"id": user_id, "credit_balance": {"$gte": amount}},
                                    {"$inc": {"credit_balance": -amount}})
    if res.modified_count:
        await _ledger(user_id, kind, -amount, f"{note} — purchased tokens")
        return True
    return False


@router.get("/gift")
async def gift_status(request: Request):
    user = await get_current_user(request)
    granted = await _grant_daily_tokens(user["id"])
    doc = await db.users.find_one({"id": user["id"]}, {"tokens": 1, "last_token_grant": 1,
                                                       "created_at": 1, "credit_balance": 1})
    return {"tokens": (doc or {}).get("tokens", 0), "granted_today": granted,
            "paid_tokens": int((doc or {}).get("credit_balance", 0)),
            "signup_grant": SIGNUP_TOKENS, "daily_grant": DAILY_TOKENS,
            "chat_cost": CHAT_TOKEN_COST, "build_cost": BUILD_TOKEN_COST,
            "exempt": token_exempt(user),
            "last_grant": (doc or {}).get("last_token_grant"),
            "member_since": (doc or {}).get("created_at")}


@router.get("/gift/ledger")
async def gift_ledger(request: Request):
    user = await get_current_user(request)
    return await db.token_ledger.find({"user_id": user["id"]}, {"_id": 0}).sort("ts", -1).to_list(30)


_NOTIF_TITLES = {
    "gift_received": "🎁 Gift received",
    "daily_grant": "✦ Daily tokens claimed",
    "signup_grant": "✦ Welcome gift",
}


@router.get("/notifications")
async def notifications(request: Request):
    user = await get_current_user(request)
    rows = await db.token_ledger.find(
        {"user_id": user["id"], "kind": {"$in": list(_NOTIF_TITLES)}},
        {"_id": 0, "id": 1, "kind": 1, "amount": 1, "note": 1, "ts": 1},
    ).sort("ts", -1).to_list(15)
    return [{"id": r["id"], "kind": r["kind"], "ts": r["ts"],
             "title": f"{_NOTIF_TITLES[r['kind']]} — +{r['amount']:,} tokens",
             "detail": r.get("note", "")} for r in rows]


class GiftTransferBody(BaseModel):
    email: str
    amount: int


async def _send_gift_email(to_email: str, from_email: str, amount: int):
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        return
    subject = f"🎁 You received {amount:,} Frasberg tokens from {from_email}"
    html = (
        "<div style='font-family:Arial,sans-serif;background:#0B1220;color:#f8fafc;padding:28px;border-radius:14px;'>"
        "<p style='color:#FBBF24;font-size:12px;letter-spacing:2px;text-transform:uppercase;'>Frasberg Gift</p>"
        f"<h2 style='margin:8px 0;'>A gift just landed in your account 🎁</h2>"
        f"<p style='color:#94a3b8;'><b style='color:#f8fafc'>{from_email}</b> sent you "
        f"<b style='color:#22D3EE'>{amount:,} Frasberg tokens</b>. They're already in your balance — "
        "spend them on Luchii chat, builds, or gift them onward.</p>"
        "<p style='margin-top:16px;'><a href='https://frasberg.com/dashboard' style='color:#22D3EE;'>Open your Frasberg Gift card →</a></p>"
        "<p style='color:#64748b;font-size:12px;margin-top:16px;'>frasberg.com · support@frasberg.com</p></div>"
    )
    try:
        import resend
        resend.api_key = api_key
        params = {"from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"), "to": [to_email],
                  "subject": subject, "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        ok = True
    except Exception:
        logging.getLogger(__name__).exception("gift email failed")
        ok = False
    try:
        await db.email_log.insert_one({"id": str(uuid.uuid4()), "kind": "gift_received", "to": to_email,
                                       "subject": subject, "ok": ok, "user_id": None,
                                       "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


@router.post("/gift/transfer")
async def gift_transfer(body: GiftTransferBody, request: Request):
    user = await get_current_user(request)
    email = body.email.strip().lower()
    amount = int(body.amount)
    if amount < 1 or amount > 1000000:
        raise HTTPException(status_code=400, detail="Amount must be between 1 and 1,000,000")
    if email == user["email"]:
        raise HTTPException(status_code=400, detail="You can't gift tokens to yourself")
    recipient = await db.users.find_one({"email": email}, {"id": 1, "email": 1})
    if not recipient:
        raise HTTPException(status_code=404, detail="No Frasberg account with that email")
    res = await db.users.update_one({"id": user["id"], "credit_balance": {"$gte": amount}},
                                    {"$inc": {"credit_balance": -amount}})
    if not res.modified_count:
        raise HTTPException(status_code=400,
                            detail="Only purchased tokens can be gifted — free daily tokens stay on your account. Top up your wallet to send gifts.")
    await db.users.update_one({"id": recipient["id"]}, {"$inc": {"credit_balance": amount}})
    await _ledger(user["id"], "gift_sent", -amount, f"Gift to {email} — purchased tokens")
    await _ledger(recipient["id"], "gift_received", amount, f"Gift from {user['email']} — purchased tokens")
    asyncio.create_task(_send_gift_email(email, user["email"], amount))
    await db.credit_transfers.insert_one({"id": str(uuid.uuid4()), "kind": "gift", "from_user": user["id"],
                                          "to_user": recipient["id"], "amount": amount,
                                          "ts": datetime.now(timezone.utc).isoformat()})
    doc = await db.users.find_one({"id": user["id"]}, {"credit_balance": 1})
    return {"ok": True, "sent": amount, "to": email,
            "paid_tokens": int((doc or {}).get("credit_balance", 0))}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", samesite="none", secure=True)
    response.delete_cookie("refresh_token", path="/", samesite="none", secure=True)
    return {"ok": True}


@router.get("/me")
async def me(request: Request):
    user = await get_current_user(request)
    return _public(user)


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie("access_token", create_access_token(user["id"], user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    return _public(user)


class ProfileUpdate(BaseModel):
    name: str | None = None
    avatar: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.patch("/profile")
async def update_profile(body: ProfileUpdate, request: Request):
    user = await get_current_user(request)
    updates = {}
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        updates["name"] = name[:80]
    if body.avatar is not None:
        if body.avatar == "":
            updates["avatar"] = None
        else:
            if not body.avatar.startswith("data:image/") or len(body.avatar) > 300_000:
                raise HTTPException(status_code=400, detail="Avatar must be an image under ~200KB")
            updates["avatar"] = body.avatar
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    user.update(updates)
    return _public(user)


@router.post("/change-password")
async def change_password(body: PasswordChange, request: Request):
    user = await get_current_user(request)
    doc = await db.users.find_one({"id": user["id"]})
    if not verify_password(body.current_password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
    return {"ok": True}


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@frasberg.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "LuchiiAdmin2026!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email, "name": "Frasberg Admin",
            "password_hash": hash_password(admin_password), "role": "admin", "plan": "pro",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})


async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.login_attempts.create_index("identifier")
