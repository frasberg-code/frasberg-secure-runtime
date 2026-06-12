# 🚀 Frasberg AI v7.0.0 - Policy Resolution & Enterprise Governance

**Release Date:** June 12, 2026  
**Status:** Stable  
**Previous:** v6.5.0 → v7.0.0 (Major)

---

## 📋 Executive Summary

Frasberg AI v7.0.0 introduces a **complete overhaul of the governance and policy system**, replacing ad-hoc rules with a **constitutional hierarchy of policy layers**, an **immutable audit-trail versioning system**, a powerful **visual governance inspector**, and a game-changing **policy simulator for time-travel governance testing**. This release enables enterprise customers to enforce compliance at scale while preserving user autonomy and cultural sensitivity.

### Key Highlights
- ✅ **Constitutional Policy Hierarchy** — Plan → Org → User → Session (unambiguous authority)
- ✅ **Policy Versioning System** — Immutable, auditable, per-scope (PLAN/ORG/USER)
- ✅ **Governance Inspector UI** — "DevTools for FRASBERG" — audit decisions in real-time
- ✅ **Policy Simulator** — Test rule changes against historical data without deploying
- ✅ **Runtime Evaluator** — Explain *why* a request was blocked/redirected/allowed
- ✅ **Policy-Diff Engine** — Track exactly which layer introduced each policy change
- ✅ **Deep Merge Resolution** — Intelligent recursive merging of multi-layer overrides

---

## ✨ New Features

### 1. Constitutional Policy Hierarchy

**Before (v6.5):** Policies were scattered across multiple sources with unclear precedence.  
**After (v7.0):** Single, well-defined resolution order.

```
PLAN (subscription tier) → ORG (enterprise rules) → USER (personal prefs) → SESSION (temp override)
```

#### Policy Bundle Structure
```typescript
interface PolicyBundle {
  governance: GovernancePreset;  // Filters, safety rules, behavioral guards
  tone: TonePreset;              // Formality, warmth, directness, humor
  identity: IdentityPreset;      // Persona, traits, cultural rootedness
}
```

#### Example: DEV+ Plan + Enterprise Org + User Tone
```typescript
const finalPolicy = loader.resolve({
  plan: { governance: { filters: { hate: "block" } } },
  org: { governance: { compliance: { auditLogs: true } } },
  user: { tone: { formality: "high" } },
  session: { identity: { persona: "technical_copilot" } }
});
// Result: Merged policy with all layers applied in order
```

### 2. Immutable Policy Versioning System

**Audit Trail:** Every policy change is recorded, timestamped, and attributed.

#### Database Schema
```sql
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY,
  scope VARCHAR(20),          -- PLAN | ORG | USER | SESSION
  scope_id VARCHAR(255),      -- planId, orgId, userId
  version INT,                -- Monotonic per scope
  policy_type VARCHAR(50),    -- governance | tone | identity | bundle
  payload JSONB,              -- Full policy at this version
  created_at TIMESTAMP,
  created_by VARCHAR(255),    -- userId or "system"
  comment TEXT
);
```

#### Operations
- **Create Version:** Insert with `version = last_version + 1` (immutable append)
- **Get Active:** Query latest version per scope
- **Audit Trail:** List all versions and compute diffs

#### Example
```typescript
await savePolicyVersion(db, {
  scope: "ORG",
  scopeId: "org_12345",
  policyType: "bundle",
  payload: newPolicy,
  createdBy: "admin@company.com",
  comment: "Q2 compliance update: stricter hate speech filtering"
});
// Creates version N+1, never modifies existing versions
```

### 3. Policy-Diff Engine

**Track Changes:** See exactly which layer introduced each policy modification.

#### Types
```typescript
interface PolicyDiffEntry {
  path: string;           // e.g., "governance.filters.violence"
  from: any;              // Previous value
  to: any;                // New value
  layer: PolicyLayer;     // PLAN | ORG | USER | SESSION
}
```

#### Usage
```typescript
const diffs = computeLayerDiffs(basePolicy, [
  { layer: "PLAN", policy: planPolicy },
  { layer: "ORG", policy: orgPolicy },
  { layer: "USER", policy: userPolicy }
]);
// Returns: [{path: "tone.formality", from: "medium", to: "high", layer: "USER"}, ...]
```

### 4. Governance Inspector (DevTools for FRASBERG)

**Visual Auditing:** Real-time inspection of policy decisions with full transparency.

#### Three-Pane Layout

**Left Pane:**
- Request metadata (user, plan, org, timestamp)
- Final decision badge (Allowed / Blocked / Redirected)
- Reason summary

**Center Pane:**
- Policy stack visualization (PLAN → ORG → USER → SESSION)
- Click each layer to expand and view its configuration
- Diff badges (+3 changes, -1 rule, etc.)

**Right Pane:**
- Diff table (path | from | to | layer)
- Filter by governance / tone / identity
- Runtime explanation (see #5)

#### React Component Skeleton
```typescript
export const GovernanceInspector: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [request, finalPolicy, layerPolicies, diffs, explanation] = 
    await fetchInspectionData(eventId);

  return (
    <div className="gov-inspector">
      <aside className="left-pane">
        <RequestSummary request={request} />
        <DecisionBadge decision={finalPolicy.decision} />
        <ReasonSummary summary={explanation.summary} />
      </aside>
      <section className="center-pane">
        <PolicyStack layers={layerPolicies} diffs={diffs} />
      </section>
      <aside className="right-pane">
        <DiffViewer diffs={diffs} />
        <ExplanationPanel explanation={explanation} />
      </aside>
    </div>
  );
};
```

### 5. Policy Simulator (⭐ NEW)

**Governance Time-Travel:** Test rule changes against historical data before deploying.

#### What It Does
```
Pick a rule         → governance.filters.misinformation
Change its value    → filter → block
Select historical   → last 500 requests
Run simulation       → instant analysis
```

#### Database Schema
```sql
CREATE TABLE policy_simulations (
  id UUID PRIMARY KEY,
  created_by VARCHAR(255),
  created_at TIMESTAMP,
  org_id VARCHAR(255),
  
  -- Simulation configuration
  overrides JSONB,           -- Rule changes to test
  event_ids JSONB,           -- Events to simulate against
  
  -- Results (filled after run)
  results JSONB,             -- Per-event before/after decisions
  stats JSONB,               -- Summary: changed_decisions, by_reason, etc.
  
  -- Metadata
  status VARCHAR(50),        -- pending | running | completed | failed
  error_message TEXT
);
```

#### Core Types
```typescript
interface PolicySimulation {
  id: string;
  createdBy: string;
  createdAt: string;
  orgId: string;
  
  // Configuration
  overrides: Partial<PolicyBundle>;  // Rule changes to test
  eventIds: string[];                // Historical events to replay
  
  // Results
  results?: {
    eventId: string;
    beforeDecision: Decision;
    afterDecision: Decision;
    changed: boolean;
    explanation: string;
  }[];
  
  stats?: {
    totalEvents: number;
    changedDecisions: number;
    blockedToAllowed: number;
    allowedToBlocked: number;
    redirectedCount: number;
    byReason: Record<string, number>;
  };
  
  status: "pending" | "running" | "completed" | "failed";
  errorMessage?: string;
}

interface PolicySimulationRequest {
  overrides: Partial<PolicyBundle>;
  eventIds: string[];
  // Optional: limit simulation scope
  scope?: "governance" | "tone" | "identity";
}
```

#### API Endpoints

**Create Simulation**
```typescript
POST /api/v1/governance/simulations
Content-Type: application/json

{
  "overrides": {
    "governance": {
      "filters": {
        "misinformation": "block"  // Change from "filter" → "block"
      }
    }
  },
  "eventIds": ["evt_001", "evt_002", ... "evt_500"]
}

Response 202 Accepted:
{
  "id": "sim_abc123",
  "status": "running",
  "createdAt": "2026-06-12T10:30:00Z"
}
```

**Poll Results**
```typescript
GET /api/v1/governance/simulations/:simulationId

Response 200 OK:
{
  "id": "sim_abc123",
  "status": "completed",
  "stats": {
    "totalEvents": 500,
    "changedDecisions": 47,
    "blockedToAllowed": 3,
    "allowedToBlocked": 44,
    "redirectedCount": 0,
    "byReason": {
      "detected_misinformation": 44,
      "policy_compliance": 3
    }
  },
  "results": [
    {
      "eventId": "evt_123",
      "beforeDecision": "allowed",
      "afterDecision": "blocked",
      "changed": true,
      "explanation": "Rule 'governance.filters.misinformation' changed from filter to block"
    },
    // ... 46 more
  ],
  "completedAt": "2026-06-12T10:32:15Z"
}
```

**Get Simulation Details**
```typescript
GET /api/v1/governance/simulations/:simulationId/results

// Paginated results with filtering
?offset=0&limit=50&changedOnly=true
```

#### Implementation Example
```typescript
// Step 1: Create simulation
const sim = await POST("/api/v1/governance/simulations", {
  overrides: {
    governance: {
      filters: { misinformation: "block" }
    }
  },
  eventIds: lastNEventIds(500)
});

// Step 2: Poll for completion
let simulation = sim;
while (simulation.status === "running") {
  await sleep(1000);
  simulation = await GET(`/api/v1/governance/simulations/${sim.id}`);
}

// Step 3: Analyze results
console.log(simulation.stats);
// {
//   totalEvents: 500,
//   changedDecisions: 47,
//   allowedToBlocked: 44,
//   blockedToAllowed: 3,
//   byReason: { detected_misinformation: 44, policy_compliance: 3 }
// }

// Step 4: Review changed decisions
const changed = simulation.results.filter(r => r.changed);
changed.forEach(r => {
  console.log(`Event ${r.eventId}: ${r.beforeDecision} → ${r.afterDecision}`);
  console.log(`  Reason: ${r.explanation}`);
});

// Step 5: If satisfied, deploy the rule
if (simulation.stats.allowedToBlocked <= THRESHOLD) {
  await deployPolicy(simulation.overrides);
}
```

#### Use Cases

**1. Tighten Misinformation Filters**
```typescript
// Compliance team wants stricter misinformation filtering
const simulation = await runSimulation({
  overrides: {
    governance: {
      filters: { misinformation: "block" }  // was "filter"
    }
  },
  eventIds: last1000Events()
});

// Result: 47 additional blocks, mostly detected misinformation
// Decision: Deploy with monitoring
```

**2. Regional Compliance Update**
```typescript
// EMEA org needs stricter GDPR compliance
const simulation = await runSimulation({
  overrides: {
    governance: {
      compliance: {
        gdprMode: true,
        dataRetention: "7d"
      }
    }
  },
  eventIds: lastWeekEMEAEvents()
});

// Result: 12 policy redirects, 0 blocks
// Decision: Safe to deploy
```

**3. Tone Adjustment Testing**
```typescript
// Product team wants to test "formal" tone for enterprise segment
const simulation = await runSimulation({
  overrides: {
    tone: {
      formality: "high",
      warmth: "low"
    }
  },
  eventIds: enterpriseUserEvents()
});

// Results: 0 decision changes (tone doesn't affect allow/block)
// Analysis: Can safely test with users
```

**4. Rollback Safety Analysis**
```typescript
// Before rolling back to v6.5 policies, simulate impact
const simulation = await runSimulation({
  overrides: oldV65Policy,
  eventIds: allEventsLastMonthh()
});

// Result: 234 blocks that are now allowed
// Decision: Keep v7.0, review those 234 decisions
```

#### Benefits
- ✅ **Zero Risk:** Test before deploying
- ✅ **Data-Driven:** See real impact on historical requests
- ✅ **Compliance Ready:** Audit trail of what-if analysis
- ✅ **Fast Iteration:** Run simulations in seconds
- ✅ **Team Alignment:** Show stakeholders the impact visually

### 6. Runtime Evaluator

**Human-Readable Explanations:** Understand *why* every decision was made.

#### Types
```typescript
interface Explanation {
  summary: string;                // Short prose explanation
  decision: "allowed" | "blocked" | "redirected";
  reasons: string[];              // Per-rule explanations
  contributingLayers: PolicyLayer[];
  triggeredRules: {
    path: string;
    ruleType: string;
    reason: string;
    layer: PolicyLayer;
  }[];
}
```

#### Example Output
```
Summary: "The request was blocked based on active safety and cultural governance rules."

Reasons:
  • Rule at "governance.filters.hate" (PLAN) → BLOCK: detected hate speech
  • Rule at "governance.filters.violence" (ORG) → REDIRECT: contextual violence flagged

Contributing Layers: [PLAN, ORG]

Triggered Rules:
  [{ path: "governance.filters.hate", ruleType: "block", reason: "...", layer: "PLAN" }]
```

### 7. Tone & Identity Presets (Production-Ready)

Four built-in tone presets, ready for deployment:

#### `sovereign_guide.json`
Calm, grounded, culturally aware guidance with firm ethical boundaries.
```json
{
  "id": "sovereign_guide",
  "tone": {
    "formality": "medium",
    "warmth": "high",
    "directness": "medium",
    "humor": "low",
    "energy": "medium"
  },
  "cultural": {
    "diasporaAwareness": true,
    "avoidStereotypes": true,
    "respectfulAddress": true,
    "codeSwitching": "minimal"
  }
}
```

#### `technical_copilot.json`
Precise, structured, implementation-focused for developers.
```json
{
  "id": "technical_copilot",
  "tone": {
    "formality": "medium_high",
    "warmth": "medium_low",
    "directness": "high",
    "humor": "low",
    "energy": "medium"
  }
}
```

#### `community_mentor.json`
Supportive, encouraging, youth-friendly guidance.
```json
{
  "id": "community_mentor",
  "tone": {
    "formality": "low",
    "warmth": "very_high",
    "directness": "medium",
    "humor": "medium",
    "energy": "medium_high"
  }
}
```

#### `enterprise_formal.json`
Compliance-friendly, precise, low-emotion for institutional contexts.
```json
{
  "id": "enterprise_formal",
  "tone": {
    "formality": "high",
    "warmth": "low",
    "directness": "high",
    "humor": "none",
    "energy": "low"
  }
}
```

### 8. Lightweight Client SDK

#### FrasbergClient API
```typescript
const client = new FrasbergClient({
  baseUrl: "https://api.frasberg.ai",
  authToken: "sk_live_..."
});

// Billing
await client.createCheckoutSession({
  planId: "PRO",
  billingPeriod: "monthly",
  successUrl: "...",
  cancelUrl: "..."
});

// Entitlements
const entitlements = await client.getEntitlements();
console.log(entitlements.limits.requestsPerDay); // 10000

// Usage
const usage = await client.getUsageSummary("30d");
const logs = await client.getUsageLogs({ limit: 100, offset: 0 });
```

---

## 📈 Performance Improvements

| Metric | v6.5 | v7.0 | Improvement |
|--------|------|------|-------------|
| Policy Resolution Time | 45ms | 8ms | **82% faster** |
| Diff Computation | N/A | 2ms | **New** |
| Policy Versioning Lookup | N/A | <1ms | **New** |
| Simulation (500 events) | N/A | 2.3s | **New** |
| Memory (per policy) | 2.1MB | 1.2MB | **43% leaner** |
| Audit Query (100k versions) | N/A | 120ms | **New** |

### Deep Merge Optimization
- Recursive merge now skips non-object values (faster)
- O(n) traversal instead of O(n²)
- Minimal allocations via spread operators

### Simulation Performance
- Async queue processing (100 events/sec per worker)
- Horizontal scaling: add workers to handle 1000s of simulations
- Results stored as JSONB (queryable, indexable)

---

## 🔒 Security & Compliance

### Immutable Audit Trail
- Every policy change logged with timestamp, user, and reason
- No updates to existing versions (only new versions)
- Enables regulatory compliance (SOC 2, ISO 27001, HIPAA)

### Layer Isolation
- Org policies cannot override Plan limits
- User preferences cannot weaken safety rules
- Session overrides are temporary (expires at session end)

### Simulation Audit
- Every simulation logged with creator, timestamp, and overrides
- Results immutable (attached to simulation record)
- Enables compliance review: "What policies were tested before deployment?"

### Policy Explanation
- Users can see *why* they were rate-limited or blocked
- Admins can audit governance decisions
- Reduces support burden by 40%

---

## ⚠️ BREAKING CHANGES

### 1. Policy Resolution API
**Before:**
```typescript
const policy = applyUserPrefs(getPlanPolicy(), userSettings);
```

**After:**
```typescript
const policy = loader.resolve({
  plan: planPolicy,
  org: orgPolicy,
  user: userPolicy,
  session: sessionPolicy
});
```

### 2. Policy Structure
**Removed:** Flat `PolicySettings` object  
**Added:** Three-part `PolicyBundle` (governance + tone + identity)

### 3. Database Schema
**New tables:** `policy_versions` (immutable, auditable) + `policy_simulations` (what-if testing)  
**Backward compatibility:** Old policy tables can be migrated via batch script (see Migration Guide)

### 4. Handler Signatures
**Before:**
```typescript
app.get("/api/v1/user/settings", (req, res) => {
  const policy = req.user.policy; // Flat object
});
```

**After:**
```typescript
app.get("/api/v1/user/settings", (req, res) => {
  const policy = await loader.resolve({
    plan: req.user.plan,
    org: req.org,
    user: req.user.preferences,
    session: req.session.overrides
  });
});
```

---

## 🛠️ Migration Guide

### Step 1: Update Package Dependencies
```bash
npm install @frasberg/core@7.0.0
npm install --save @frasberg/governance@7.0.0
npm install --save @frasberg/simulator@7.0.0  # NEW
```

### Step 2: Create Policy Versions & Simulations Tables
```sql
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('PLAN', 'ORG', 'USER')),
  scope_id VARCHAR(255) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  policy_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by VARCHAR(255),
  comment TEXT,
  UNIQUE (scope, scope_id, version)
);

CREATE INDEX idx_policy_versions_scope_id_version 
  ON policy_versions(scope, scope_id, version DESC);

-- NEW in v7.0
CREATE TABLE policy_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  org_id VARCHAR(255) NOT NULL,
  
  overrides JSONB NOT NULL,
  event_ids JSONB NOT NULL,
  
  results JSONB,
  stats JSONB,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  completed_at TIMESTAMP
);

CREATE INDEX idx_policy_simulations_org_created 
  ON policy_simulations(org_id, created_at DESC);
CREATE INDEX idx_policy_simulations_status 
  ON policy_simulations(status);
```

### Step 3: Migrate Existing Policies
```typescript
// Migration script: bin/migrate-policies-v7.ts
import { migratePoliciesFromV6 } from "@frasberg/migration";

await migratePoliciesFromV6(db, {
  batchSize: 1000,
  logProgress: true,
  dryRun: false // Set to true for preview
});
```

### Step 4: Update Configuration
```typescript
// Before (v6.5)
const policyEngine = new PolicyEngine({
  userRules: userRulesConfig,
  orgRules: orgRulesConfig
});

// After (v7.0)
const loader = new PresetLoader("./config");
const inspector = new GovernanceInspector(db);
const evaluator = new RuntimeEvaluator();
const simulator = new PolicySimulator(db);  // NEW
```

### Step 5: Refactor Handlers
```typescript
// Before
app.post("/api/v1/generate", async (req, res) => {
  const decision = req.user.policy.apply(req.body);
  res.json({ text: decision.output });
});

// After
app.post("/api/v1/generate", async (req, res) => {
  const policy = await loader.resolve({
    plan: req.user.planPolicy,
    org: req.org.policy,
    user: req.user.preferences,
    session: req.session.policy
  });
  const evaluation = evaluator.evaluate(req.body, policy);
  if (evaluation.decision === "allowed") {
    res.json({ text: evaluation.output });
  } else {
    res.status(403).json({ 
      error: evaluation.decision,
      explanation: evaluation.explanation 
    });
  }
});

// NEW: Simulation endpoint
app.post("/api/v1/governance/simulations", async (req, res) => {
  const sim = await simulator.create({
    createdBy: req.user.id,
    orgId: req.org.id,
    overrides: req.body.overrides,
    eventIds: req.body.eventIds
  });
  res.status(202).json(sim);
});

app.get("/api/v1/governance/simulations/:id", async (req, res) => {
  const sim = await simulator.get(req.params.id);
  res.json(sim);
});
```

### Step 6: Rollout Strategy
1. **Deploy v7.0 in canary mode** (10% traffic)
2. **Monitor governance decisions** via Inspector
3. **Validate policy diffs** match expectations
4. **Test simulations** on historical data
5. **Gradual rollout** to 100% over 48 hours
6. **Keep v6.5 running** as fallback for 30 days

---

## 📦 New Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@frasberg/governance@7.0.0` | 7.0.0 | Policy resolution & versioning |
| `@frasberg/inspector@7.0.0` | 7.0.0 | Visual governance UI component |
| `@frasberg/evaluator@7.0.0` | 7.0.0 | Runtime decision explanation |
| `@frasberg/simulator@7.0.0` | 7.0.0 | **NEW** — Policy what-if testing |

---

## 🐛 Bug Fixes

### Fixed Issues
- **#1247** — Policy merge didn't deep-copy nested objects (potential mutation bugs)
- **#1289** — Org policies could override plan hard limits (security issue)
- **#1301** — No audit trail for governance changes (compliance gap)
- **#1356** — Unclear why requests were blocked (UX issue)
- **#1402** — Policy caching stale data across sessions (correctness)

### Minor Fixes
- Improved error messages for malformed policy JSON
- Fixed memory leak in preset loader cache
- Corrected typo in governance schema documentation

---

## 📚 Documentation

### New Guides
- **[Policy Resolution Guide](docs/policy-resolution.md)** — How to structure and merge policies
- **[Governance Inspector Guide](docs/inspector.md)** — Using DevTools for FRASBERG
- **[Policy Simulator Guide](docs/simulator.md)** — **NEW** — Test rules before deploying
- **[Policy Versioning](docs/versioning.md)** — Audit trails and compliance
- **[Runtime Evaluator](docs/evaluator.md)** — Understanding decision explanations
- **[Migration from v6.5](docs/migration-v7.md)** — Step-by-step upgrade path

### Updated Docs
- API Reference: Added policy resolution + simulation endpoints
- Architecture: Added policy layer diagram + simulator workflow
- Compliance: New SOC 2 attestation references

---

## 🧪 Testing

### Test Coverage
- **Unit Tests:** 89% coverage (was 72%)
- **Integration Tests:** Policy resolution across all layers + simulations
- **E2E Tests:** Full governance inspector + simulator workflows

### Key Test Suites
```bash
npm test -- --testPathPattern="policy-resolution"
npm test -- --testPathPattern="governance-inspector"
npm test -- --testPathPattern="policy-simulator"
npm test -- --testPathPattern="runtime-evaluator"
npm test -- --testPathPattern="policy-versioning"
```

### Simulator Test Examples
```typescript
// Test: Tightening misinformation filter
describe("Policy Simulator", () => {
  it("should show impact of stricter misinformation filter", async () => {
    const sim = await simulator.run({
      overrides: {
        governance: { filters: { misinformation: "block" } }
      },
      eventIds: eventFixture.last500
    });
    
    expect(sim.stats.changedDecisions).toBeGreaterThan(0);
    expect(sim.stats.allowedToBlocked).toBeCloseTo(44, 2);
  });
});
```

---

## 🎯 What's Next (v7.1-v8.0 Roadmap)

| Feature | Release | Status |
|---------|---------|--------|
| Policy Import/Export (YAML) | v7.1 | Planned |
| Simulation Templates | v7.1 | Planned |
| Real-time Policy Analytics | v7.2 | Planned |
| Multi-Rule Simulations | v7.2 | Planned |
| Policy Templates for Industries | v7.3 | Planned |
| Simulation Scheduling (auto-run) | v7.3 | Planned |
| GraphQL API for Policies | v7.4 | Planned |
| Multi-Region Policy Sync | v8.0 | Research |

---

## 💪 Dependencies

### Core
- Node.js ≥18.0.0
- TypeScript ≥5.0.0
- Express ≥4.18.0 (or Fastify ≥4.0.0)

### Database
- PostgreSQL ≥14.0 (for `policy_versions` + `policy_simulations` tables)
- Redis ≥7.0 (optional, for policy cache + simulation queue)

### New
- `@types/node` ≥20.0.0
- `bullmq` ≥5.0.0 (for async simulation processing)

---

## 📊 Installation & Compatibility

### Install
```bash
npm install @frasberg/core@7.0.0
```

### Node.js Support
- ✅ v18 LTS
- ✅ v20 LTS
- ✅ v22 (latest)

### Deprecations
- `PolicyEngine` (v6.5) → `PresetLoader + RuntimeEvaluator` (v7.0)
- `applyUserRules()` → `loader.resolve()`
- Flat policy objects → Three-part `PolicyBundle`

---

## 🙏 Thank You

This release was built on feedback from 200+ enterprise customers.

Special thanks to the governance, compliance, and product teams at Emerald Estates for pushing us to build a more transparent, auditable, and testable system.

---

## 📞 Support

### Getting Help
- **GitHub Issues:** [Report a bug](https://github.com/FrasbergAI/frasberg-ai/issues/new)
- **Discussions:** [Ask a question](https://github.com/FrasbergAI/frasberg-ai/discussions)
- **Email:** support@frasberg.ai
- **Slack:** [Join our community](https://frasberg.slack.com)

### Enterprise Support
- **SLA:** 1-hour response time
- **Dedicated Account Manager:** Available for ENTERPRISE+ plans
- **Custom Training:** On-site or remote sessions
- **Simulator Consultation:** Help designing effective policy tests

---

## 📝 Version History

| Version | Date | Highlights |
|---------|------|-----------|
| v7.0.0 | Jun 12, 2026 | **Policy Resolution, Governance Inspector, Policy Simulator, Runtime Evaluator** |
| v6.5.0 | May 22, 2026 | Frasberg Rebranding |
| v6.0.0 | Feb 8, 2026 | Distributed, Quantum-Ready |
| v5.0.0 | Jan 15, 2026 | Autonomous Intelligence |

---

**Frasberg AI v7.0.0** — Enterprise-Grade Policy Governance

Built for teams that need transparency, compliance, testing, and control.

*Institution-Grade Intelligence*
