# Frasberg Autonomous Cloud — Architecture

## System Overview

The Frasberg Autonomous Cloud is built as a unified control plane with seven integrated layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (ACO Console, Federation Console, Marketing Site, Status)  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (v1)                         │
│  (/aco, /tiers, /billing, /federation, /partners, /docs)   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  (ACO, Tiers, Billing, Federation, Partners, Docs)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Middleware Layer                          │
│  (Auth, Validation, Error Handling, Logging)               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
│  (PostgreSQL with connection pooling and transactions)      │
└─────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Presentation Layer

User-facing interfaces built with React:

- **ACO Dashboard** - Operations console with health, stability, audit logs
- **Federation Governance** - Multi-tenant view with per-tenant health metrics
- **Tiering & Billing** - Commercial tier management and billing breakdown
- **Onboarding Flow** - Step-by-step tenant creation and configuration
- **Marketing Site** - Public homepage with capabilities, tiers, pricing
- **Public Status Page** - Real-time system and regional status

### 2. API Layer

RESTful API endpoints organized by domain:

```
/api/v1/
├── /aco
│   ├── GET /dashboard
│   ├── GET /decisions
│   ├── POST /decisions
│   ├── POST /decisions/:id/approve
│   └── POST /decisions/:id/reject
├── /tiers
│   ├── GET /list
│   ├── GET /tenant
│   └── POST /tenant
├── /billing
│   ├── GET /summary
│   ├── GET /history
│   ├── POST /events
│   └── GET /invoice/:year/:month
├── /federation
│   ├── GET /view
│   ├── GET /stability
│   ├── GET /region/:region/health
│   ├── GET /tenant/:tenantId/health
│   └── POST /health/record
├── /partners
│   ├── GET /
│   ├── POST /
│   ├── POST /:id/approve
│   └── PUT /:id/apis
├── /docs
│   ├── GET /section/:id
│   ├── GET /all
│   └── POST /section/:id
└── /status
    ├── GET /public/overview
    ├── GET /public/regions
    └── GET /public/federation
```

### 3. Service Layer

Domain-specific business logic:

**ACO Service** (`services/aco.ts`)
- Dashboard aggregation
- Decision recording and approval
- Audit logging

**Tiering Service** (`services/tiers.ts`)
- Tier definitions and features
- Tenant tier management
- SLA enforcement

**Billing Service** (`services/billing.ts`)
- Event recording
- Summary calculation
- Invoice generation

**Federation Service** (`services/federation.ts`)
- Health status tracking
- Multi-tenant view
- Regional health metrics

**Partners Service** (`services/partners.ts`)
- Partner registration
- Tier management
- API assignment

**Documentation Service** (`services/docs.ts`)
- Dynamic section generation
- Content management

**Tenants Service** (`services/tenants.ts`)
- Tenant CRUD operations
- Metadata management
- Region/tier assignment

### 4. Middleware Layer

Request processing pipeline:

- **Authentication** - JWT token validation
- **Authorization** - Role-based access control
- **Validation** - Zod schema validation
- **Error Handling** - Global error handler with logging
- **Logging** - Request/response logging

### 5. Database Layer

PostgreSQL persistence with:

- Connection pooling (max 20 connections)
- Transaction support
- Prepared statements (SQL injection prevention)
- Indexes for performance

## Data Model

### Core Tables

**tenants**
- id (UUID, PK)
- name (string)
- tier (enum: basic|pro|enterprise|sovereign|ultra)
- region (enum: us-west|us-east|eu-central|apac|latam|middle-east|africa)
- created_at, updated_at (timestamps)
- metadata (JSONB)

**aco_decisions**
- id (UUID, PK)
- tenant_id (FK to tenants)
- type (enum: approve_policy|approve_safety|approve_upgrade|request_review)
- payload (JSONB)
- status (enum: pending|approved|rejected)
- created_at, updated_at (timestamps)

**billing_events**
- id (UUID, PK)
- tenant_id (FK to tenants)
- kind (enum: decision|action|recovery|optimization|sla_protection|routing|calibration|drift_correction)
- units (integer)
- amount (decimal)
- created_at (timestamp)

**health_status**
- id (UUID, PK)
- tenant_id (FK to tenants)
- region (string)
- score (0-100)
- uptime (percentage)
- sla_health (percentage)
- last_updated (timestamp)

**partners**
- id (UUID, PK)
- name (string)
- tier (enum: integration|reseller|strategic)
- contact_email (string)
- apis (array of strings)
- status (enum: pending|approved|active|inactive)
- created_at (timestamp)

**audit_logs**
- id (UUID, PK)
- tenant_id (FK to tenants, nullable)
- action (string)
- actor (string)
- resource (string)
- changes (JSONB)
- created_at (timestamp)

## Multi-Region Architecture

Each region has:

1. **Autonomous Runtime** - Executes autonomous decisions
2. **Health Monitoring** - Per-region health tracking
3. **SLA Enforcement** - Region-specific SLA guarantees
4. **Compliance** - Region-specific compliance controls
5. **Federation Link** - Connection to global control plane

Regions:
- us-west (US primary)
- us-east (US secondary)
- eu-central (EU compliance)
- apac (Asia-Pacific)
- latam (Latin America)
- middle-east (Middle East & Africa)
- africa (Africa)

## Commercial Model

### Tier Features

| Tier | Monthly | Features |
|------|---------|----------|
| Basic | $99 | assist_mode, cost_optimization |
| Pro | $499 | full_autonomy, sla_protection |
| Enterprise | $1,999 | global_autonomy, compliance, governance |
| Sovereign | $2,999 | region_lock, regulated_compliance |
| Ultra | $4,999 | federation, global_routing, global_resilience |

### Billing Events

Each action generates a billing event:

- `decision` - Autonomy decisions (base rate)
- `action` - Autonomous actions (higher rate)
- `recovery` - Recovery events (premium)
- `optimization` - Cost optimization savings (credit)
- `sla_protection` - SLA protection triggered (premium)
- `routing` - Region routing (per unit)
- `calibration` - Calibration cycles (base rate)
- `drift_correction` - Drift corrections (premium)

## Security Architecture

### Authentication

- JWT tokens with 24-hour expiration
- Tenant ID + User ID + Role embedded in token
- Token generation on successful onboarding

### Authorization

- Role-based: admin, user
- Endpoint-level role checks
- Tenant isolation (can only access own tenant data)

### Data Protection

- Prepared statements for SQL injection prevention
- Input validation on all endpoints
- Error responses don't leak sensitive info
- Audit logging of all sensitive operations

## Deployment Architecture

### Development

```
Local Machine
├── API (localhost:3001)
├── Console (localhost:3000)
└── PostgreSQL (localhost:5432)
```

### Docker

```
docker-compose.autonomous.yml
├── postgres (PostgreSQL 15)
├── api (Node.js + Express)
└── console (Node.js + React)
```

### Production (Kubernetes)

```
Autonomous Cloud Cluster
├── API Deployment (multi-replica)
├── PostgreSQL StatefulSet
├── Console Deployment
├── Ingress (HTTPS)
└── Monitoring Stack
```

## Performance Considerations

### Database Optimization

- Indexed lookups on tenant_id, tier, region, status
- Connection pooling (min 5, max 20)
- Transaction batching for bulk operations
- JSONB indexes for metadata queries

### API Optimization

- Response caching for federation view (30s)
- Health check aggregation (30s cache)
- Paginated audit logs (limit 50 by default)
- Lazy loading of audit details

### Frontend Optimization

- React component memoization
- 30-second dashboard refresh intervals
- Lazy loading of documentation
- Image CDN for marketing site

## Error Handling

All errors follow a standard format:

```json
{
  "error": "Human-readable message",
  "timestamp": "2026-07-17T12:00:00Z"
}
```

HTTP Status Codes:
- 200 - Success
- 201 - Created
- 400 - Validation error
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not found
- 500 - Server error

## Monitoring & Observability

### Logging

- All API requests logged with method, path, status
- Error stack traces logged
- Audit logs for all state changes
- Health check pings logged

### Metrics

- Request latency per endpoint
- Database query latency
- Active connections
- Error rates by endpoint
- Billing events per type

### Health Checks

- `/health` endpoint (non-authenticated)
- Database connectivity check
- API responsiveness

---

**Document Version**: 1.0
**Last Updated**: 2026-07-17
