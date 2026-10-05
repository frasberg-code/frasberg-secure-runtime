# Frasberg Autonomous Cloud — Implementation Guide

## Overview

This document describes the implementation of the Frasberg Autonomous Cloud platform, a complete autonomous infrastructure system with:

- **Autonomous Cloud Operations (ACO)** - Governance and decision-making
- **Commercial Tiering** - 5 enterprise tiers (Basic, Pro, Enterprise, Sovereign, Ultra)
- **Billing Engine** - Usage-based billing with multiple event types
- **Federation** - Multi-tenant management with federation view
- **Multi-Region** - Support for 7 global regions
- **Documentation** - Generated dynamic documentation
- **Marketing** - Public-facing site and status page
- **Onboarding** - Guided tenant creation and configuration

## Architecture

### API Layer (`/api/v1`)

- `/aco/*` - Autonomous Cloud Operations
- `/tiers/*` - Commercial tiering
- `/billing/*` - Billing and invoicing
- `/federation/*` - Multi-tenant federation view
- `/partners/*` - Partner program management
- `/docs/*` - Documentation generation
- `/status/*` - Public status pages
- `/onboarding/*` - Tenant onboarding
- `/launch/*` - Launch event details
- `/tenants/*` - Tenant management

### Database Schema

Uses PostgreSQL with the following tables:

- `tenants` - Tenant registry with tier and region
- `aco_decisions` - Governance decisions and approvals
- `billing_events` - Usage events for billing
- `partners` - Partner program registry
- `audit_logs` - Complete audit trail
- `health_status` - Regional and tenant health
- `commercial_policies` - Tier definitions
- `documentation` - Dynamic documentation
- `global_config` - Global configuration

### Frontend Components

React components in `/console`:

- `aco-dashboard.tsx` - ACO operations console
- `federation-governance.tsx` - Federation view
- `tiering-billing.tsx` - Tier management and billing
- `autonomous-cloud-onboarding.tsx` - Tenant onboarding
- `autonomous-cloud-home.tsx` - Marketing homepage
- `status-page.tsx` - Public status page

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   ```

3. **Start PostgreSQL**
   ```bash
   docker-compose -f docker-compose.autonomous.yml up -d postgres
   ```

4. **Build and run API**
   ```bash
   npm run build
   npm start
   ```

   API runs on `http://localhost:3001`

5. **Start console UI**
   ```bash
   cd console
   npm install
   npm run dev
   ```

   Console runs on `http://localhost:3000`

### Docker Deployment

```bash
docker-compose -f docker-compose.autonomous.yml up
```

This starts:
- PostgreSQL database on port 5432
- API on port 3001
- Console UI on port 3000

## API Examples

### Create Tenant

```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "tier": "enterprise",
    "region": "us-west"
  }'
```

### Get ACO Dashboard

```bash
curl http://localhost:3001/api/v1/aco/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Record Billing Event

```bash
curl -X POST http://localhost:3001/api/v1/billing/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "action",
    "units": 10,
    "amount": 5.50
  }'
```

### Get Federation View

```bash
curl http://localhost:3001/api/v1/federation/view \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Public Status

```bash
curl http://localhost:3001/api/v1/status/public/overview
```

## Database Initialization

The database schema is automatically initialized on first run. To manually initialize:

```bash
npm run migrate
```

## Commercial Tiers

| Tier | Price | Features |
|------|-------|----------|
| Basic | $99/mo | Assist mode, cost optimization |
| Pro | $499/mo | Full autonomy, SLA protection |
| Enterprise | $1,999/mo | Global autonomy, compliance, governance |
| Sovereign | $2,999/mo | Region lock, regulated compliance |
| Ultra | $4,999/mo | Federation, global routing, resilience |

## Multi-Region Support

Supported regions:
- us-west
- us-east
- eu-central
- apac
- latam
- middle-east
- africa

Each region has:
- Autonomous runtime
- Health monitoring
- SLA enforcement
- Regional compliance

## Billing System

Billing events tracked:
- `decision` - Autonomy decisions
- `action` - Autonomous actions
- `recovery` - Recovery events
- `optimization` - Cost optimization
- `sla_protection` - SLA protection triggered
- `routing` - Region routing
- `calibration` - Calibration cycles
- `drift_correction` - Drift corrections

## Security

- JWT-based authentication
- Role-based access control (admin, user)
- Input validation with Zod schemas
- Database transaction support
- Audit logging for all actions
- PostgreSQL with prepared statements (SQL injection prevention)

## Observability

Each request is logged with:
- Endpoint
- Method
- Status code
- Response time
- Errors

Audit logs track:
- Tenant ID
- Action performed
- Actor
- Resource
- Changes

## Next Steps

### Phase 1 - Foundation (Current)
✓ API layer with all endpoints
✓ Database persistence
✓ Basic frontend components
✓ Docker setup

### Phase 2 - Scaling
- [ ] Multi-region deployment
- [ ] Kubernetes manifests
- [ ] Auto-scaling policies
- [ ] Monitoring dashboards

### Phase 3 - Enterprise Features
- [ ] Advanced compliance controls
- [ ] Custom SLA profiles
- [ ] Partner ecosystem
- [ ] Advanced analytics

### Phase 4 - Global Launch
- [ ] Marketing site deployment
- [ ] Press kit generation
- [ ] Partner announcements
- [ ] Launch event execution

## Troubleshooting

### Database connection failed
- Ensure PostgreSQL is running on port 5432
- Check `.env` credentials
- Verify `DB_HOST` is correct

### Port already in use
- Change PORT in `.env`
- Or kill existing process: `lsof -ti:3001 | xargs kill`

### Authentication errors
- Regenerate JWT_SECRET in `.env`
- Create new auth token with correct tenant ID

## Support

For issues or questions, refer to:
- Architecture docs: `/docs/architecture.md`
- API reference: `/docs/api-reference.md`
- Development guide: `/DEVELOPMENT.md`

---

**Frasberg Autonomous Cloud v1.0** - The self-driving AI cloud for enterprises.
