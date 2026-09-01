# Frasberg Engine v2 — Infrastructure Specification

This is the canonical specification for Frasberg Engine v2, covering:

- **API Gateway & Routing** — multi-region, failover-aware
- **GPU Worker Orchestration** — scheduler, autoscaling, error recovery
- **Storage & CDN** — region-local with cross-region replication
- **Metadata Store** — global, strongly consistent
- **Billing & Credits** — metering, refunds, pricing
- **Observability** — logging, metrics, tracing, dashboards
- **Disaster Recovery** — RPO/RTO targets, runbooks, dr drills
- **Security** — auth, encryption, audit, compliance

## Quick Start

1. Review API contracts: `api/video-generation-api.ts`
2. Review database schema: `db/schema.sql`
3. Review GPU worker skeleton: `worker/gpu-worker-skeleton.py`
4. Review scheduler skeleton: `scheduler/scheduler-skeleton.ts`
5. Review deployment architecture: `ops/architecture.md`
6. Review operational runbooks: `ops/runbooks/`

## Files in This Directory

### API & SDK
- `api/video-generation-schema.ts` — Zod schema for video generation requests
- `api/video-generation-router.ts` — Model router (frasberg-engine → internal endpoints)
- `api/handlers/generate-video.ts` — Next.js API handler
- `api/handlers/get-task.ts` — Task status polling
- `api/handlers/cancel-task.ts` — Task cancellation
- `api/handlers/health.ts` — Region health checks
- `sdk/video-client.ts` — Shared client SDK
- `api/openapi-spec.yaml` — Full OpenAPI 3.0 spec

### Database
- `db/schema.sql` — Full schema (tasks, events, billing, auth)
- `db/migrations/` — Migration scripts

### GPU Infrastructure
- `worker/gpu-worker-skeleton.py` — GPU worker runtime
- `worker/Dockerfile` — GPU worker container
- `scheduler/scheduler-skeleton.ts` — Task scheduler
- `scheduler/autoscaler.ts` — GPU node autoscaling

### Storage & CDN
- `storage/replication-topology.yaml` — Cross-region replication config
- `storage/cdn-rules.yaml` — Cache-Control and invalidation rules
- `storage/storage-client.ts` — Object storage abstraction

### Operations & Runbooks
- `ops/architecture.md` — Deployment diagrams and architecture
- `ops/sre-handbook.md` — SRE responsibilities and playbooks
- `ops/load-testing-plan.md` — Load test scenarios and pass criteria
- `ops/runbooks/region-outage.md` — Failover procedures
- `ops/runbooks/gpu-cluster-degradation.md` — GPU troubleshooting
- `ops/runbooks/db-outage.md` — Database failover
- `ops/runbooks/storage-outage.md` — Storage recovery
- `ops/runbooks/webhook-failure.md` — Webhook retry logic
- `ops/runbooks/billing-anomalies.md` — Billing audit
- `ops/runbooks/autoscaler-flapping.md` — Autoscaler tuning
- `ops/runbooks/high-error-rate.md` — Error investigation
- `ops/runbooks/latency-degradation.md` — Performance troubleshooting

### Configuration
- `config/engine.yaml` — Engine configuration (models, regions, pricing)
- `config/billing.yaml` — Billing configuration
- `config/alerts.yaml` — Alert definitions

### Developer Guide
- `dev/ONBOARDING.md` — Developer onboarding steps
- `dev/PRODUCTION_CHECKLIST.md` — Pre-production validation
- `dev/LOCAL_DEV_SETUP.md` — Local development environment

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│        Global Load Balancer / API Gateway           │
│    (auth, rate limiting, region routing)            │
└──────────────────┬──────────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │us-west│  │us-east │  │eu-west│
   └───┬────┘  └───┬────┘  └────┬───┘
       │           │           │
   ┌───▼────────────▼───────────▼───┐
   │    Global Metadata DB           │
   │  (multi-region Postgres)        │
   └────────────────┬────────────────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │GPU Pool │ │GPU Pool │ │GPU Pool │
  │ (A100)  │ │ (L40)   │ │ (H100)  │
  └────┬────┘ └────┬────┘ └────┬────┘
       │           │           │
       └───────────┼───────────┘
                   ▼
        ┌──────────────────────┐
        │ Region Object Storage│
        │   (R2/S3/MinIO)      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Global CDN         │
        │(cdn.frasberg.com)    │
        └──────────────────────┘
```

## Key Concepts

### Task Lifecycle

```
created → queued → running → completed
                 ↘           ↗
                   cancelled
                 ↘           ↗
                      failed
```

### Model Routing

- `frasberg-engine` → `gen4.5`, gpu-medium, us-west
- `frasberg-engine-turbo` → `gen4_turbo`, gpu-small, us-west
- `frasberg-engine-cinema` → `veo3`, gpu-large, us-east
- `frasberg-engine-veo` → `veo3.1_fast`, gpu-large, eu-west

### Regions

- **us-west** (primary) → us-east (secondary)
- **us-east** (primary) → eu-west (secondary)
- **eu-west** (primary) → us-west (secondary)
- **ap-southeast** (primary) → us-west (secondary)

### Billing

Credits per second:
- frasberg-engine: 1 credit/sec
- frasberg-engine-turbo: 0.5 credit/sec
- frasberg-engine-cinema: 2 credits/sec
- frasberg-engine-veo: 3 credits/sec

## SLA

- **Availability**: 99.9% per region, 99.99% CDN
- **Latency**: p95 < 3s queue, p95 < 12s total (5s video)
- **Error Rate**: < 0.5% engine, < 0.2% GPU
- **Durability**: 11 nines (storage), multi-region (metadata)

## Deployment

```bash
# Create branch
git checkout -b feat/engine-v2-infrastructure

# Copy files
cp -r engine-v2/* .

# Install dependencies
npm install  # for TypeScript/Node
pip install -r requirements.txt  # for Python

# Run local dev
docker-compose up -d
node scheduler/index.js &
python worker/main.py --cpu &

# Test
curl -X POST http://localhost:3000/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","duration":1,"ratio":"16:9","motion":"low","guidance_scale":7,"seed":null,"output_format":"mp4"}'
```

## Documentation Links

- [API Reference](./api/README.md)
- [Database Schema](./db/schema.sql)
- [Architecture](./ops/architecture.md)
- [SRE Handbook](./ops/sre-handbook.md)
- [Runbooks](./ops/runbooks/)
- [Developer Guide](./dev/ONBOARDING.md)
- [Production Checklist](./dev/PRODUCTION_CHECKLIST.md)

## Support

For issues or questions:

1. Check relevant runbook in `ops/runbooks/`
2. Review SRE handbook: `ops/sre-handbook.md`
3. Check dashboards and alerts
4. Escalate to on-call SRE
