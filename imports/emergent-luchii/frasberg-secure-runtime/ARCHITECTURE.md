# Frasberg Platform Architecture - Complete System Integration

## System Overview

```
Studio (React)
    ↓
TypeScript/Python SDK
    ↓
Public API (v1/*)
    ↓
Gateway (unified middleware)
    ↓
Runtime Router (propagation)
    ↓
Engine (execution + unified enforce)
    ↓
WorldGraph (state + identity graph)
    ↓
Supabase (PostgreSQL + RPC)
```

## Layer Architecture

### 1. Studio Layer (UI)
- React components with Frasberg hooks
- useFrasbergClient: Multi-region failover client
- useIdentity: Owner-scoped operations
- useJob: Async job orchestration
- Components: WorldGraph, Diagnostics, Continuity, Policy, Governance

### 2. SDK Layer (Client)
- **TypeScript SDK**: Native HTTP client with HMAC signing
- **Python SDK**: Compatible client for server-side integrations
- Automatic multi-region failover
- Request signing (HMAC-SHA256)
- Envelope parsing (owner, continuity, diagnostics, policy)

### 3. Public API Layer (v1/*)
- Envelope-based response format
- HMAC signature verification
- Owner-scoped request routing
- Endpoints:
  - POST /v1/worldgraph
  - POST /v1/music, /v1/video, /v1/image
  - POST /v1/audio, /v1/voice
  - POST /v1/stt, /v1/tts
  - GET /v1/health

### 4. Gateway Layer (Entry)
- Unified middleware stack:
  1. injectIdentity: Extract & validate owner
  2. injectContinuity: Load owner continuity state
  3. injectDiagnostics: Track request metadata
  4. injectPolicy: Load owner policy rules
  5. governanceGuard: Validate governance admin key
- Routes:
  - /governance/diagnostics
  - /governance/continuity
  - /governance/policy/enforce

### 5. Router Layer (Propagation)
- Unified propagation middleware:
  1. propagateIdentity: Header propagation
  2. propagateContinuity: State propagation
  3. propagateDiagnostics: Event propagation
  4. propagatePolicy: Rule propagation
- Regional routing
- Health-aware failover

### 6. Engine Layer (Execution)
- Unified enforcement:
  1. enforceIdentity: Identity preservation
  2. enforceContinuity: State enforcement
  3. enforceDiagnostics: Event logging
  4. enforcePolicy: Rule validation
  5. enforceGovernance: Governance checks
- Job execution pipeline
- Asset binding (R2 upload)
- Result finalization

### 7. WorldGraph Layer (State)
- Identity graph: nodes + edges per owner
- Continuity timeline: events per owner
- Policy rules: enforcement rules per owner
- Governance rules: governance rules per owner
- Diagnostics: component traces per owner

### 8. Supabase Layer (Persistence)
- Tables:
  - identity_graph (nodes, edges, owner_id)
  - continuity_state (state, owner_id)
  - diagnostics (component, payload, owner_id)
  - policy_rules (rule, owner_id)
  - governance_rules (rule, owner_id)
- RPC functions:
  - identity_graph_get(owner)
  - continuity_get(owner), continuity_update(owner, state)
  - diagnostics_log(owner, component, payload)
  - policy_get(owner)
  - governance_get(owner)

## Data Flow Example

### Music Generation Flow

1. **Studio**: User clicks "Generate Music"
   - Client: useFrasbergClient()
   - Action: generateMusic("lofi beat")

2. **SDK**: TypeScript client
   - Sign request: HMAC-SHA256
   - Failover: Try us-west-2 → us-east-1 → eu-central-1
   - Headers: x-api-key, x-api-signature, x-owner-id

3. **Public API**: v1/music endpoint
   - Verify HMAC signature
   - Parse envelope
   - Extract owner from header

4. **Gateway**: Unified middleware
   - injectIdentity: req.owner = "owner_123"
   - injectContinuity: req.continuity = await loadContinuity(owner)
   - injectDiagnostics: req.diagnostics = { gatewayReceivedAt, ip }
   - injectPolicy: req.policy = await loadPolicy(owner)
   - governanceGuard: (bypassed for v1/* endpoints)

5. **Router**: Propagation
   - propagateIdentity: header["x-owner-id"] = owner
   - propagateContinuity: header["x-continuity-state"] = JSON.stringify(state)
   - propagateDiagnostics: header["x-diagnostics"] = JSON.stringify(diags)
   - propagatePolicy: header["x-policy"] = JSON.stringify(policy)

6. **Engine**: Execution
   - enforcePolicy: Check if music generation is blocked
   - executeJob: Run music generation model
   - writeDiagnostics: Log execution latency & region
   - bindAsset: Upload result to R2
   - writeContinuity: Record event in timeline

7. **WorldGraph/Supabase**: Persistence
   - continuity_update: Add event to timeline
   - diagnostics_log: Record execution trace
   - Supabase RPC returns data

8. **Response**: Envelope format
   ```json
   {
     "version": "v1",
     "owner": "owner_123",
     "continuity": { ... },
     "diagnostics": { ... },
     "policy": { ... },
     "payload": {
       "jobId": "job_123",
       "status": "completed",
       "asset": "https://assets.frasberg.com/jobs/job_123/music.mp3"
     },
     "timestamp": 1696423200000
   }
   ```

## Multi-Region Architecture

### Regions
- Primary: us-west-2
- Secondary: us-east-1
- Tertiary: eu-central-1

### Failover Strategy
1. Route53 health-weighted routing (60% west, 30% east, 10% eu)
2. SDK client-side failover
3. ECS auto-scaling per region
4. Cross-region replication (R2, Supabase)

### Health Checks
- Endpoint: GET /health
- Regions: Check all 3 in parallel
- Frequency: Every 30 seconds
- Failover: Automatic if primary down

## Governance Stack

### Admin Keys
- GOVERNANCE_ADMIN_KEY: Unlocks /governance/* endpoints
- Verified in governanceGuard middleware
- Stored in AWS Secrets Manager

### Governance Check
1. User action (e.g., music generation)
2. Engine: checkGovernance(governance, "music")
3. Policy check: enforceGovernance(governance, action)
4. Global block vs owner-level block
5. Allow/deny response

## Identity Graph Flow

1. Studio requests: /v1/worldgraph?identity=true
2. SDK adds header: x-owner-id=owner_123
3. Gateway injects identity
4. Engine loads: loadIdentity(owner_123)
5. Supabase RPC: identity_graph_get("owner_123")
6. Response: { nodes: [...], edges: [...] }

## Continuity Timeline

1. Job starts: startJob(type, payload)
2. Job runs: executeJob(...)
3. Job completes: writeContinuity(owner, event)
4. Supabase: INSERT into continuity_state
5. Studio displays: ContinuityTimeline component

## Policy Enforcement

1. Load policy: loadPolicy(owner_123)
2. Supabase RPC: policy_get("owner_123")
3. Engine checks: enforcePolicy(policy, "music")
4. Blocked actions rejected with reason
5. Audit logged in diagnostics

## Diagnostics Aggregation

1. Gateway: writeDiagnostics(owner, "gateway", {...})
2. Router: writeDiagnostics(owner, "router", {...})
3. Engine: writeDiagnostics(owner, "engine", {...})
4. Supabase: aggregateDiagnostics(owner)
5. Studio displays per-component timeline

## Integration Checklist

- [x] Gateway app.ts with unified middleware
- [x] Router app.ts with unified middleware
- [x] Engine app.ts with unified enforcement
- [x] Main platform app.ts with orchestrator
- [x] Server entry point (server.ts)
- [x] Supabase client
- [x] Policy & Governance migrations
- [x] Shared governance module exports
- [x] Environment template
- [x] Docker configuration
- [x] Integration test suite
- [x] Architecture documentation

## Deployment

### Local Development
```bash
docker-compose -f docker-compose.platform.yml up
npm run dev
```

### AWS ECS
1. Build Docker image: frasberg-secure-runtime:latest
2. Push to ECR: <ACCOUNT>.dkr.ecr.us-west-2.amazonaws.com/frasberg
3. Deploy ECS task definition
4. Update service: force-new-deployment
5. Verify health checks pass

### Environment Setup
- Copy .env.example → .env.production
- Fill AWS, Supabase, R2 credentials
- Run Supabase migrations
- Generate governance-admin key
- Deploy to ECS

## Verification Commands

```bash
# Health check
curl http://localhost:3000/health

# Governance access (requires key)
curl -H "x-governance-key: $GOVERNANCE_ADMIN_KEY" \
  http://localhost:3000/governance/diagnostics

# Public API test
curl -H "x-api-key: test_key" \
  -H "x-api-signature: test_sig" \
  -H "x-owner-id: owner_123" \
  -H "Content-Type: application/json" \
  -d '{"ping": true}' \
  http://localhost:3000/v1/worldgraph

# Run integration tests
bash tests/integration-test.sh http://localhost:3000
```

## Known Limitations & Future Work

- [ ] Load balancer ALB configuration
- [ ] Route53 active-active setup
- [ ] Continuous replication setup (R2, Supabase)
- [ ] CDN caching headers
- [ ] Rate limiting per owner
- [ ] Analytics dashboard
- [ ] Audit trail export
