"""Iter33 full regression: admin console, dashboard quotas, games portal.

Focus: endpoints described in the review_request. Cookie-based auth.
"""
import os
import time
import pytest
import requests

def _read_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not found")


BASE_URL = _read_backend_url()
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}
USER = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_sess():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user_sess():
    return _login(USER)


# ---------- Auth ----------
def test_admin_login_ok():
    s = _login(ADMIN)
    me = s.get(f"{API}/auth/me").json()
    assert me.get("email") == ADMIN["email"]
    assert me.get("role") == "admin"


def test_user_login_ok():
    s = _login(USER)
    me = s.get(f"{API}/auth/me").json()
    assert me.get("email") == USER["email"]


# ---------- Quotas ----------
def test_user_quotas(user_sess):
    r = user_sess.get(f"{API}/quotas")
    assert r.status_code == 200
    d = r.json()
    for k in ("plan", "rpm_limit", "monthly_token_limit", "monthly_tokens_used"):
        assert k in d, f"missing key {k} in {d}"


# ---------- Admin: health / audit / tenants ----------
def test_admin_health(admin_sess):
    r = admin_sess.get(f"{API}/admin/health")
    assert r.status_code == 200
    d = r.json()
    # loose checks — accept various field names
    keys = set(d.keys())
    assert keys, "empty health payload"


def test_admin_audit(admin_sess):
    r = admin_sess.get(f"{API}/admin/audit")
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d, (list, dict))


def test_admin_tenants_list(admin_sess):
    r = admin_sess.get(f"{API}/admin/tenants")
    assert r.status_code == 200
    d = r.json()
    lst = d if isinstance(d, list) else d.get("tenants") or d.get("items") or []
    assert isinstance(lst, list) and len(lst) >= 1


def test_admin_tenants_export_csv(admin_sess):
    r = admin_sess.get(f"{API}/admin/tenants-export.csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "") or r.text.count(",") > 0


def test_admin_digest_preview(admin_sess):
    r = admin_sess.get(f"{API}/admin/digest/preview")
    assert r.status_code == 200
    d = r.json()
    assert "subject" in d and "html" in d


def test_admin_tenant_grant_suspend_cycle(admin_sess):
    # find doctester user
    r = admin_sess.get(f"{API}/admin/tenants")
    lst = r.json() if isinstance(r.json(), list) else r.json().get("tenants") or r.json().get("items") or []
    target = None
    for t in lst:
        if t.get("email") == USER["email"]:
            target = t
            break
    assert target, "doctester not found in tenants list"
    uid = target.get("id") or target.get("_id") or target.get("user_id")
    assert uid

    # detail
    rd = admin_sess.get(f"{API}/admin/tenants/{uid}")
    assert rd.status_code == 200

    # grant credits
    rg = admin_sess.post(f"{API}/admin/tenants/{uid}/grant-credits", json={"amount": 5})
    assert rg.status_code == 200, rg.text

    # revert grant
    rg2 = admin_sess.post(f"{API}/admin/tenants/{uid}/grant-credits", json={"amount": -5})
    assert rg2.status_code == 200

    # suspend
    rs = admin_sess.post(f"{API}/admin/tenants/{uid}/suspend", json={"suspended": True, "reason": "TEST_iter33"})
    assert rs.status_code == 200, rs.text

    # reinstate
    rs2 = admin_sess.post(f"{API}/admin/tenants/{uid}/suspend", json={"suspended": False, "reason": "TEST_iter33 revert"})
    assert rs2.status_code == 200

    # audit should now include entries
    ra = admin_sess.get(f"{API}/admin/audit")
    txt = ra.text
    assert "TEST_iter33" in txt or "grant" in txt.lower() or "suspend" in txt.lower()


# ---------- Dashboard: receipts send-now ----------
def test_receipts_send_now(user_sess):
    r = user_sess.post(f"{API}/receipts/send-now", json={})
    # Resend restricted delivery. Endpoint may 400 if user has no api-key usage yet.
    # Accept 200/202 (success) or 400 with the known "No keys with usage" detail (graceful).
    assert r.status_code in (200, 202, 400), f"{r.status_code}: {r.text}"
    if r.status_code == 400:
        assert "keys with usage" in r.text.lower() or "email service" in r.text.lower()


# ---------- Games portal ----------
def test_games_list_public():
    r = requests.get(f"{API}/games", timeout=15)
    assert r.status_code == 200
    d = r.json()
    games = d if isinstance(d, list) else d.get("games") or []
    assert len(games) >= 1
    g0 = games[0]
    # plays field expected
    assert "plays" in g0 or "play_count" in g0


def test_games_player_endpoints_require_auth():
    # unauthenticated must be 401
    for path in ("/games/player/favorites", "/games/player/best-scores",
                 "/games/player/profile", "/games/player/achievements"):
        r = requests.get(f"{API}{path}", timeout=10)
        assert r.status_code in (401, 403), f"{path} expected 401 got {r.status_code}"


def test_games_player_flows(user_sess):
    # profile
    rp = user_sess.get(f"{API}/games/player/profile")
    assert rp.status_code == 200
    # achievements
    ra = user_sess.get(f"{API}/games/player/achievements")
    assert ra.status_code == 200
    # favorites list
    rf = user_sess.get(f"{API}/games/player/favorites")
    assert rf.status_code == 200
    # best scores
    rb = user_sess.get(f"{API}/games/player/best-scores")
    assert rb.status_code == 200


def test_games_play_count_and_favorite_toggle(user_sess):
    # pick a game id
    r = requests.get(f"{API}/games")
    games = r.json() if isinstance(r.json(), list) else r.json().get("games", [])
    gid = games[0].get("id") or games[0].get("_id") or games[0].get("slug")
    assert gid

    # increment plays
    rp = user_sess.post(f"{API}/games/{gid}/play-count", json={})
    assert rp.status_code in (200, 201)

    # add favorite (POST toggles)
    rfa = user_sess.post(f"{API}/games/player/favorites/{gid}", json={})
    assert rfa.status_code in (200, 201, 204)
    j = rfa.json() if rfa.headers.get("content-type", "").startswith("application/json") else {}
    # toggle back off (cleanup)
    rfd = user_sess.post(f"{API}/games/player/favorites/{gid}", json={})
    assert rfd.status_code in (200, 201, 204)


# ---------- v1 gateway w/ generated key ----------
def test_v1_chat_with_generated_key(user_sess):
    # create key
    rk = user_sess.post(f"{API}/keys", json={"name": "TEST_iter33_regr"})
    assert rk.status_code in (200, 201), rk.text
    kd = rk.json()
    key = kd.get("key") or kd.get("api_key") or kd.get("secret")
    kid = kd.get("id") or kd.get("_id")
    assert key and key.startswith("luchii-sk-"), f"unexpected key: {kd}"

    try:
        rc = requests.post(
            f"{API}/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={"model": "luchii-6-plus", "messages": [{"role": "user", "content": "ping"}]},
            timeout=60,
        )
        assert rc.status_code == 200, f"{rc.status_code}: {rc.text[:400]}"
        j = rc.json()
        assert j.get("object") == "chat.completion"
        assert j["choices"][0]["message"]["content"]
    finally:
        if kid:
            user_sess.delete(f"{API}/keys/{kid}")
