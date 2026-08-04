import os
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel

db = None
JWT_ALGORITHM = "HS256"
router = APIRouter(prefix="/auth")


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
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15)}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


def _set_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def _public(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"], "name": user.get("name", ""),
            "role": user.get("role", "user"), "plan": user.get("plan", "free"),
            "plan_expires": user.get("plan_expires"), "plan_started": user.get("plan_started")}


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
        "password_hash": hash_password(body.password), "role": "user", "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one({**user})
    _set_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return _public(user)


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
    _set_cookies(response, create_access_token(user["id"], email), create_refresh_token(user["id"]))
    return _public(user)


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
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return _public(user)


class ProfileUpdate(BaseModel):
    name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.patch("/profile")
async def update_profile(body: ProfileUpdate, request: Request):
    user = await get_current_user(request)
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    await db.users.update_one({"id": user["id"]}, {"$set": {"name": name[:80]}})
    user["name"] = name[:80]
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
