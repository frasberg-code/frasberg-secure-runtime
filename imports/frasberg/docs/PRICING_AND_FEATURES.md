# FRASBERG AI: Pricing & Feature Tiers

## Overview

FRASBERG AI offers five distinct pricing tiers designed for different use cases—from community exploration to sovereign enterprise governance.

---

## Plan Tiers

### 🎓 FRASBERG BASIC
**Free**

**For:** Community and exploration

**Features:**
- 30 requests/day
- Core governance engine
- Standard tone modulation
- Community support

**CTA:** Start for free

---

### ⭐ FRASBERG PRO
**$19/month** | **$190/year** (Save 20%)

**For:** Power users and solo builders

**Features:**
- Unlimited requests
- Priority processing
- Advanced tonal modulation
- Basic API access
- 5 concurrent sessions

**CTA:** Upgrade to PRO

---

### 🎬 FRASBERG STUDIO
**$49/month** | **$490/year** (Save 20%)

**For:** Creators and media teams

**Features:**
- Long‑form content support
- Brand‑safe filters
- Cultural narrative shaping
- Batch generation tools
- 10 concurrent sessions
- 50,000 requests/day

**CTA:** Start STUDIO

---

### 👨‍💻 FRASBERG DEV+
**$99/month** | **$990/year** (Save 20%)

**For:** Developers and SaaS products

**Features:**
- Full API suite
- High‑volume rate limits (1,000,000+ requests/day)
- Custom governance pipelines
- Audit logs & observability
- 50 concurrent sessions
- Advanced monitoring and analytics

**CTA:** Build with DEV+

---

### 🏛️ FRASBERG SOVEREIGN
**Custom pricing**

**For:** Governments and large institutions

**Features:**
- Dedicated governance engine
- On‑premises or VPC deployment
- Custom cultural models and local context modules
- Compliance‑grade audit trails (365‑day retention)
- GDPR, HIPAA, and local government compliance regimes
- 24/7 support with SLAs
- Unlimited requests and concurrent sessions
- Exportable audit logs and custom reporting

**CTA:** Talk to sales

---

## Feature Comparison Matrix

| Feature | BASIC | PRO | STUDIO | DEV+ | SOVEREIGN |
|---------|-------|-----|--------|------|----------|
| **Usage** | | | | | |
| Requests/day | 30 | Unlimited | 50,000 | 1,000,000+ | Custom |
| Concurrent sessions | 1 | 5 | 10 | 50 | Custom |
| Billing | Free | Monthly/Yearly | Monthly/Yearly | Monthly/Yearly | Custom |
| **Governance & Features** | | | | | |
| Core governance engine | ✓ | ✓ | ✓ | ✓ | ✓ |
| Standard tone modulation | ✓ | ✓ | ✓ | ✓ | ✓ |
| Advanced tonal modulation | ✗ | ✓ | ✓ | ✓ | ✓ |
| Custom governance pipelines | ✗ | ✗ | ✓ | ✓ | ✓ |
| Full API access | ✗ | ✓ | ✓ | ✓ | ✓ |
| Batch generation | ✗ | ✗ | ✓ | ✓ | ✓ |
| Brand‑safe filters | ✗ | ✗ | ✓ | ✓ | ✓ |
| Cultural narrative shaping | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Monitoring & Security** | | | | | |
| Basic usage logs | ✓ | ✓ | ✓ | ✓ | ✓ |
| Audit logs & observability | ✗ | ✗ | ✗ | ✓ | ✓ |
| Enterprise audit logs (365d) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Exportable audit trails | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Support & Deployment** | | | | | |
| Community support | ✓ | ✓ | ✓ | ✓ | ✗ |
| Priority support | ✗ | ✓ | ✓ | ✓ | ✓ |
| 24/7 support with SLAs | ✗ | ✗ | ✗ | ✗ | ✓ |
| On‑prem / VPC deployment | ✗ | ✗ | ✗ | ✗ | ✓ |
| Dedicated governance engine | ✗ | ✗ | ✗ | ✗ | ✓ |
| Compliance modules (GDPR, HIPAA) | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## Governance Presets by Tier

Each plan includes access to configurable governance presets:

### Default Governance
- **Available:** All tiers
- **Profile:** Balanced safety and expressiveness
- **Filters:** Block violence, self‑harm, hate, illegal activity. Filter sexual content and misinformation.
- **Cultural:** Medium diaspora sensitivity, strict slur detection, stereotype prevention
- **Youth Protection:** Disabled

### High‑Sensitivity Mode
- **Available:** PRO and above
- **Profile:** Maximum protection for vulnerable contexts
- **Filters:** Block all major violation categories
- **Cultural:** High diaspora sensitivity, historical trauma awareness
- **Youth Protection:** Enabled (age 13+)

### Experimental Governance
- **Available:** DEV+ and above (internal only)
- **Profile:** Looser boundaries for testing and research
- **Filters:** Filter violence and sexual content, block self‑harm and hate
- **Note:** Not for production use

### Sovereign Enterprise Governance
- **Available:** SOVEREIGN tier only
- **Profile:** Compliance‑grade with local context modules
- **Compliance:** GDPR, HIPAA, local government regimes
- **Logging:** 365‑day retention with audit export
- **Context Modules:** Jamaica, Caribbean, African diaspora

---

## API Endpoints

### Billing
- `POST /api/v1/billing/checkout` — Create Stripe Checkout session
- `GET /api/v1/billing/portal` — Create Billing Portal session
- `GET /api/v1/billing/plan` — Get current plan and billing info

### Entitlements
- `GET /api/v1/entitlements` — Get user's feature flags and limits

### Usage & Logs
- `GET /api/v1/usage/summary?window=30d` — Aggregated usage statistics
- `GET /api/v1/usage/logs?limit=50&offset=0` — Paginated governance logs

---

## Upgrade Path

1. **Start with BASIC** (free) — Explore governance capabilities
2. **Upgrade to PRO** — Unlock unlimited requests and priority support
3. **Move to STUDIO or DEV+** — Scale for media teams or production APIs
4. **Enterprise via SOVEREIGN** — Compliance, dedicated support, custom deployment

---

## FAQs

**Q: Can I switch plans mid-cycle?**
- Yes! Pro-rata billing applies when you upgrade. Downgrades take effect at the next billing cycle.

**Q: What payment methods do you accept?**
- Credit/debit cards via Stripe. SOVEREIGN customers can request custom billing arrangements.

**Q: Is there a free trial for paid plans?**
- Contact sales for SOVEREIGN tier trials. BASIC is always free.

**Q: What happens if I exceed my daily request limit?**
- BASIC tier requests are throttled. PRO and above are automatically upgraded for that cycle (charged overage fees if policy applies).

**Q: Can I use custom governance pipelines on lower tiers?**
- No, custom pipelines are DEV+ and above. Lower tiers use pre-defined governance presets.

---

For questions or custom arrangements, contact **sales@frasberg.ai** or visit our [support center](https://support.frasberg.ai).
