"""Iteration 40 backend tests: /api/admin/hosting, tenant region permissions, /api/os/state 5 regions."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend .env parsing
    with open("/app/frontend/.env") as f:
        for ln in f:
            if ln.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = ln.split("=", 1)[1].strip().rstrip("/")

ADMIN = {"email": "admin@frasberg.com", "password": "LuchiiAdmin2026!"}
USER = {"email": "doctester1@frasberg.com", "password": "DocTester2026!"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_sess():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def user_sess():
    return _login(USER)


# --- /api/os/state 5 regions
def test_os_state_has_5_regions_including_sa_east():
    r = requests.get(f"{BASE_URL}/api/os/state", timeout=15)
    assert r.status_code == 200
    data = r.json()
    ids = [reg["id"] for reg in data.get("regions", [])]
    assert len(ids) == 5, f"expected 5 regions, got {ids}"
    assert "sa-east" in ids


# --- /api/admin/hosting
def test_admin_hosting_returns_tenants_and_5_regions(admin_sess):
    r = admin_sess.get(f"{BASE_URL}/api/admin/hosting", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data.get("tenants"), list)
    assert data.get("regions") == ["us-west", "us-east", "eu-central", "ap-south", "sa-east"]
    assert len(data["tenants"]) > 0
    t = data["tenants"][0]
    for key in ("id", "email", "plan", "isolation", "safety_profile", "evolution_policy", "region_permissions", "billing"):
        assert key in t, f"missing {key} in tenant"
    for sub in ("membrane", "hinge", "classifier", "ethics"):
        assert sub in t["safety_profile"]
    for sub in ("cognition_cycles", "tokens", "keys", "evolution_events", "marketplace_items", "wallet"):
        assert sub in t["billing"]


def test_admin_hosting_forbidden_for_non_admin(user_sess):
    r = user_sess.get(f"{BASE_URL}/api/admin/hosting", timeout=15)
    assert r.status_code == 403


# --- POST /api/admin/tenants/{id}/regions
def _find_doctester_id(admin_sess):
    r = admin_sess.get(f"{BASE_URL}/api/admin/hosting", timeout=20)
    for t in r.json()["tenants"]:
        if t["email"] == USER["email"]:
            return t["id"]
    pytest.fail("doctester1 not found")


def test_set_tenant_regions_valid(admin_sess):
    uid = _find_doctester_id(admin_sess)
    r = admin_sess.post(f"{BASE_URL}/api/admin/tenants/{uid}/regions",
                        json={"regions": ["us-west", "eu-central"]}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") is True
    assert set(data.get("regions", [])) == {"us-west", "eu-central"}
    # verify persisted
    r2 = admin_sess.get(f"{BASE_URL}/api/admin/hosting", timeout=20)
    tenant = next(t for t in r2.json()["tenants"] if t["id"] == uid)
    assert set(tenant["region_permissions"]) == {"us-west", "eu-central"}


def test_set_tenant_regions_invalid(admin_sess):
    uid = _find_doctester_id(admin_sess)
    r = admin_sess.post(f"{BASE_URL}/api/admin/tenants/{uid}/regions",
                        json={"regions": ["mars"]}, timeout=15)
    assert r.status_code == 400


def test_set_tenant_regions_unknown_user(admin_sess):
    r = admin_sess.post(f"{BASE_URL}/api/admin/tenants/nonexistent-id/regions",
                        json={"regions": ["us-west"]}, timeout=15)
    assert r.status_code == 404


def test_set_tenant_regions_forbidden_for_non_admin(user_sess, admin_sess):
    uid = _find_doctester_id(admin_sess)
    r = user_sess.post(f"{BASE_URL}/api/admin/tenants/{uid}/regions",
                       json={"regions": ["us-west"]}, timeout=15)
    assert r.status_code == 403
