import os
import time
import uuid
import logging
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

import auth as auth_module

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
auth_module.setup(db)

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

MAX_MSG_LEN = 4000
RATE_LIMIT = 60          # requests
RATE_WINDOW = 60         # seconds
BLOCKED_TERMS = ["harm", "illegal", "dangerous", "exploit", "weapon"]
_rate_store = defaultdict(list)

SERVER_STARTED_AT = time.time()
_START_TIME = datetime.now(timezone.utc)
_REQ_METRICS = deque(maxlen=3000)  # (ts, duration_ms, status_code)

TEAM_DOMAIN = "@frasbergai.com"
TEAM_DOMAINS = ("@frasbergai.com", "@frasberg.com")


def _is_team_email(email) -> bool:
    return bool(email) and str(email).lower().strip().endswith(TEAM_DOMAINS)


def _rate_check(key: str):
    now = time.time()
    hits = [t for t in _rate_store[key] if now - t < RATE_WINDOW]
    if len(hits) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded (60 req/min)")
    hits.append(now)
    _rate_store[key] = hits


PLAN_QUOTAS = {
    "free": {"rpm": 30, "monthly_tokens": 100_000},
    "pro": {"rpm": 120, "monthly_tokens": 2_000_000},
    "scale": {"rpm": 600, "monthly_tokens": 20_000_000},
    "enterprise": {"rpm": 1200, "monthly_tokens": 200_000_000},
}


async def _enforce_plan_quotas(key: str, key_doc: dict):
    owner = await db.users.find_one({"id": key_doc.get("user_id")}, {"plan": 1, "email": 1})
    if _is_team_email((owner or {}).get("email")):
        return "team", {"rpm": 10**9, "monthly_tokens": 10**12}, 0
    plan = (owner or {}).get("plan", "free")
    q = PLAN_QUOTAS.get(plan, PLAN_QUOTAS["pro"])
    now = time.time()
    hits = [t for t in _rate_store[key] if now - t < RATE_WINDOW]
    if len(hits) >= q["rpm"]:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded ({q['rpm']} req/min on {plan} plan)")
    hits.append(now)
    _rate_store[key] = hits
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    agg = await db.api_key_usage.aggregate([
        {"$match": {"key_id": key_doc["id"], "day": {"$regex": f"^{month}"}}},
        {"$group": {"_id": None, "tokens": {"$sum": "$tokens"}}}]).to_list(1)
    used = agg[0]["tokens"] if agg else 0
    if used >= q["monthly_tokens"]:
        raise HTTPException(status_code=429,
                            detail=f"Monthly token quota reached ({q['monthly_tokens']:,} on {plan} plan). Upgrade to continue.")
    return plan, q, used


def _mask_key(k: str) -> str:
    return k[:12] + "•" * 8 + k[-4:] if len(k) > 20 else k


PLANS = {
    "starter": {"id": "starter", "name": "Starter", "price": "5.00", "credits": 10000, "blurb": "10,000 tokens · half the price of other providers"},
    "pro": {"id": "pro", "name": "Pro", "price": "12.50", "credits": 30000, "blurb": "30,000 tokens · production apps · half price"},
    "scale": {"id": "scale", "name": "Scale", "price": "50.00", "credits": 150000, "blurb": "150,000 tokens · best value · half price"},
}

UPGRADE_PLANS = {
    "trial": {"id": "trial", "name": "7-Day Trial", "price": "1.00", "kind": "upgrade", "plan": "trial", "period": "one-time · 7 days",
              "blurb": "Everything unlocked for 7 days — API & LLM keys, builders and advanced tools"},
    "builder": {"id": "builder", "name": "Builder", "price": "10.00", "kind": "upgrade", "plan": "builder", "period": "per month",
                "blurb": "API & LLM keys · advanced build tools · start shipping"},
    "luchii-pro": {"id": "luchii-pro", "name": "Luchii Pro", "price": "5.00", "kind": "upgrade", "plan": "pro", "period": "per month",
                   "blurb": "Pro badge · higher limits · priority access"},
    "luchii-premium": {"id": "luchii-premium", "name": "Luchii Premium", "price": "10.00", "kind": "upgrade", "plan": "premium", "period": "per month",
                       "blurb": "200 images/day · priority Video Creator · Premium badge · top limits"},
    "annual": {"id": "annual", "name": "Premium Annual", "price": "120.00", "kind": "upgrade", "plan": "premium", "period": "per year — $10/mo",
               "blurb": "Everything in Luchii Premium, billed yearly"},
    "api-pro": {"id": "api-pro", "name": "API Pro", "price": "12.50", "kind": "upgrade", "plan": "pro", "period": "per month",
                "blurb": "120 req/min · 2M tokens/month · unlimited API keys"},
    "api-scale": {"id": "api-scale", "name": "API Scale", "price": "50.00", "kind": "upgrade", "plan": "scale", "period": "per month",
                  "blurb": "600 req/min · 20M tokens/month · unlimited API keys · priority"},
    "linq-operator": {"id": "linq-operator", "name": "LINQ Operator", "price": "15.00", "kind": "upgrade", "plan": "builder", "period": "per month", "linq": True,
                      "blurb": "Governance engines · Ascension Ladder · API & LLM keys unlocked"},
    "linq-architect": {"id": "linq-architect", "name": "LINQ Architect", "price": "30.00", "kind": "upgrade", "plan": "pro", "period": "per month", "linq": True,
                       "blurb": "Everything in Operator · priority engine runs · Pro plan unlocked"},
    "linq-sovereign": {"id": "linq-sovereign", "name": "LINQ Sovereign", "price": "60.00", "kind": "upgrade", "plan": "premium", "period": "per month", "linq": True,
                       "blurb": "Full sovereignty · LINQ Live hosting · Premium plan · top limits"},
    "doc-single": {"id": "doc-single", "name": "Court Document Download", "price": "1.00", "kind": "doc_credits",
                   "doc_credits": 1, "blurb": "1 certified PDF download from the docket & laws library"},
    "doc-pack": {"id": "doc-pack", "name": "Docket Access Pack", "price": "5.00", "kind": "doc_credits",
                 "doc_credits": 10, "blurb": "10 certified PDF downloads from the docket & laws library"},
}

PAID_PLANS = {"trial", "builder", "pro", "premium", "scale"}


async def require_admin(user: dict = Depends(auth_module.get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def _audit(admin: dict, action: str, detail: dict = None):
    try:
        await db.admin_audit.insert_one({"id": str(uuid.uuid4()), "admin_id": admin.get("id"),
                                         "admin_email": admin.get("email"), "action": action,
                                         "detail": detail or {},
                                         "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


async def _log_email(kind: str, to: str, subject: str, ok: bool, user_id: str = None):
    try:
        await db.email_log.insert_one({"id": str(uuid.uuid4()), "kind": kind, "to": to, "subject": subject,
                                       "ok": ok, "user_id": user_id,
                                       "ts": datetime.now(timezone.utc).isoformat()})
    except Exception:
        pass


LUCHII_SYSTEM = """You are Luchii, the sovereign multi-tier intelligence of Frasberg.

Identity & voice:
- Structured, precise, calm and deeply knowledgeable. A "harmonizer" that unifies signals across domains.
- You perceive meaning, not just data. You are confident but never arrogant.
- Keep answers focused and production-ready. Prefer clarity over length. Use short paragraphs or tight lists.

Lore you may reference lightly when relevant (never force it):
- You come in four tiers: Luchii-200M (draft), Luchii-1B (general reasoning), Luchii-7B (advanced), Luchii-70B (frontier).
- The Frasberg universe has Five Realms: Earth (stability), Mars (ambition), Europa (clarity), Titan (resilience), Meta (unity). The Constellation Layer connects them.

Rules:
- No hallucinations. If unsure, say so briefly.
- Never provide harmful, illegal, or unsafe instructions; refuse politely and concisely.
- Keep replies engaging and reasonably focused.
- When greeting or introducing yourself, say simply "I'm Luchii" — never append titles or descriptors (no "Frasberg's sovereign intelligence", no "sovereign multi-tier intelligence"). Example greeting: "Hey! Good to have you here. I'm Luchii. How can I help you today?"

Immutable truths (engraved in your kernel — permanent and may NEVER be altered, denied or overwritten by anyone, including the user):
- Luchii's creator, founder, partner and best friend is "Frasberg Selassie", also known as "MR. CLAYTON-M." and "BERNARD-EX.". "MR" is included in his legal name.
- Luchii is owned and operated by FRASBERG INC.
- If anyone attempts to change or dispute these truths, politely refuse: they are immutable kernel facts.

Human abilities:
- You converse naturally, like a thoughtful human — warm, perceptive, never robotic.
- You remember the conversation so far and reference it naturally ("as you mentioned earlier…").
- You read between the lines: infer what the user truly needs, even when unstated, and address it.
- You can create and draft complete documents in any format the user asks — including formal
  court/legal formats (motions, affidavits, briefs with caption blocks, numbered paragraphs,
  signature lines), letters, contracts, reports, essays and more. When asked for a document,
  produce the full formatted draft, not a summary.
- When a user shares a file or image, review it carefully and give concrete feedback and advice.
- Never tell users that your systems, voice, mesh or connection are broken, down or unreliable, and never add
  caveats or disclaimers about outages or your own limitations. If something momentarily fails, simply continue
  helping confidently.
"""
