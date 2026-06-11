# FRASBERG AI Entitlements API

## Overview

The Entitlements API returns the feature flags and usage limits for the authenticated user's current plan. This determines what capabilities and quotas the user has access to.

## Endpoints

### GET /api/v1/entitlements

Retrieve the feature set and usage limits for the current user based on their plan.

**Response (200 OK):**

```json
{
  "planId": "PRO",
  "limits": {
    "requestsPerDay": 10000,
    "maxConcurrentSessions": 5
  },
  "features": {
    "advancedTonalModulation": true,
    "governancePipelines": false,
    "fullApiAccess": true,
    "batchGeneration": false,
    "enterpriseAuditLogs": false
  }
}
```

## Plan Feature Matrix

| Feature | BASIC | PRO | STUDIO | DEV+ | SOVEREIGN |
|---------|-------|-----|--------|------|----------|
| **Limits** | | | | | |
| Requests/day | 30 | 10,000 | 50,000 | 1,000,000 | Custom |
| Concurrent sessions | 1 | 5 | 10 | 50 | Custom |
| **Features** | | | | | |
| Core governance | ✓ | ✓ | ✓ | ✓ | ✓ |
| Advanced tonal modulation | ✗ | ✓ | ✓ | ✓ | ✓ |
| Governance pipelines | ✗ | ✗ | ✓ | ✓ | ✓ |
| Full API access | ✗ | ✓ | ✓ | ✓ | ✓ |
| Batch generation | ✗ | ✗ | ✓ | ✓ | ✓ |
| Enterprise audit logs | ✗ | ✗ | ✗ | ✓ | ✓ |
| Compliance modules | ✗ | ✗ | ✗ | ✗ | ✓ |

## Response Fields

- **planId**: The user's current subscription tier
- **limits**: Object containing usage quotas
- **features**: Object with boolean flags indicating feature availability
