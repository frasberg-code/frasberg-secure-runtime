# Constitutional Dashboard & SIE REST API

## Overview

REST API endpoints for accessing system intelligence, dashboard state, and SIE analysis results.

---

## Dashboard Endpoints

All dashboard endpoints return the current system state with caching.

### GET /api/v1/dashboard

Get the full dashboard state including all metrics and insights.

**Query Parameters:**
- `format` - Response format: `json` (default) or `summary`

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "systemScore": 85,
  "safetyEnvelope": {
    "slaOk": true,
    "latencyOk": true,
    "complianceOk": true,
    "sovereigntyOk": true,
    "meshOk": true,
    "evolutionOk": true,
    "overallHealthy": true
  },
  "mode": {
    "currentMode": "steady_state",
    "allowedTransitions": ["evolution", "federation"],
    "lastTransitionTime": "2026-07-17T09:00:00Z"
  },
  "sovereignStats": {
    "residencyViolations": 0,
    "corridorViolations": 0,
    "overridesActive": 2,
    "evolutionBlocksRecent": 0,
    "meshImbalancedRegions": 0
  },
  "corridorHealth": [
    {
      "corridorId": "us-east::us-west",
      "name": "US East to US West",
      "healthScore": 0.95,
      "latencyP95Ms": 150,
      "status": "healthy",
      "saturation": 0.45
    }
  ],
  "metrics": {
    "uptimePercent": 99.9,
    "avgLatencyMs": 145,
    "p99LatencyMs": 480,
    "throughputRps": 12500,
    "errorRatePercent": 0.05
  },
  "insights": [...],
  "recommendations": [...]
}
```

### GET /api/v1/dashboard/health

Quick health summary of the system.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "systemScore": 85,
  "status": "healthy",
  "safetyEnvelope": {...},
  "sovereignStats": {...},
  "criticalInsights": 0
}
```

### GET /api/v1/dashboard/insights

Get SIE insights from the dashboard.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "insightsCount": 2,
  "bySeverity": {
    "critical": 0,
    "high": 1,
    "medium": 1,
    "low": 0
  },
  "insights": [
    {
      "id": "sie_override_1234567890",
      "timestamp": "2026-07-17T09:55:00Z",
      "category": "OVERRIDE_PRESSURE",
      "severity": "HIGH",
      "message": "High override pressure detected...",
      "details": {...}
    }
  ]
}
```

### GET /api/v1/dashboard/recommendations

Get SIE recommendations from the dashboard.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "recommendationsCount": 1,
  "byKind": {
    "REDUCE_OVERRIDES": 1
  },
  "recommendations": [
    {
      "id": "rec_reduce_overrides_1234567890",
      "timestamp": "2026-07-17T09:55:00Z",
      "kind": "REDUCE_OVERRIDES",
      "rationale": "Frequent overrides indicate constitutional misalignment.",
      "suggestedChanges": {"overrideMaxDurationHours": 1}
    }
  ]
}
```

### GET /api/v1/dashboard/corridors

Get corridor health information.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "totalCorridors": 3,
  "byStatus": {
    "healthy": 2,
    "degraded": 1,
    "critical": 0,
    "frozen": 0
  },
  "corridors": [...]
}
```

### GET /api/v1/dashboard/metrics

Get system performance metrics.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "metrics": {
    "uptimePercent": 99.9,
    "avgLatencyMs": 145,
    "p99LatencyMs": 480,
    "throughputRps": 12500,
    "errorRatePercent": 0.05
  },
  "systemScore": 85
}
```

### POST /api/v1/dashboard/refresh

Invalidate dashboard cache and refresh data.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:01Z",
  "status": "refreshed",
  "systemScore": 85
}
```

---

## SIE Endpoints

All SIE endpoints trigger analysis and return insights and recommendations.

### GET /api/v1/sie/analyze

Run SIE analysis immediately.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "insightsCount": 2,
  "recommendationsCount": 1,
  "insights": [...],
  "recommendations": [...]
}
```

### GET /api/v1/sie/insights

Get recent SIE insights with filtering and pagination.

**Query Parameters:**
- `category` - Filter by category (SOVEREIGN_RISK, COMPLIANCE_RISK, etc.)
- `severity` - Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 2,
    "returned": 2
  },
  "insights": [...]
}
```

**Example:**
```bash
# Get critical insights
GET /api/v1/sie/insights?severity=CRITICAL

# Get OVERRIDE_PRESSURE insights with pagination
GET /api/v1/sie/insights?category=OVERRIDE_PRESSURE&limit=10&offset=0
```

### GET /api/v1/sie/insights/critical

Get critical SIE insights only.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "criticalCount": 1,
  "insights": [
    {
      "id": "sie_compliance_1234567890",
      "timestamp": "2026-07-17T09:55:00Z",
      "category": "COMPLIANCE_RISK",
      "severity": "CRITICAL",
      "message": "Compliance requirements not met. Immediate intervention required.",
      "details": {"complianceOk": false}
    }
  ]
}
```

### GET /api/v1/sie/recommendations

Get recent SIE recommendations with filtering and pagination.

**Query Parameters:**
- `kind` - Filter by recommendation kind (TIGHTEN_RESIDENCY, FREEZE_CORRIDORS, etc.)
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 1,
    "returned": 1
  },
  "recommendations": [...]
}
```

**Example:**
```bash
# Get REDUCE_OVERRIDES recommendations
GET /api/v1/sie/recommendations?kind=REDUCE_OVERRIDES

# Get recommendations with pagination
GET /api/v1/sie/recommendations?limit=10&offset=0
```

### GET /api/v1/sie/summary

Get summary of SIE analysis results.

**Response (200 OK):**
```json
{
  "timestamp": "2026-07-17T10:00:00Z",
  "insights": {
    "total": 2,
    "bySeverity": {
      "critical": 0,
      "high": 1,
      "medium": 1,
      "low": 0
    },
    "byCategory": {
      "OVERRIDE_PRESSURE": 1,
      "MESH_RISK": 1
    }
  },
  "recommendations": {
    "total": 1,
    "byKind": {
      "REDUCE_OVERRIDES": 1
    }
  }
}
```

---

## Error Responses

All endpoints return structured error responses.

### 503 Service Unavailable

When dashboard or SIE is not available:
```json
{
  "error": "Dashboard not available",
  "code": "DASHBOARD_UNAVAILABLE"
}
```

### 400 Bad Request

When query parameters are invalid:
```json
{
  "error": "Invalid severity value",
  "code": "VALIDATION_ERROR"
}
```

### 500 Internal Server Error

For unexpected errors:
```json
{
  "error": "Internal server error message",
  "code": "INTERNAL_ERROR"
}
```

---

## Usage Examples

### Get System Health

```bash
curl http://localhost:3001/api/v1/dashboard/health
```

### Get Critical Insights

```bash
curl http://localhost:3001/api/v1/sie/insights/critical
```

### Get Recommendations

```bash
curl http://localhost:3001/api/v1/sie/recommendations?kind=REDUCE_OVERRIDES
```

### Refresh Dashboard

```bash
curl -X POST http://localhost:3001/api/v1/dashboard/refresh
```

### Run Analysis

```bash
curl http://localhost:3001/api/v1/sie/analyze
```

---

## Rate Limiting

- Dashboard endpoints: 100 requests/minute (5-second cache reduces actual calls)
- SIE endpoints: 60 requests/minute
- Analysis endpoint: 10 requests/minute (expensive operation)

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / validation error |
| 503 | Service unavailable |
| 500 | Internal server error |

---

Generated: 2026-07-17
