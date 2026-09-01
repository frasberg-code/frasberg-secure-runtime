# Luchii ↔ Frasberg Integration Guide

This document explains how Luchii connects to Frasberg Engine using the async job model.
It covers backend wiring, frontend playback, response shapes, and verification steps.

---

## Overview

Frasberg Engine uses an **async task model**:

1. You submit a generation request → receive a **task_id**
2. You poll the task until it reaches **completed**
3. You retrieve the **video_url** and play it in the frontend

Luchii integrates by exposing a single backend endpoint (`/api/video`) that wraps this flow.

---

## Backend Flow (Luchii → Frasberg)

### 1. Create a job
```http
POST /v1/generate
Authorization: Bearer <FRASBERG_API_KEY>
Content-Type: application/json

{
  "prompt": "A cinematic test clip",
  "duration": 5,
  "ratio": "16:9",
  "model": "engine"
}
```

Returns:
```json
{
  "task_id": "abc123",
  "status": "queued",
  "region": "us-west-2"
}
```

### 2. Poll the job
```http
GET /v1/task/{task_id}
Authorization: Bearer <FRASBERG_API_KEY>
```

Statuses:
- `queued` — waiting for GPU
- `running` — inference in progress
- `completed` — video ready
- `failed` — engine error

### 3. Return the final video URL

When `status === "completed"`:
```json
{
  "task_id": "abc123",
  "status": "completed",
  "video_url": "https://cdn.frasberg.com/.../video.mp4"
}
```

Your backend returns this `video_url` to the Luchii frontend.

---

## Backend Implementation Snippet

```python
# /app/backend/server.py

import os
import time
import requests
from fastapi import FastAPI, HTTPException

FRASBERG_API_KEY = os.getenv("FRASBERG_API_KEY")
BASE = "https://api.frasberg.com"

app = FastAPI()


def _headers():
    return {
        "Authorization": f"Bearer {FRASBERG_API_KEY}",
        "Content-Type": "application/json",
    }


@app.post("/api/video")
def create_video(payload: dict):
    # 1) Create job
    r = requests.post(
        f"{BASE}/v1/generate",
        json=payload,
        headers=_headers(),
        timeout=10,
    )
    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text)

    task_id = r.json()["task_id"]

    # 2) Poll until completed
    for _ in range(60):  # up to ~2 minutes
        s = requests.get(
            f"{BASE}/v1/task/{task_id}",
            headers=_headers(),
            timeout=10,
        )
        if s.status_code != 200:
            raise HTTPException(s.status_code, s.text)

        data = s.json()

        if data["status"] == "completed":
            return {"video_url": data["video_url"]}

        if data["status"] in ("failed", "cancelled"):
            raise HTTPException(500, "Video generation failed")

        time.sleep(2)

    raise HTTPException(504, "Video generation timed out")
```

---

## Frontend Playback Snippet (React)

```tsx
// Luchii frontend: VideoPlayer.tsx

import React, { useState } from "react";

export function VideoPlayer() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const resp = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A cinematic test clip",
          duration: 5,
          ratio: "16:9",
        }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const data = await resp.json();
      setVideoUrl(data.video_url);
    } catch (err) {
      console.error("Video generation failed:", err);
      alert("Video generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating…" : "Generate Test Video"}
      </button>

      {videoUrl && (
        <video
          src={videoUrl}
          controls
          style={{ marginTop: 16, width: "100%" }}
        />
      )}
    </div>
  );
}
```

---

## Async Job Flow Diagram

```
Luchii Frontend
    ↓
    POST /api/video (prompt, duration, ratio)
    ↓
Luchii Backend
    ↓
    POST /v1/generate
    ↓
Frasberg Engine
    ↓
    Returns: { task_id, status: "queued" }
    ↓
Luchii Backend (Polling Loop)
    ↓
    GET /v1/task/{task_id}
    ↓
Frasberg Engine
    ↓
    Returns: { status: "queued" | "running" | "completed", video_url? }
    ↓
    (repeat until completed)
    ↓
Luchii Backend
    ↓
    Returns: { video_url }
    ↓
Luchii Frontend
    ↓
    <video src={video_url}>
```

---

## Integration Checklist

### Backend
- [x] `FRASBERG_API_KEY` set in `.env`
- [x] Backend loads it via `os.getenv("FRASBERG_API_KEY")`
- [x] `POST /v1/generate` wired correctly
- [x] Polling loop implemented (every 2 seconds)
- [x] Return `video_url` to frontend
- [x] Error handling for failed jobs

### Frontend
- [x] Call `/api/video` from Luchii UI
- [x] On success, read `data.video_url`
- [x] Bind to `<video src={video_url} controls>`
- [x] Verify playback in browser

### Verification
- [x] Run a real test call from the UI
- [x] Confirm response shape matches async flow (no direct MP4 on first call)
- [x] Confirm a video actually plays end-to-end in the browser

---

## Key Points

1. **Async only** — No direct MP4 returned on initial request
2. **Always poll** — Keep calling `/v1/task/{task_id}` until `status === "completed"`
3. **Timeout** — Recommend 120 second total timeout
4. **Error handling** — Watch for `status === "failed"`
5. **CDN delivery** — Video URL is from global CDN, cached and fast

---

## Next Steps

1. Set `FRASBERG_API_KEY` in your backend `.env`
2. Implement `/api/video` endpoint (see snippet above)
3. Implement frontend video player (see snippet above)
4. Test with real Frasberg Engine
5. See `/integrations/luchii-test-suite.md` for comprehensive tests

---

## Support

- Questions? → `#frasberg-integrations` (Slack)
- Need admin controls? → See `/integrations/luchii-admin.md`
- Want webhooks instead of polling? → See `/integrations/luchii-webhooks.md`
- Full API reference? → See `/integrations/luchii-api-reference.md`
