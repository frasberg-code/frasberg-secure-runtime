# Frasberg Autonomous Cloud V1 — Telemetry Schemas Specification

## 1. Purpose

Define the standardized telemetry data structures for observability, monitoring, and audit compliance. All telemetry adheres to these schemas to ensure consistency, auditability, and compliance.

## 2. Core Telemetry Dimensions

### Health Metrics

**Scope:** Per-region, per-corridor, per-tenant, per-service

```typescript
interface HealthMetrics {
  timestamp: ISO8601;
  source: string; // region ID or service name
  score: number; // 0-100
  uptime: number; // % in last hour
  slaHealth: number; // % compliance with SLA
  errorRate: number; // errors per second
  latencyP50: number; // ms
  latencyP95: number; // ms
  latencyP99: number; // ms
  throughput: number; // requests per second
  cpuUsage: number; // % utilization
  memoryUsage: number; // % utilization
  diskUsage: number; // % utilization
}
```

**Recording Interval:** 1 minute aggregated, 10-second resolution in real-time.

### Corridor Metrics

**Scope:** Per inter-region corridor

```typescript
interface CorridorMetrics {
  timestamp: ISO8601;
  corridorId: string; // "eu-central-1::us-west-2"
  state: "green" | "amber" | "red" | "blocked";
  healthScore: number; // 0-100
  uptime: number; // % SLA attainment
  latencyP95: number; // ms
  costScore: number; // 0-100 (lower = cheaper)
  throughput: number; // requests/sec
  activeConnections: number;
  errorCount: number;
  timeoutCount: number;
  residencyViolationAttempts: number;
  lastChange: ISO8601; // when state changed
}
```

**Recording Interval:** 5 minutes.

### Routing Decisions

**Scope:** Every routing decision

```typescript
interface RoutingDecision {
  timestamp: ISO8601;
  requestId: string; // unique ID for this routing
  tenantId: string;
  workloadId: string;
  sourceRegion: string;
  targetRegion: string;
  residencyConstraints: string[]; // sovereign zones required
  selectedCorridor: string;
  alternativeCorridor?: string;
  costEstimate: number;
  latencyEstimate: number;
  reason: string; // why this corridor chosen
  filters: {
    residencyFilter: boolean; // passed?
    healthFilter: boolean;
    latencyFilter: boolean;
  };
}
```

**Recording:** Every routing decision (sampled at 1% for high-volume periods).

### Compliance Events

**Scope:** Policy violations, breaches, approvals

```typescript
interface ComplianceEvent {
  timestamp: ISO8601;
  eventId: string;
  type: "policy_violation" | "residency_breach" | "sla_violation" | "compliance_check_passed";
  severity: "critical" | "high" | "medium" | "low" | "info";
  resource: string; // affected resource (corridor, tenant, workload)
  details: {
    rule: string; // which rule violated
    expected: any;
    actual: any;
    remediation?: string;
  };
  affectedTenants: number;
  reportedTo: string[]; // councils notified
  resolvedAt?: ISO8601;
}
```

### Governance Decisions

**Scope:** Approval, rejection, mode changes

```typescript
interface GovernanceDecision {
  timestamp: ISO8601;
  decisionId: string;
  type: "approval" | "rejection" | "mode_change" | "escalation";
  proposalId?: string;
  council?: string;
  actor: string; // human or system:auto
  action: string; // what was approved/rejected
  rationale: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  affectedWorkloads: number;
  impactAssessment?: {
    costDelta: number; // $ change
    latencyDelta: number; // ms change
    slaRisk: number; // 0-100 risk score
  };
}
```

### Evolution Lifecycle

**Scope:** Proposal → execution → outcome

```typescript
interface EvolutionEvent {
  timestamp: ISO8601;
  evolutionId: string;
  type: "proposed" | "simulated" | "canary_started" | "approved" | "executed" | "rolled_back";
  proposal?: {
    title: string;
    description: string;
    category: "routing" | "scaling" | "upgrade" | "compliance";
  };
  simulationResults?: {
    confidenceScore: number; // 0-100
    slaBreach: boolean;
    estimatedCostDelta: number;
    estimatedLatencyDelta: number;
  };
  executionResult?: {
    status: "success" | "partial" | "failed";
    actualCostDelta: number;
    actualLatencyDelta: number;
    metricsComparison: {
      simulated: any;
      actual: any;
      variance: number; // %
    };
  };
  rollbackReason?: string;
}
```

### Audit Logs

**Scope:** All system actions for compliance

```typescript
interface AuditLog {
  timestamp: ISO8601;
  logId: string;
  actor: string; // user, service account, or "system:auto"
  action: string; // detailed action name
  resource: string; // what was affected
  resourceType: string; // "corridor", "tenant", "policy", etc.
  changes?: {
    before: any;
    after: any;
  };
  reason?: string; // why was this done
  result: "success" | "failure";
  errorMessage?: string;
  impactScope: {
    affectedTenants: number;
    affectedRegions: string[];
    affectedServices: string[];
  };
  approvalRequired: boolean;
  approvalId?: string;
}
```

**Retention:** 7 years (compliance requirement).

## 3. Telemetry Aggregations

### Real-Time Dashboard Aggregates

```typescript
interface DashboardSnapshot {
  timestamp: ISO8601;
  global: {
    totalTenants: number;
    totalWorkloads: number;
    avgHealthScore: number;
    avgLatencyP95: number;
    slaCompliance: number; // %
    activeCorridors: number;
    costPerHour: number;
  };
  byRegion: Record<string, {
    healthScore: number;
    uptime: number;
    activeTenants: number;
    costPerHour: number;
  }>;
  alerts: ComplianceEvent[];
}
```

Updated every 1 minute.

### Epoch Reports

```typescript
interface EpochReport {
  epochId: string; // "2025-07-17"
  period: {
    start: ISO8601;
    end: ISO8601;
  };
  metrics: {
    totalRequests: number;
    totalErrors: number;
    avgLatencyP50: number;
    avgLatencyP95: number;
    avgLatencyP99: number;
    peakThroughput: number;
    slaCompliance: number; // %
    costTotal: number;
    costPerRequest: number;
  };
  optimizations: {
    costSavings: number;
    latencyImprovements: number;
    failoverEventsHandled: number;
  };
  incidents: {
    count: number;
    critical: number;
    highSeverity: number;
    mtbf: number; // hours
  };
  governance: {
    evolutionProposals: number;
    evolutionApproved: number;
    governanceDecisions: number;
  };
  compliance: {
    violationsDetected: number;
    violationsResolved: number;
    violationsMttr: number; // hours
  };
}
```

Generated daily at 00:00 UTC.

### Compliance Reports

```typescript
interface ComplianceReport {
  reportId: string;
  period: {
    start: ISO8601;
    end: ISO8601;
  };
  bundles: Record<string, {
    name: string; // "GDPR", "HIPAA", etc.
    status: "compliant" | "non_compliant" | "partial";
    violations: ComplianceEvent[];
    evidence: Array<{
      rule: string;
      checked: ISO8601;
      result: "pass" | "fail";
      details: any;
    }>;
  }>;
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    complianceScore: number; // %
  };
  auditTrail: AuditLog[];
}
```

Generated monthly or on-demand.

## 4. Telemetry Export & Retention

### Backends

Data flows to:
- **Real-time**: in-memory cache (1 hour retention)
- **Operational**: PostgreSQL (7 days full resolution, 1 year aggregated)
- **Archive**: S3 (7 years for compliance)
- **Analytics**: Elasticsearch (30 days)
- **Compliance**: immutable ledger (7 years, append-only)

### Export Formats

```bash
# JSON
GET /api/v1/telemetry/export?format=json&start=2025-07-01&end=2025-07-31

# Parquet (for data analysis)
GET /api/v1/telemetry/export?format=parquet

# CSV (for spreadsheets)
GET /api/v1/telemetry/export?format=csv

# Streaming (real-time)
GET /api/v1/telemetry/stream?filters=corridors,compliance_events
```

### Compliance Export

```bash
# Signed, immutable compliance export
GET /api/v1/compliance/audit-export \
  --period 2025-Q1 \
  --bundles gdpr,hipaa \
  --format signed-json

# Response includes cryptographic proof of integrity
```

## 5. Alerting on Telemetry

### Alert Rules

```typescript
interface AlertRule {
  ruleId: string;
  name: string;
  condition: "metric > threshold" | "metric < threshold" | "event triggered";
  metric: string; // "health_score", "latency_p95", etc.
  threshold: number;
  window: string; // "5m", "1h", etc.
  severity: "critical" | "high" | "medium" | "low";
  actions: Array<{
    type: "notify" | "escalate" | "auto_remediate";
    target: string; // slack channel, email, etc.
  }>;
}
```

### Built-In Alert Rules

- `sla_breach_imminent` — SLA compliance < 99% threshold
- `safety_envelope_amber` — any dimension approaches red
- `residency_violation_attempt` — attempt to route workload outside zone
- `compliance_violation` — rule breach detected
- `corridor_health_red` — corridor drops to red state
- `high_latency_spike` — p95 latency > 2× baseline
- `cost_spike` — hourly cost > 10% above forecast
- `governance_escalation_timeout` — approval pending > 1 hour

All alerts logged to `alerts` channel and trigger incident response workflows.

## 6. Privacy & Data Minimization

### Sensitive Data

Telemetry explicitly excludes:
- Customer workload content
- Customer data payloads
- User credentials
- API keys / secrets
- Personal identifying information (PII)

### Anonymization

Tenant IDs are anonymized in analytics queries unless explicitly requested by authorized actors.

### Data Access

- ACO: full access to all telemetry
- Compliance teams: compliance-specific data only
- Technical teams: operational metrics only
- Auditors: audit logs and compliance reports only

Access logged for all telemetry queries.
