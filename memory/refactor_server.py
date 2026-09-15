import re

path = "/app/backend/server.py"
lines = open(path).read().split("\n")


def find(pred, start=0):
    for i in range(start, len(lines)):
        if pred(lines[i]):
            return i
    raise SystemExit(f"anchor not found from {start}")


def line_is(s):
    return lambda l: l.strip() == s


def startswith(s):
    return lambda l: l.strip().startswith(s)


ranges = []  # (start, end_exclusive)

# 1. mongo/db/auth setup block
i = find(line_is("mongo_url = os.environ['MONGO_URL']"))
j = find(line_is("auth_module.setup(db)"), i)
ranges.append((i, j + 1))

# 2. EMERGENT_LLM_KEY line
i = find(line_is("EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']"))
ranges.append((i, i + 1))

# 3. MAX_MSG_LEN .. _rate_store
i = find(line_is("MAX_MSG_LEN = 4000"))
j = find(line_is("_rate_store = defaultdict(list)"), i)
ranges.append((i, j + 1))

# 4. _rate_check function
i = find(startswith("def _rate_check(key: str):"))
j = find(line_is("_rate_store[key] = hits"), i)
ranges.append((i, j + 1))

# 5. TEAM_DOMAIN .. _is_team_email
i = find(startswith('TEAM_DOMAIN = "@frasbergai.com"'))
j = find(startswith("return bool(email) and str(email).lower().strip().endswith(TEAM_DOMAINS)"), i)
ranges.append((i, j + 1))

# 6. PLAN_QUOTAS .. _enforce_plan_quotas end
i = find(line_is("PLAN_QUOTAS = {"))
j = find(line_is("return plan, q, used"), i)
ranges.append((i, j + 1))

# 7. _mask_key + SERVER_STARTED_AT
i = find(startswith("def _mask_key(k: str) -> str:"))
j = find(line_is("SERVER_STARTED_AT = time.time()"), i)
ranges.append((i, j + 1))

# 8. _REQ_METRICS deque
i = find(startswith("_REQ_METRICS = deque(maxlen=3000)"))
ranges.append((i, i + 1))

# 9. LUCHII_SYSTEM block
i = find(startswith('LUCHII_SYSTEM = """'))
j = find(line_is('"""'), i)
ranges.append((i, j + 1))

# 10. _START_TIME line
i = find(line_is("_START_TIME = datetime.now(timezone.utc)"))
ranges.append((i, i + 1))

# 11. _log_email function
i = find(startswith("async def _log_email(kind: str"))
j = find(line_is("pass"), i)
ranges.append((i, j + 1))

# 12. admin block: require_admin .. before Court comment
i = find(startswith("async def require_admin(user: dict"))
j = find(startswith("# ---------------- The Luchii AI Court"), i)
ranges.append((i, j))

# 13. payments block
i = find(startswith("# ---------------- PayPal — API credit packs"))
j = find(startswith("# ---------------- OpenAI-Compatible Provider Gateway"), i)
ranges.append((i, j))

# 14. provider block (includes metering helpers)
i = find(startswith("# ---------------- OpenAI-Compatible Provider Gateway"))
j = find(line_is("import builder as builder_module"), i)
ranges.append((i, j))

# 15. workspace block
i = find(startswith("# ── Workspace publishes"))
j = find(line_is("import native_packaging"), i)
ranges.append((i, j))

# 16. shield block (through _start_digest_scheduler)
i = find(startswith("# ============ FRASBERG SECURITY SHIELD"))
j = find(line_is("app.include_router(api_router)"), i)
ranges.append((i, j))

# 17. stripe imports no longer used in server
i = find(startswith("from emergentintegrations.payments.stripe.checkout import"))
ranges.append((i, i + 1))
i = find(line_is("import stripe as stripe_sdk"))
ranges.append((i, i + 1))

# validate no overlaps
ranges.sort()
for a, b in zip(ranges, ranges[1:]):
    assert a[1] <= b[0], f"overlap {a} {b}"

# delete bottom-up
for s, e in sorted(ranges, reverse=True):
    del lines[s:e]

text = "\n".join(lines)

# insert core/metering imports after load_dotenv
core_imports = """
import resend
from core import (client, db, EMERGENT_LLM_KEY, MAX_MSG_LEN, RATE_LIMIT, RATE_WINDOW,
                  BLOCKED_TERMS, _rate_store, _rate_check, TEAM_DOMAIN, TEAM_DOMAINS,
                  _is_team_email, PLAN_QUOTAS, _enforce_plan_quotas, _mask_key,
                  SERVER_STARTED_AT, _START_TIME, _REQ_METRICS, PLANS, UPGRADE_PLANS,
                  PAID_PLANS, require_admin, _audit, _log_email, LUCHII_SYSTEM)
from metering import (TRIAL_KEY_CREDITS, _key_owner_unmetered, _insufficient_credits,
                      _maybe_autotopup, _maybe_quota_alert, _maybe_low_credit_alert)
"""
anchor = "load_dotenv(ROOT_DIR / '.env')"
assert anchor in text
text = text.replace(anchor, anchor + "\n" + core_imports, 1)

# wire new routers after linq_governance include
anchor2 = "api_router.include_router(linq_governance.router)"
assert anchor2 in text
wiring = anchor2 + """
import routes_payments
import routes_admin
import routes_provider
import routes_workspace
import routes_shield
api_router.include_router(routes_payments.router)
api_router.include_router(routes_admin.router)
api_router.include_router(routes_provider.router)
api_router.include_router(routes_workspace.router)
api_router.include_router(routes_shield.router)
app.middleware("http")(routes_shield.shield_middleware)


@app.on_event("startup")
async def _start_shield_digest():
    asyncio.create_task(routes_shield.digest_scheduler())
"""
text = text.replace(anchor2, wiring, 1)

open(path, "w").write(text)
print("done, new line count:", len(text.split("\n")))
