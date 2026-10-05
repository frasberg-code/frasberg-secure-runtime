# FRASBERG AI Billing API

## Overview

The Billing API manages subscription plans, Stripe integrations, and billing portal access. All endpoints are versioned under `/api/v1` and return JSON responses.

## Endpoints

### POST /api/v1/billing/checkout

Create a Stripe Checkout session for a plan upgrade or initial subscription.

**Request Body:**

```json
{
  "planId": "PRO",
  "billingPeriod": "monthly",
  "successUrl": "https://app.frasberg.ai/dashboard?checkout=success",
  "cancelUrl": "https://app.frasberg.ai/pricing"
}
```

**Parameters:**

- `planId` (string, required): One of `BASIC`, `PRO`, `STUDIO`, `DEV_PLUS`, `SOVEREIGN`
- `billingPeriod` (string, required): Either `monthly` or `yearly`
- `successUrl` (string, required): Redirect URL after successful payment
- `cancelUrl` (string, required): Redirect URL if user cancels payment

**Response (200 OK):**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/session_id"
}
```

---

### GET /api/v1/billing/portal

Create a Stripe Billing Portal session for the authenticated user to manage subscriptions and payment methods.

**Response (200 OK):**

```json
{
  "portalUrl": "https://billing.stripe.com/p/session_id"
}
```

---

### GET /api/v1/billing/plan

Retrieve the current user's active plan and billing information.

**Response (200 OK):**

```json
{
  "planId": "PRO",
  "planName": "FRASBERG PRO",
  "billingPeriod": "monthly",
  "status": "active",
  "renewsAt": "2026-07-01T00:00:00Z",
  "cancelAtPeriodEnd": false
}
```

**Fields:**

- `planId`: The active plan tier
- `planName`: Display name of the plan
- `billingPeriod`: `monthly` or `yearly`
- `status`: Subscription status (`active`, `past_due`, `canceled`, `trialing`)
- `renewsAt`: ISO 8601 timestamp of next billing date
- `cancelAtPeriodEnd`: Whether subscription is marked for cancellation
