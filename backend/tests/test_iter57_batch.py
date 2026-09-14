"""
Iteration 57 backend tests: forgot/reset password, admin refund endpoint, purchases method.
Safe tests only — no real Stripe refunds, do NOT consume doctester1 reset token.
"""
import os
import time
import requests
import pytest
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fall back to /app/frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                break

MONGO_URL = None
DB_NAME = None
with open("/app/backend/.env") as f:
    for line in f:
        if line.startswith("MONGO_URL="):
            MONGO_URL = line.split("=", 1)[1].strip().strip('"')
        if line.startswith("DB_NAME="):
            DB_NAME = line.split("=", 1)[1].strip().strip('"')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

ADMIN_EMAIL = "admin@frasberg.com"
ADMIN_PASSWORD = "LuchiiAdmin2026!"
USER_EMAIL = "doctester1@frasberg.com"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


# -------- Forgot / Reset password --------

class TestForgotReset:
    def test_forgot_password_known_email_generic_ok(self):
        r = requests.post(f"{BASE_URL}/api/auth/forgot-password",
                          json={"email": USER_EMAIL, "origin_url": "https://example.test"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("ok") is True
        assert "reset link" in d.get("message", "").lower()

    def test_token_persisted(self):
        # Give backend a moment to insert token
        time.sleep(0.5)
        doc = db.password_reset_tokens.find_one({"email": USER_EMAIL, "used": False},
                                                sort=[("created_at", -1)])
        assert doc is not None, "Expected password_reset_tokens doc for doctester1"
        assert doc.get("token") and len(doc["token"]) > 10

    def test_forgot_password_unknown_email_still_generic(self):
        r = requests.post(f"{BASE_URL}/api/auth/forgot-password",
                          json={"email": "nonexistent_TEST@frasberg.com"}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_reset_password_invalid_token(self):
        r = requests.post(f"{BASE_URL}/api/auth/reset-password",
                          json={"token": "FAKE_INVALID_TOKEN", "password": "TotallyNewPass123!"}, timeout=15)
        assert r.status_code == 400
        assert "invalid" in r.json().get("detail", "").lower() or "expired" in r.json().get("detail", "").lower()

    def test_reset_password_short_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/reset-password",
                          json={"token": "anything", "password": "abc"}, timeout=15)
        assert r.status_code == 400


# -------- Admin refund endpoint --------

class TestAdminRefund:
    def test_refund_unknown_id_404(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/admin/purchases/does-not-exist-xyz/refund", timeout=15)
        assert r.status_code == 404

    def test_refund_non_stripe_returns_400(self, admin_session):
        # Insert a fake paypal purchase, try to refund, expect 400
        pid = "TEST_paypal_refund_iter57"
        db.purchases.insert_one({
            "id": pid, "provider": "paypal", "email": ADMIN_EMAIL,
            "order_id": "PAYPAL-FAKE-1", "credits": 100, "plan": "starter",
            "status": "COMPLETED", "ts": "2026-01-01T00:00:00+00:00",
        })
        try:
            r = admin_session.post(f"{BASE_URL}/api/admin/purchases/{pid}/refund", timeout=15)
            assert r.status_code == 400
            assert "stripe" in r.json().get("detail", "").lower()
        finally:
            db.purchases.delete_one({"id": pid})

    def test_refund_fake_stripe_502(self, admin_session):
        # Insert stripe purchase with fake session id — Stripe SDK call should fail => 502
        pid = "TEST_stripe_refund_iter57"
        db.purchases.insert_one({
            "id": pid, "provider": "stripe", "email": ADMIN_EMAIL,
            "order_id": "cs_test_fake_iter57", "credits": 100, "plan": "starter",
            "status": "COMPLETED", "ts": "2026-01-01T00:00:00+00:00",
        })
        try:
            r = admin_session.post(f"{BASE_URL}/api/admin/purchases/{pid}/refund", timeout=30)
            assert r.status_code == 502, f"Expected 502, got {r.status_code}: {r.text[:200]}"
            # Ingress rewrites 502 to HTML; when body is JSON, verify detail
            try:
                body = r.json()
                assert "stripe refund failed" in body.get("detail", "").lower()
            except Exception:
                # Ingress-generated 502 HTML page — status is what matters
                assert "502" in r.text or "bad gateway" in r.text.lower()
        finally:
            db.purchases.delete_one({"id": pid})

    def test_refund_unauth_401(self):
        r = requests.post(f"{BASE_URL}/api/admin/purchases/any/refund", timeout=15)
        assert r.status_code in (401, 403)


# -------- Purchases: stripe row visible via /purchases/my --------

class TestPurchasesMy:
    def test_stripe_purchase_visible(self, admin_session):
        pid = "TEST_stripe_visible_iter57"
        db.purchases.insert_one({
            "id": pid, "provider": "stripe", "email": ADMIN_EMAIL,
            "order_id": "cs_test_fake_visible", "credits": 100, "plan": "starter",
            "plan_name": "Starter", "price": 5,
            "status": "COMPLETED", "ts": "2026-01-02T00:00:00+00:00",
        })
        try:
            r = admin_session.get(f"{BASE_URL}/api/purchases/my", timeout=15)
            assert r.status_code == 200
            data = r.json()
            purchases = data.get("purchases", [])
            match = [p for p in purchases if p.get("id") == pid or p.get("order_id") == "cs_test_fake_visible"]
            assert match, f"Inserted stripe purchase not returned. keys={list(data.keys())}"
            assert match[0].get("provider") == "stripe"
        finally:
            db.purchases.delete_one({"id": pid})


# -------- Admin login regression --------

class TestAdminLogin:
    def test_admin_login_ok(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        # Login returns user fields at top level
        assert d.get("email") == ADMIN_EMAIL
        assert d.get("role") == "admin"
