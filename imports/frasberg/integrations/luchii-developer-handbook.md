# Luchii ↔ Frasberg Developer Handbook

This handbook unifies all integration knowledge into a single reference for onboarding engineers.

**Covers:**
- Async job flow
- Backend wiring
- Frontend playback
- Test suite
- Webhooks
- Admin controls
- Architecture

---

## 1. Architecture Overview

Frasberg Engine uses an **async generation model**:

```
1. Luchii sends generation request → receives task_id
2. Luchii polls task until completed
3. Luchii retrieves video_url
4. Luchii plays video in frontend
(Optional: receive webhooks instead of polling)
```

---

## 2. Backend Integration

### Endpoint: `/api/video`
Luchii backend wraps the entire async flow.

**Responsibilities:**
- Create Frasberg job
- Poll until completion
- Return `video_url`

**Key environment variable:**
```bash
FRASBERG_API_KEY=<your key>
```

**Implementation:**
See `/integrations/luchii.md` for full code.

---

## 3. Frontend Integration

The frontend only needs to:
1. Call `/api/video`
2. Receive `{ video_url }`
3. Render `<video src={video_url}>`

**React snippet:**
```tsx
const [videoUrl, setVideoUrl] = useState(null);

async function generate() {
  const r = await fetch("/api/video", {
    method: "POST",
    body: JSON.stringify({ prompt: "...", duration: 5 }),
  });
  const data = await r.json();
  setVideoUrl(data.video_url);
}

return (
  <>
    <button onClick={generate}>Generate Video</button>
    {videoUrl && <video src={videoUrl} controls />}
  </>
);
```

---

## 4. Async Job Flow

```
Frontend → Backend → Frasberg
  ↓         ↓           ↓
 POST /api/video → POST /v1/generate → { task_id }
           ↓                           ↓
       (Polling Loop)
           ↓
    GET /v1/task/{task_id} ← { status, video_url? }
           ↓
       (repeat until completed)
           ↓
    { video_url } → Frontend
           ↓
     Play video
```

---

## 5. Test Suite

See `/integrations/luchii-test-suite.md`.

**Covers:**
- API key loading
- Frasberg reachability
- Job creation
- Polling correctness
- Failure handling
- Frontend playback
- End-to-end flow

**Goal:** Guarantee Luchii ↔ Frasberg works reliably across releases.

---

## 6. Webhooks (Optional)

See `/integrations/luchii-webhooks.md`.

**Events:**
- `task.completed`
- `task.failed`
- `task.running`
- `task.queued`

**Webhook endpoint:**
```http
POST /webhooks/frasberg
```

**Use cases:**
- Instant updates (no polling)
- Better UX for long videos
- Real-time status

---

## 7. Admin Controls

See `/integrations/luchii-admin.md`.

**Admin capabilities:**
- View tasks
- Cancel tasks
- Inspect logs
- View region health
- View billing usage
- Trigger test jobs

**Admin API endpoints:**
```
GET /v1/admin/tasks
POST /v1/admin/task/{id}/cancel
GET /v1/admin/regions
GET /v1/admin/billing/usage
```

---

## 8. Integration Checklist

### Backend
- [ ] `FRASBERG_API_KEY` set
- [ ] `/v1/generate` wired
- [ ] Polling loop implemented
- [ ] Return `video_url`
- [ ] Error handling complete

### Frontend
- [ ] Call `/api/video`
- [ ] Render `<video>`
- [ ] Confirm playback
- [ ] Error states handled

### Webhooks (optional)
- [ ] Endpoint reachable
- [ ] Payload stored
- [ ] Signature validated

### Admin (optional)
- [ ] Admin API keys stored separately
- [ ] RBAC enforced
- [ ] Audit logs recorded

---

## 9. API Reference

See `/integrations/luchii-api-reference.md` for complete endpoint documentation.

### Core Endpoints

**Generation:**
```http
POST /v1/generate           # Create job
GET /v1/task/{task_id}      # Poll status
```

**Admin:**
```http
GET /v1/admin/tasks         # List all tasks
POST /v1/admin/task/{id}/cancel  # Cancel task
GET /v1/admin/regions       # Region health
GET /v1/admin/billing/usage # Billing usage
```

**Utility:**
```http
GET /v1/ping                # Health check
```

---

## 10. Summary

Luchii integrates with Frasberg through a simple, governed, reliable pipeline:

```
Generate → Poll → Complete → Play
(or: Generate → Webhook → Play)
```

This handbook unifies all integration docs into a single reference for engineers.

---

## Quick Links

- **Main Guide:** `/integrations/luchii.md`
- **Test Suite:** `/integrations/luchii-test-suite.md`
- **Webhooks:** `/integrations/luchii-webhooks.md`
- **Admin Controls:** `/integrations/luchii-admin.md`
- **API Reference:** `/integrations/luchii-api-reference.md`
- **OpenAPI Spec:** `/integrations/luchii-openapi.yaml`
- **Postman Collection:** `/integrations/luchii-postman.json`

---

## Getting Help

- Questions? → `#frasberg-integrations` (Slack)
- Found a bug? → Open an issue on GitHub
- Need support? → Email support@frasberg.com

---

Welcome to Frasberg! 🚀
