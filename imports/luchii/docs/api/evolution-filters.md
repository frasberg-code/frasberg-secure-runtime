# Evolution Filters REST API

## Overview

The Evolution Filters REST API allows management and evaluation of evolution plans against governance criteria. Filters are categorized into four types:

- **Sovereignty**: Residency constraints and corridor restrictions
- **Safety**: SLA, latency, and compliance requirements
- **Performance**: Throughput, resource utilization, and response time
- **Mesh**: Corridor health and federation balance

## Endpoints

### Create Filter

```
POST /api/v1/evolution/filters
Content-Type: application/json

{
  "name": "High Performance Safety Filter",
  "description": "Ensures high performance with safety constraints",
  "type": "SAFETY",
  "criteria": {
    "slaMinimum": 95,
    "latencyMaxMs": 500,
    "complianceRequired": true
  },
  "enabled": true
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "High Performance Safety Filter",
  "description": "Ensures high performance with safety constraints",
  "type": "SAFETY",
  "criteria": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slaMinimum": 95,
    "latencyMaxMs": 500,
    "complianceRequired": true
  },
  "enabled": true,
  "createdAt": "2026-07-17T10:00:00Z",
  "updatedAt": "2026-07-17T10:00:00Z"
}
```

### List Filters

```
GET /api/v1/evolution/filters?page=1&limit=20&enabled=true&type=SAFETY
```

**Response (200 OK):**
```json
{
  "filters": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "High Performance Safety Filter",
      "type": "SAFETY",
      "enabled": true,
      "createdAt": "2026-07-17T10:00:00Z",
      "updatedAt": "2026-07-17T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Get Filter

```
GET /api/v1/evolution/filters/{filterId}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "High Performance Safety Filter",
  "type": "SAFETY",
  "criteria": {...},
  "enabled": true,
  "createdAt": "2026-07-17T10:00:00Z",
  "updatedAt": "2026-07-17T10:00:00Z"
}
```

### Update Filter

```
PUT /api/v1/evolution/filters/{filterId}
Content-Type: application/json

{
  "name": "Updated Filter Name",
  "criteria": {
    "slaMinimum": 98
  }
}
```

### Delete Filter

```
DELETE /api/v1/evolution/filters/{filterId}
```

**Response (204 No Content)**

### Apply Filter to Evolution Plan

```
POST /api/v1/evolution/filters/{filterId}/apply
Content-Type: application/json

{
  "planId": "plan-123",
  "plan": {
    "id": "plan-123",
    "name": "Test Evolution Plan",
    "sovereignty": {
      "residency": "US-EAST",
      "corridors": ["corridor-1", "corridor-2"]
    },
    "safety": {
      "sla": 99,
      "latency": 250,
      "compliant": true
    },
    "performance": {
      "throughput": 10000,
      "utilization": 65,
      "responseTime": 200
    },
    "mesh": {
      "corridorHealth": 0.95,
      "balanced": true,
      "imbalance": 0.02
    }
  }
}
```

**Response (200 OK):**
```json
{
  "filterId": "550e8400-e29b-41d4-a716-446655440000",
  "planId": "plan-123",
  "passed": true
}
```

### Apply Multiple Filters

```
POST /api/v1/evolution/filters/apply-multiple/batch
Content-Type: application/json

{
  "filterIds": [
    "filter-1",
    "filter-2",
    "filter-3"
  ],
  "plan": {
    "id": "plan-123",
    "name": "Test Evolution Plan",
    ...
  }
}
```

**Response (200 OK):**
```json
{
  "planId": "plan-123",
  "passed": true,
  "results": [
    {
      "filterId": "filter-1",
      "passed": true
    },
    {
      "filterId": "filter-2",
      "passed": true
    },
    {
      "filterId": "filter-3",
      "passed": false
    }
  ]
}
```

## Filter Types

### Sovereignty Filter
```json
{
  "type": "SOVEREIGNTY",
  "criteria": {
    "residencyConstraint": "US-EAST",
    "corridorRestrictions": ["restricted-corridor-1"]
  }
}
```

### Safety Filter
```json
{
  "type": "SAFETY",
  "criteria": {
    "slaMinimum": 95,
    "latencyMaxMs": 500,
    "complianceRequired": true
  }
}
```

### Performance Filter
```json
{
  "type": "PERFORMANCE",
  "criteria": {
    "throughputMinRps": 1000,
    "resourceUtilizationMax": 80,
    "responseTimeMaxMs": 1000
  }
}
```

### Mesh Filter
```json
{
  "type": "MESH",
  "criteria": {
    "corridorHealthMin": 0.7,
    "federationBalance": true,
    "meshImbalanceThreshold": 0.1
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message",
  "code": "VALIDATION_ERROR"
}
```

### 404 Not Found
```json
{
  "error": "Evolution Filter not found: filter-id",
  "code": "NOT_FOUND"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Constitutional violation reason",
  "code": "CONSTITUTIONAL_VIOLATION"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message",
  "code": "INTERNAL_ERROR"
}
```
