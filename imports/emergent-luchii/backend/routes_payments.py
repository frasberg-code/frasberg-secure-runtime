import os
import uuid
import asyncio
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
import resend
import stripe as stripe_sdk
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

import auth as auth_module
from core import db, PLANS, UPGRADE_PLANS, require_admin

logger = logging.getLogger(__name__)
router = APIRouter()

PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "live")
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET = os.environ.get("PAYPAL_SECRET", "")
PAYPAL_BASE = "https://api-m.paypal.com" if PAYPAL_MODE == "live" else "https://api-m.sandbox.paypal.com"

CASHAPP_TAG = os.environ.get("CASHAPP_TAG", "$jccnvja")
CASHAPP_PAYEE = os.environ.get("CASHAPP_PAYEE", "FRASBERG INC")


@router.get("/cashapp/config")
async def cashapp_config():
    return {
        "cashtag": CASHAPP_TAG,
        "payee": CASHAPP_PAYEE,
        "plans": list(UPGRADE_PLANS.values()),
    }


class CashAppIntent(BaseModel):
    plan_id: str = "luchii-pro"


@router.post("/cashapp/intent")
async def cashapp_intent(body: CashAppIntent, user: dict = Depends(auth_module.get_current_user)):
    plan = UPGRADE_PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    reference = "LCH-" + secrets.token_hex(4).upper()
    doc = {
        "id": str(uuid.uuid4()),
        "reference": reference,
        "user_id": user["id"],
        "user_email": user.get("email", ""),
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "amount": plan["price"],
        "cashtag": CASHAPP_TAG,
        "status": "awaiting_payment",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.cashapp_payments.insert_one({**doc})
    tag_clean = CASHAPP_TAG.lstrip("$")
    return {
        **{k: v for k, v in doc.items() if k != "_id"},
        "pay_url": f"https://cash.app/${tag_clean}/{plan['price']}",
        "cashtag_url": f"https://cash.app/${tag_clean}",
    }


class CashAppConfirm(BaseModel):
    reference: str
    sender_cashtag: Optional[str] = None
    note: Optional[str] = None


@router.post("/cashapp/confirm")
async def cashapp_confirm(body: CashAppConfirm, user: dict = Depends(auth_module.get_current_user)):
    pay = await db.cashapp_payments.find_one({"reference": body.reference, "user_id": user["id"]})
    if not pay:
        raise HTTPException(status_code=404, detail="Payment request not found")
    if pay["status"] in ("approved", "pending_review"):
        return {"status": pay["status"], "reference": body.reference}
    await db.cashapp_payments.update_one(
        {"reference": body.reference},
        {"$set": {
            "status": "pending_review",
            "sender_cashtag": (body.sender_cashtag or "").strip()[:60],
            "note": (body.note or "").strip()[:200],
            "confirmed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"status": "pending_review", "reference": body.reference}


@router.get("/cashapp/my")
async def cashapp_my(user: dict = Depends(auth_module.get_current_user)):
    docs = await db.cashapp_payments.find({"user_id": user["id"]}).sort("created_at", -1).to_list(20)
    return {"payments": [{k: v for k, v in d.items() if k != "_id"} for d in docs]}


@router.get("/admin/cashapp")
async def admin_cashapp_list(admin: dict = Depends(require_admin)):
    docs = await db.cashapp_payments.find().sort("created_at", -1).to_list(200)
    return {"payments": [{k: v for k, v in d.items() if k != "_id"} for d in docs]}


@router.post("/admin/cashapp/{reference}/approve")
async def admin_cashapp_approve(reference: str, admin: dict = Depends(require_admin)):
    pay = await db.cashapp_payments.find_one({"reference": reference})
    if not pay:
        raise HTTPException(status_code=404, detail="Payment not found")
    await db.cashapp_payments.update_one({"reference": reference}, {"$set": {
        "status": "approved", "approved_at": datetime.now(timezone.utc).isoformat(), "approved_by": admin.get("email", "")}})
    plan_cfg = UPGRADE_PLANS.get(pay.get("plan_id"), {})
    if plan_cfg.get("kind") == "doc_credits":
        await db.users.update_one({"id": pay["user_id"]}, {"$inc": {"doc_credits": plan_cfg.get("doc_credits", 0)}})
    else:
        days = 7 if plan_cfg.get("plan") == "trial" else (365 if pay.get("plan_id") == "annual" else 30)
        now_dt = datetime.now(timezone.utc)
        update = {"plan": plan_cfg.get("plan", "pro"),
                  "plan_started": now_dt.isoformat(),
                  "plan_expires": (now_dt + timedelta(days=days)).isoformat()}
        await db.users.update_one({"id": pay["user_id"]}, {"$set": update})
    return {"status": "approved", "reference": reference}


@router.post("/admin/cashapp/{reference}/reject")
async def admin_cashapp_reject(reference: str, admin: dict = Depends(require_admin)):
    res = await db.cashapp_payments.update_one({"reference": reference}, {"$set": {
        "status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"status": "rejected", "reference": reference}


class OrderCreate(BaseModel):
    plan_id: str
    key_id: Optional[str] = None


class OrderCapture(BaseModel):
    key_id: Optional[str] = None
    plan_id: Optional[str] = None
    email: Optional[str] = None


RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


def _receipt_html(plan_name: str, price: str, credits: int, order_id: str) -> str:
    return f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e2327;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#161a1d;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 32px;border-bottom:1px solid #2a3136;">
            <span style="color:#00f0ff;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Luchii · Frasberg</span>
            <h1 style="color:#f8f9fa;font-size:22px;margin:10px 0 0;">Payment receipt</h1>
          </td></tr>
          <tr><td style="padding:28px 32px;color:#a1aab0;font-size:14px;line-height:1.7;">
            Thank you for your purchase. Your credits are now active.
            <table width="100%" style="margin-top:20px;color:#f8f9fa;font-size:15px;">
              <tr><td style="padding:8px 0;color:#a1aab0;">Plan</td><td align="right">{plan_name}</td></tr>
              <tr><td style="padding:8px 0;color:#a1aab0;">Credits</td><td align="right">{credits:,} tokens</td></tr>
              <tr><td style="padding:8px 0;color:#a1aab0;">Amount</td><td align="right">${price} USD</td></tr>
              <tr><td style="padding:8px 0;color:#a1aab0;">Order</td><td align="right" style="font-family:monospace;font-size:12px;">{order_id}</td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #2a3136;color:#6c757d;font-size:12px;">
            Intelligence, Harmonized. · © 2026 Frasberg
          </td></tr>
        </table>
      </td></tr>
    </table>
    """


async def _send_receipt(to_email: str, plan: dict, order_id: str):
    if not (RESEND_API_KEY and to_email):
        return {"sent": False, "reason": "not_configured_or_no_email"}
    try:
        resend.api_key = RESEND_API_KEY
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": f"Your Luchii receipt — {plan['name']}",
            "html": _receipt_html(plan["name"], plan["price"], plan["credits"], order_id),
        }
        res = await asyncio.to_thread(resend.Emails.send, params)
        return {"sent": True, "id": res.get("id")}
    except Exception:
        logger.exception("receipt email failed")
        return {"sent": False, "reason": "send_error"}


async def _paypal_token() -> str:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(
            f"{PAYPAL_BASE}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        r.raise_for_status()
        return r.json()["access_token"]


@router.get("/paypal/config")
async def paypal_config():
    return {
        "client_id": PAYPAL_CLIENT_ID,
        "mode": PAYPAL_MODE,
        "configured": bool(PAYPAL_CLIENT_ID and PAYPAL_SECRET),
        "plans": list(PLANS.values()),
        "upgrade_plans": list(UPGRADE_PLANS.values()),
    }


@router.post("/paypal/orders")
async def paypal_create_order(body: OrderCreate, request: Request):
    plan = PLANS.get(body.plan_id) or UPGRADE_PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown plan")
    ref_suffix = body.key_id or "none"
    if plan.get("kind") in ("upgrade", "doc_credits"):
        user = await auth_module.get_current_user(request)
        ref_suffix = user["id"]
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "reference_id": f"{plan['id']}::{ref_suffix}",
                        "description": f"Luchii {plan['name']}" + (f" — {plan['credits']} credits" if plan.get("credits") else " — account upgrade"),
                        "amount": {"currency_code": "USD", "value": plan["price"]},
                    }],
                },
            )
        if r.status_code >= 400:
            logger.error("paypal create order failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal order creation failed")
        return {"id": r.json()["id"]}
    except HTTPException:
        raise
    except Exception:
        logger.exception("paypal create order error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


@router.post("/paypal/orders/{order_id}/capture")
async def paypal_capture_order(order_id: str, body: OrderCapture):
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
        if r.status_code >= 400:
            logger.error("paypal capture failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal capture failed")
        data = r.json()
        status = data.get("status")
        ref = ""
        try:
            ref = data["purchase_units"][0]["reference_id"]
        except Exception:
            pass
        plan_id = (ref.split("::")[0] if "::" in ref else body.plan_id) or ""
        key_id = (ref.split("::")[1] if "::" in ref else body.key_id) or None
        if key_id == "none":
            key_id = None
        plan = PLANS.get(plan_id) or UPGRADE_PLANS.get(plan_id)
        credited = 0
        upgraded = False
        receipt = {"sent": False}
        if status == "COMPLETED" and plan:
            payer_email = body.email
            try:
                payer_email = payer_email or data["payer"]["email_address"]
            except Exception:
                pass
            if plan.get("kind") == "doc_credits":
                added = int(plan.get("doc_credits", 0))
                if key_id:
                    await db.users.update_one({"id": key_id}, {"$inc": {"doc_credits": added}})
                credited = added
                await db.purchases.insert_one({
                    "id": str(uuid.uuid4()), "order_id": order_id, "plan": plan_id,
                    "kind": "doc_credits", "doc_credits": added, "user_id": key_id, "status": status,
                    "email": payer_email,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                receipt = await _send_receipt(payer_email, {**plan, "credits": added}, order_id)
            elif plan.get("kind") == "upgrade":
                if key_id:
                    days = 7 if plan.get("plan") == "trial" else (365 if plan_id == "annual" else 30)
                    now_dt = datetime.now(timezone.utc)
                    update = {"plan": plan.get("plan", "pro"),
                              "plan_started": now_dt.isoformat(),
                              "plan_expires": (now_dt + timedelta(days=days)).isoformat()}
                    await db.users.update_one({"id": key_id}, {"$set": update})
                    upgraded = True
                await db.purchases.insert_one({
                    "id": str(uuid.uuid4()), "order_id": order_id, "plan": plan_id,
                    "kind": "upgrade", "user_id": key_id, "status": status,
                    "email": payer_email,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                receipt = await _send_receipt(payer_email, {**plan, "credits": 0}, order_id)
            else:
                credited = plan["credits"]
                await db.purchases.insert_one({
                    "id": str(uuid.uuid4()), "order_id": order_id, "plan": plan_id,
                    "credits": credited, "key_id": key_id, "status": status,
                    "email": payer_email,
                    "ts": datetime.now(timezone.utc).isoformat(),
                })
                if key_id:
                    if key_id.startswith("wallet-"):
                        await db.users.update_one({"id": key_id[7:]}, {"$inc": {"credit_balance": credited}})
                    else:
                        await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": credited}})
                receipt = await _send_receipt(payer_email, plan, order_id)
        return {"status": status, "credits_added": credited, "upgraded": upgraded, "receipt": receipt}
    except HTTPException:
        raise
    except Exception:
        logger.exception("paypal capture error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")


def _stripe_client(request: Request) -> StripeCheckout:
    host_url = str(request.base_url)
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")


class StripeCheckoutBody(BaseModel):
    plan_id: str
    key_id: Optional[str] = None
    origin_url: str


@router.get("/payments/config")
async def stripe_config():
    return {"configured": bool(STRIPE_API_KEY), "plans": list(PLANS.values())}


@router.post("/payments/checkout")
async def stripe_create_checkout(body: StripeCheckoutBody, request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    plan = PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    amount = float(plan["price"])
    checkout_req = CheckoutSessionRequest(
        amount=amount, currency="usd",
        success_url=f"{body.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{body.origin_url}/payment/cancel",
        metadata={"plan_id": plan["id"], "key_id": body.key_id or "none"},
    )
    try:
        session = await _stripe_client(request).create_checkout_session(checkout_req)
    except Exception as e:
        logger.exception("stripe checkout create failed")
        msg = str(e)
        if "cannot currently make live charges" in msg:
            raise HTTPException(status_code=409, detail="Stripe account not yet activated for live charges — complete activation at dashboard.stripe.com")
        raise HTTPException(status_code=502, detail="Stripe is unavailable")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "plan_id": plan["id"],
        "key_id": body.key_id or None, "amount": amount, "currency": "usd",
        "credits": plan["credits"], "status": "initiated", "payment_status": "pending",
        "created_at": now_iso, "updated_at": now_iso,
    })
    return {"checkout_url": session.url, "session_id": session.session_id}


async def _fulfill_stripe_txn(session_id: str, payer_email: str = ""):
    txn = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid",
                  "updated_at": datetime.now(timezone.utc).isoformat()}})
    if not txn:
        return
    key_id = txn.get("key_id")
    credited = int(txn.get("credits", 0))
    owner = None
    if key_id:
        if key_id.startswith("wallet-"):
            await db.users.update_one({"id": key_id[7:]}, {"$inc": {"credit_balance": credited}})
            owner = await db.users.find_one({"id": key_id[7:]}, {"id": 1, "email": 1})
        else:
            await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": credited}})
            kd = await db.api_keys.find_one({"id": key_id}, {"user_id": 1})
            if kd:
                owner = await db.users.find_one({"id": kd.get("user_id")}, {"id": 1, "email": 1})
    email = payer_email or (owner or {}).get("email", "")
    await db.purchases.insert_one({
        "id": str(uuid.uuid4()), "order_id": session_id, "plan": txn.get("plan_id"),
        "credits": credited, "key_id": key_id, "status": "COMPLETED",
        "provider": "stripe", "email": email, "user_id": (owner or {}).get("id"),
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    plan = PLANS.get(txn.get("plan_id"))
    if plan and email:
        try:
            await _send_receipt(email, plan, session_id)
        except Exception:
            logger.exception("stripe receipt failed")


@router.post("/admin/purchases/{purchase_id}/refund")
async def refund_purchase(purchase_id: str, admin: dict = Depends(require_admin)):
    p = await db.purchases.find_one({"$or": [{"id": purchase_id}, {"order_id": purchase_id}]}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Purchase not found")
    if p.get("provider") != "stripe":
        raise HTTPException(status_code=400, detail="Only Stripe (card) purchases can be refunded here")
    if p.get("status") == "REFUNDED":
        raise HTTPException(status_code=409, detail="Already refunded")

    def _do_refund():
        stripe_sdk.api_key = STRIPE_API_KEY
        session = stripe_sdk.checkout.Session.retrieve(p["order_id"])
        if not session.get("payment_intent"):
            raise ValueError("No payment intent on this checkout session")
        return stripe_sdk.Refund.create(payment_intent=session["payment_intent"])

    try:
        refund = await asyncio.to_thread(_do_refund)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stripe refund failed: {e}")
    credits = int(p.get("credits", 0))
    key_id = p.get("key_id")
    if key_id and credits:
        if str(key_id).startswith("wallet-"):
            await db.users.update_one({"id": key_id[7:]}, {"$inc": {"credit_balance": -credits}})
        else:
            await db.api_keys.update_one({"id": key_id}, {"$inc": {"credits": -credits}})
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.purchases.update_one({"id": p["id"]}, {"$set": {
        "status": "REFUNDED", "refunded_at": now_iso,
        "refund_id": refund["id"], "refunded_by": admin.get("email")}})
    await db.payment_transactions.update_one({"session_id": p["order_id"]}, {"$set": {
        "status": "refunded", "payment_status": "refunded", "updated_at": now_iso}})
    return {"ok": True, "refund_id": refund["id"], "clawed_back": credits}


@router.get("/payments/status/{session_id}")
async def stripe_payment_status(session_id: str, request: Request):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.get("payment_status") != "paid":
        try:
            status = await _stripe_client(request).get_checkout_status(session_id)
            if status.payment_status == "paid" or status.status == "complete":
                email = (status.metadata or {}).get("email", "")
                await _fulfill_stripe_txn(session_id, email)
                txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            elif status.status == "expired":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"status": "expired", "payment_status": "expired",
                              "updated_at": datetime.now(timezone.utc).isoformat()}})
                txn["status"] = txn["payment_status"] = "expired"
        except Exception:
            logger.warning("stripe status poll failed for %s", session_id)
    return {"session_id": session_id, "status": txn.get("status"),
            "payment_status": txn.get("payment_status"), "credits": txn.get("credits", 0)}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        wr = await _stripe_client(request).handle_webhook(body, sig)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")
    if wr.payment_status == "paid":
        await _fulfill_stripe_txn(wr.session_id, (wr.metadata or {}).get("email", ""))
    return {"status": "ok"}


@router.get("/wallet")
async def get_wallet(user: dict = Depends(auth_module.get_current_user)):
    doc = await db.users.find_one({"id": user["id"]}, {"credit_balance": 1})
    return {"balance": int((doc or {}).get("credit_balance", 0))}


class AutoTopupBody(BaseModel):
    enabled: bool
    threshold: int = 500
    amount: int = 5000


@router.patch("/keys/{key_id}/autotopup")
async def set_autotopup(key_id: str, body: AutoTopupBody, user: dict = Depends(auth_module.get_current_user)):
    q = {"id": key_id}
    if user.get("role") != "admin":
        q["user_id"] = user["id"]
    at = {"enabled": body.enabled,
          "threshold": max(50, min(body.threshold, 100000)),
          "amount": max(500, min(body.amount, 200000))}
    res = await db.api_keys.update_one(q, {"$set": {"autotopup": at}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"ok": True, "autotopup": at}


@router.patch("/keys/{key_id}/alert-threshold")
async def set_alert_threshold(key_id: str, body: dict, user: dict = Depends(auth_module.get_current_user)):
    q = {"id": key_id}
    if user.get("role") != "admin":
        q["user_id"] = user["id"]
    threshold = max(50, min(int(body.get("threshold", 500)), 100000))
    res = await db.api_keys.update_one(q, {"$set": {"alert_threshold": threshold},
                                           "$unset": {"low_credit_alerted": ""}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"ok": True, "alert_threshold": threshold}


# ---------------- LINQ Live — PayPal Tip Jar ----------------
class TipOrderCreate(BaseModel):
    roomId: str
    amount: float


@router.post("/rooms/tip/orders")
async def tip_create_order(body: TipOrderCreate):
    amt = round(float(body.amount), 2)
    if amt < 1 or amt > 500:
        raise HTTPException(status_code=400, detail="Tip must be between $1 and $500")
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"intent": "CAPTURE", "purchase_units": [{
                    "reference_id": f"tip::{body.roomId}",
                    "description": f"LINQ Live tip — {body.roomId}",
                    "amount": {"currency_code": "USD", "value": f"{amt:.2f}"}}]},
            )
        if r.status_code >= 400:
            logger.error("tip order failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal tip order failed")
        return {"id": r.json()["id"]}
    except HTTPException:
        raise
    except Exception:
        logger.exception("tip order error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


class TipCaptureBody(BaseModel):
    roomId: str
    from_name: str = "viewer"


@router.post("/rooms/tip/orders/{order_id}/capture")
async def tip_capture_order(order_id: str, body: TipCaptureBody):
    try:
        token = await _paypal_token()
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.post(
                f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
        if r.status_code >= 400:
            logger.error("tip capture failed: %s", r.text)
            raise HTTPException(status_code=502, detail="PayPal tip capture failed")
        data = r.json()
        status = data.get("status")
        amount = 0.0
        try:
            amount = float(data["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"])
        except Exception:
            pass
        if status == "COMPLETED":
            now = datetime.now(timezone.utc).isoformat()
            await db.linq_tips.insert_one({"id": str(uuid.uuid4()), "roomId": body.roomId,
                                           "from": body.from_name, "amount": amount,
                                           "orderId": order_id, "createdAt": now})
            await db.linq_events.insert_one({"id": str(uuid.uuid4()), "roomId": body.roomId,
                                             "type": "tip", "identity": body.from_name,
                                             "payload": {"amount": amount, "paid": True}, "timestamp": now})
        return {"status": status, "amount": amount}
    except HTTPException:
        raise
    except Exception:
        logger.exception("tip capture error")
        raise HTTPException(status_code=502, detail="PayPal is unavailable")


# ---------------- Purchase / Billing history ----------------
@router.get("/purchases/my")
async def my_purchases(user: dict = Depends(auth_module.get_current_user)):
    q = {"$or": [{"user_id": user["id"]}, {"key_id": user["id"]},
                 {"key_id": f"wallet-{user['id']}"}, {"email": user.get("email")}]}
    purchases = await db.purchases.find(q, {"_id": 0}).sort("ts", -1).to_list(100)
    cash = await db.cashapp_payments.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    transfers = await db.credit_transfers.find({"user_id": user["id"]}, {"_id": 0}).sort("ts", -1).to_list(50)
    wallet_doc = await db.users.find_one({"id": user["id"]}, {"credit_balance": 1})
    meta = {**{p["id"]: p for p in PLANS.values()}, **{p["id"]: p for p in UPGRADE_PLANS.values()}}
    for p in purchases:
        m = meta.get(p.get("plan"), {})
        p["plan_name"] = m.get("name", p.get("plan"))
        p["price"] = m.get("price")
        if str(p.get("key_id", "")).startswith("wallet-"):
            p["wallet"] = True
    return {"purchases": purchases, "cashapp": cash, "transfers": transfers,
            "wallet_balance": int((wallet_doc or {}).get("credit_balance", 0)),
            "plan": user.get("plan"),
            "plan_started": user.get("plan_started"), "plan_expires": user.get("plan_expires")}
