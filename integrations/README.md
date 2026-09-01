# Integrations Overview

This directory contains all documentation for integrating external systems with Frasberg.

Primary focus: **Luchii ↔ Frasberg Integration**

---

## Luchii Integration Documents

### Core
1. **`luchii.md`** — Main integration guide (async job flow, backend wiring, frontend playback)
2. **`luchii-developer-handbook.md`** — Unified handbook for new engineers
3. **`luchii-api-reference.md`** — Complete API reference (all endpoints)

### Testing & Deployment
4. **`luchii-test-suite.md`** — End-to-end test suite for reliability
5. **`luchii-postman.json`** — Postman collection for manual testing

### Optional Features
6. **`luchii-webhooks.md`** — Webhook integration (instant updates)
7. **`luchii-admin.md`** — Admin panel controls (manage tasks, billing)

### Specifications
8. **`luchii-openapi.yaml`** — OpenAPI 3.1 specification
9. **`luchii-architecture.svg`** — System architecture diagram

---

## Quick Start

**For new engineers:**
1. Start with `luchii.md` (5 min read)
2. Review `luchii-developer-handbook.md` (10 min)
3. Implement backend endpoint (see code snippets)
4. Test with `luchii-test-suite.md`

**For API reference:**
- See `luchii-api-reference.md`
- Or import `luchii-openapi.yaml` into Swagger/Redoc
- Or import `luchii-postman.json` into Postman

**For admin features:**
- See `luchii-admin.md`

**For webhooks:**
- See `luchii-webhooks.md`

---

## Integration Checklist

### Backend
- [ ] Set `FRASBERG_API_KEY` env var
- [ ] Implement `/api/video` endpoint
- [ ] Wired POST `/v1/generate`
- [ ] Wired polling loop
- [ ] Return `video_url` to frontend

### Frontend
- [ ] Call `/api/video` from UI
- [ ] Render `<video src={video_url}>`
- [ ] Test playback
- [ ] Handle errors

### Testing
- [ ] Run test suite from `luchii-test-suite.md`
- [ ] Verify async flow end-to-end
- [ ] Load test (1k concurrent)
- [ ] Error scenarios

### Deployment
- [ ] API key rotated
- [ ] SSL/TLS enforced
- [ ] Error handling complete
- [ ] Monitoring enabled
- [ ] Runbooks documented

---

## Support

- **Questions?** → `#frasberg-integrations` (Slack)
- **Bug reports?** → GitHub Issues
- **Feature requests?** → GitHub Discussions

---

## Document Index

| Document | Purpose | Audience |
|----------|---------|----------|
| `luchii.md` | Quick start | All engineers |
| `luchii-developer-handbook.md` | Complete reference | Onboarding |
| `luchii-api-reference.md` | API docs | Backend devs |
| `luchii-test-suite.md` | Testing | QA, Devs |
| `luchii-postman.json` | Manual testing | QA, Devs |
| `luchii-webhooks.md` | Webhooks | Advanced |
| `luchii-admin.md` | Admin features | Admin devs |
| `luchii-openapi.yaml` | OpenAPI spec | API consumers |
| `luchii-architecture.svg` | System diagram | Architects |

---

## Ownership

- **Integration Lead:** @integration-lead
- **API Maintainer:** @api-maintainer
- **Docs Maintainer:** @docs-maintainer

---

**Last Updated:** September 1, 2026  
**Status:** ✅ Complete
