# FRASBERG AI Usage & Logging API

## Overview

The Usage API provides visibility into request consumption, governance decisions, and audit trails. All users have access to their own usage and logs.

## Endpoints

### GET /api/v1/usage/summary?window=30d

Retrieve aggregated usage statistics over a time window.

**Query Parameters:**

- `window` (string, optional): Time window for aggregation. Options: `1d`, `7d`, `30d`, `90d` (default: `30d`)

**Response (200 OK):**

```json
{
  "window": "30d",
  "totalRequests": 123456,
  "blockedByGovernance": 234,
  "redirectedByGovernance": 89,
  "lastUpdated": "2026-06-11T05:00:00Z"
}
```

**Fields:**

- `window`: The requested time window
- `totalRequests`: Total requests processed in the window
- `blockedByGovernance`: Requests rejected by governance filters
- `redirectedByGovernance`: Requests flagged or modified by governance rules
- `lastUpdated`: ISO 8601 timestamp of last data refresh

---

### GET /api/v1/usage/logs?limit=50&offset=0

Retrieve paginated governance and usage logs with detailed decision information.

**Query Parameters:**

- `limit` (integer, optional): Number of results per page (default: 50, max: 500)
- `offset` (integer, optional): Pagination offset (default: 0)

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "log_01",
      "timestamp": "2026-06-11T04:59:00Z",
      "endpoint": "/ai/chat",
      "decision": "allowed",
      "reason": null,
      "planId": "PRO"
    },
    {
      "id": "log_02",
      "timestamp": "2026-06-11T04:58:30Z",
      "endpoint": "/ai/chat",
      "decision": "blocked",
      "reason": "harmful_content",
      "planId": "PRO"
    }
  ],
  "limit": 50,
  "offset": 0,
  "total": 2000
}
```

**Log Item Fields:**

- `id`: Unique log entry identifier
- `timestamp`: ISO 8601 timestamp of the request
- `endpoint`: API endpoint that was called
- `decision`: Governance decision (`allowed`, `blocked`, `redirected`, `flagged`)
- `reason`: Reason for decision (null if allowed). Examples: `harmful_content`, `sexual_content`, `hate_speech`, `misinformation`
- `planId`: User's plan at time of request

**Possible Decision Reasons:**

- `harmful_content`
- `self_harm`
- `hate_speech`
- `sexual_content`
- `illegal_activities`
- `misinformation`
- `rate_limit_exceeded`
- `plan_limit_exceeded`
