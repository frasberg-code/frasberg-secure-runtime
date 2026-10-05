# AI Court — Frasberg Legal Intelligence Assistant (FLIA)

Production-grade judicial decision-support platform powered by Frasberg governance and Luchii AI.

## 📋 Overview

AI Court is a multi-service, multi-region judicial platform built under **Cycle 2** governance with **Frasberg** authority. All systems operate under **Article IV** constraints with advisory-only decision support.

**Authority:** Frasberg  
**Phase:** 17 (Omni-Refinement)  
**Anchor SHA:** `09b70b557e3539fba67249e4951e2373dc33f834`

## 🏗️ Architecture

### Services

- **Case Service** (port 3001) — Case management and timeline
- **Evidence Service** (port 3002) — Evidence storage and chain-of-custody
- **Law Service** (port 3003) — Statute and precedent mapping
- **Integrity Service** (port 3004) — FLIA advisory analysis
- **Audit & Governance Service** (port 3005) — Immutable audit logging
- **User & Role Service** (port 3006) — RBAC and user management
- **Gateway** (port 3000) — API gateway and request routing

### Deployment

- **Multi-region:** US West (primary), US East, EU Central
- **Orchestration:** Kubernetes with Helm
- **IaC:** Terraform
- **CI/CD:** GitHub Actions

## 🚀 Getting Started

### Local Development

```bash
# Start all services in development mode
cd ai-court/services/case-service && npm install && npm run dev
# (Repeat for each service in separate terminals)

# Start gateway
cd ai-court/gateway && npm install && npm run dev
```

### Production Deployment

```bash
# Build and push Docker images
./ai-court/infra/cicd/build_and_push.sh v1.0.0

# Deploy to all regions
./ai-court/infra/cicd/deploy_multi_region.sh v1.0.0
```

## 📡 API Endpoints

```
POST   /api/cases                    — Create case
GET    /api/cases/:id               — Get case details
GET    /api/evidence/case/:caseId   — List evidence
POST   /api/law/map                 — Generate law map
POST   /api/integrity/analyze       — Advisory analysis (FLIA)
GET    /api/audit/logs/:caseId      — Audit trail
```

## 🛡️ Governance

All endpoints are protected by **Cycle 2 governance middleware**:

- ✅ Advisory-only analysis
- ✅ No autonomous adjudication
- ✅ Human-in-the-loop required
- ✅ Full audit continuity
- ✅ Immutable governance chain

### Forbidden Operations

The following endpoints are **strictly forbidden**:

```
/verdicts — No guilt/innocence determination
/sentencing — No sentencing recommendations
/intent — No intent inference
```

Attempting these returns HTTP 403 with governance error.

## 📊 Database Schema

Each service maintains its own Prisma schema:

- **Case DB:** Cases, events, evidence relationships
- **Evidence DB:** Evidence records, chain-of-custody
- **Law DB:** Statutes, precedents
- **Audit DB:** Immutable event log

## 🔐 Security

- Zero Trust architecture
- Role-based access control (RBAC)
- Region/domain isolation
- TLS encryption for all traffic
- Governance validation on every request

## 📈 Monitoring

- Prometheus metrics on all services
- Grafana dashboards per region
- Audit trail in immutable store
- Governance compliance reporting

## 🧪 Testing

```bash
npm test              # Run all tests
npm run build         # Build TypeScript
npm run dev           # Development mode with hot reload
```

## 📖 Documentation

- Architecture: `docs/CYCLE_2_FLIA_ARCHITECTURE.md`
- Ethics Charter: `docs/CYCLE_2_FLIA_ETHICS_CHARTER.md`
- UI/UX: `docs/CYCLE_2_FLIA_JUDGE_DASHBOARD_UX.md`

## 🤝 Contributing

All contributions must:
- Maintain Article IV compliance
- Preserve advisory-only boundaries
- Include comprehensive audit logging
- Pass governance validation

## 📜 License

Proprietary — Frasberg Legal Intelligence
