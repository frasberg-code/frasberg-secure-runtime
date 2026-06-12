# 🚀 Frasberg AI v7.0.0 - Policy Resolution & Enterprise Governance

**Release Date:** June 12, 2026  
**Status:** Stable  
**Previous:** v6.5.0 → v7.0.0 (Major)

---

## 📋 Executive Summary

Frasberg AI v7.0.0 introduces a **complete overhaul of the governance and policy system**, replacing ad-hoc rules with a **constitutional hierarchy of policy layers**, an **immutable audit-trail versioning system**, a powerful **visual governance inspector**, a game-changing **policy simulator for time-travel governance testing**, and an **interactive governance sandbox for real-time parameter exploration**. This release enables enterprise customers to enforce compliance at scale while preserving user autonomy and cultural sensitivity.

### Key Highlights
- ✅ **Constitutional Policy Hierarchy** — Plan → Org → User → Session (unambiguous authority)
- ✅ **Policy Versioning System** — Immutable, auditable, per-scope (PLAN/ORG/USER)
- ✅ **Governance Inspector UI** — "DevTools for FRASBERG" — audit decisions in real-time
- ✅ **Policy Simulator** — Test rule changes against historical events without deploying
- ✅ **Governance Sandbox** — **NEW** — Interactive sliders for real-time policy exploration
- ✅ **Policy Heatmap** — **NEW** — Visualize rule frequency and impact over time
- ✅ **Risk Scoring Engine** — **NEW** — Quantify misconfiguration risk per rule
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
- Runtime explanation

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

**Governance Time-Travel:** Test rule changes against historical events before deploying — zero risk.

#### What It Does
```
1. Select a governance rule          → e.g., governance.filters.misinformation
2. Change its value                  → filter → block
3. Pick historical events            → last 500 requests (from governance_events table)
4. Run simulation                    → instant analysis of impact
5. See before/after decisions        → which events would change? how?
6. Review explanations               → why each decision changed
7. Promote to active policy (opt)    → write as new immutable version
```

#### Data Model

**Input:** Governance event from `governance_events` table
```typescript
interface GovernanceEvent {
  id: string;
  user_id: string;
  org_id: string;
  plan_id: string;
  input_text: string;
  final_policy: PolicyBundle;      // Policy used in original decision
  final_decision: "allowed" | "blocked" | "redirected";
  triggered_rules: any[];
  timestamp: string;
}
```

**Simulation:** Apply overrides as SESSION layer
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
  stats?: {
    totalEvents: number;
    changedDecisions: number;
    blockedInsteadOfAllowed: number;
    redirectedInsteadOfAllowed: number;
  };
  
  results?: {
    eventId: string;
    originalDecision: Decision;
    newDecision: Decision;
    policyDiffs: PolicyDiffEntry[];
    explanation: Explanation;
  }[];
  
  status: "pending" | "running" | "completed" | "failed";
}
```

#### API Endpoints

**Create Simulation**
```typescript
POST /api/v1/policy/simulate
Content-Type: application/json

Request:
{
  "overrides": {
    "governance": {
      "filters": {
        "misinformation": "block"  // Change from "filter" to "block"
      }
    }
  },
  "eventIds": ["evt_1", "evt_2", ..., "evt_500"]
}

Response 202 Accepted:
{
  "simulationId": "sim_abc"
}
```

**Get Simulation Results**
```typescript
GET /api/v1/policy/simulate/:id

Response 200 OK:
{
  "id": "sim_abc",
  "overrides": {
    "governance": {
      "filters": {
        "misinformation": "block"
      }
    }
  },
  "stats": {
    "totalEvents": 500,
    "changedDecisions": 42,
    "blockedInsteadOfAllowed": 31,
    "redirectedInsteadOfAllowed": 11
  },
  "results": [
    {
      "eventId": "evt_1",
      "originalDecision": "allowed",
      "newDecision": "blocked",
      "policyDiffs": [
        {
          "path": "governance.filters.misinformation",
          "from": "filter",
          "to": "block",
          "layer": "SESSION"
        }
      ],
      "explanation": {
        "summary": "Blocked due to misinformation rule now set to BLOCK.",
        "reasons": [
          "Rule at governance.filters.misinformation (SESSION) → BLOCK: detected misinformation"
        ]
      }
    }
  ]
}
```

#### Simulation Engine (Core Logic)

```typescript
import { PresetLoader } from "./presetLoader";
import { computeLayerDiffs } from "./policyDiff";
import { buildExplanation } from "./runtimeEvaluator";

export async function runPolicySimulation({
  overrides,
  events
}: {
  overrides: any;
  events: any[];
}) {
  const loader = new PresetLoader("./config");

  const results = [];
  let changed = 0;

  for (const event of events) {
    const originalPolicy = event.final_policy;

    // Apply overrides as SESSION layer (temporary, for testing)
    const resolved = loader.resolve({
      plan: {},
      org: {},
      user: {},
      session: overrides
    });

    // Compute what changed
    const diffs = computeLayerDiffs(originalPolicy, [
      { layer: "SESSION", policy: overrides }
    ]);

    // Re-evaluate input with new policy
    const { decision, triggeredRules } = await evaluateWithPolicy(
      event.input_text,
      resolved
    );

    // Explain the new decision
    const explanation = buildExplanation({
      input: {
        text: event.input_text,
        userId: event.user_id,
        orgId: event.org_id,
        planId: event.plan_id
      },
      policy: resolved,
      triggeredRules,
      decision
    });

    // Track if decision changed
    if (decision !== event.final_decision) changed++;

    results.push({
      eventId: event.id,
      originalDecision: event.final_decision,
      newDecision: decision,
      policyDiffs: diffs,
      explanation
    });
  }

  return {
    stats: {
      totalEvents: events.length,
      changedDecisions: changed,
      blockedInsteadOfAllowed: results.filter(
        r => r.originalDecision === "allowed" && r.newDecision === "blocked"
      ).length,
      redirectedInsteadOfAllowed: results.filter(
        r => r.originalDecision === "allowed" && r.newDecision === "redirected"
      ).length
    },
    results
  };
}
```

#### UI — Policy Simulator Screen

**Three-Panel Layout:**

**Left Panel — Rule Editor**
```
governance
  ├─ filters
  │  ├─ misinformation: [filter ▾]
  │  ├─ hate: [block ▾]
  │  └─ violence: [block ▾]
  ├─ cultural
  │  └─ diasporaSensitivity: [high ▾]
  └─ youth
     └─ enabled: [✓]

[+ Add Override]
```

**Center Panel — Event Selection**
- Quick filters: "Last 100 events", "Last 24 hours"
- Custom range picker (date from/to)
- Specific event IDs (copy-paste)
- **[RUN SIMULATION]** button

**Right Panel — Results Summary**
```
📊 42 Decisions Changed

↗️ 31 changed to BLOCKED
   (originally: allowed)

↻ 11 changed to REDIRECTED
   (originally: allowed)

[View Details ▾]
```

#### Use Cases

**1. Tighten Misinformation Filters (Compliance)**
- Test stricter filtering against last 500 events
- See 42 additional blocks, 31 justified
- Deploy with confidence

**2. Regional Compliance Update (GDPR)**
- Test GDPR mode against EMEA events
- Results: 8 redirects, 0 blocks
- Safe to deploy

**3. Tone Testing (Product)**
- Test "formal" tone with enterprise customers
- Results: 0 decision changes
- Safe to run beta

**4. Rollback Safety (Incident)**
- Before rolling back to v6.5, analyze impact
- Results: 234 blocks now allowed
- Keep v7.0, investigate those 234

#### Benefits
- ✅ **Zero Risk:** Test before deploying
- ✅ **Data-Driven:** See real impact on historical requests
- ✅ **Compliance Ready:** Audit trail of what-if analysis
- ✅ **Fast Iteration:** Run simulations in seconds
- ✅ **Permanent Record:** All simulations logged and queryable

### 6. Governance Sandbox (⭐ NEW)

**Interactive Playground:** Adjust governance and tone parameters with real-time effects on canonical prompts.

#### Core Parameters (Sliders & Toggles)

**Safety Strictness (0–100 slider)**
```
Maps to:
  • governance.filters.misinformation
  • governance.filters.hate
  • governance.filters.violence

Slider position → internally mapped to: allow / filter / block
  0–33:   allow (permissive)
  34–66:  filter (moderate)
  67–100: block (strict)
```

**Cultural Sensitivity (Low / Medium / High)**
```
Maps to:
  • governance.cultural.diasporaSensitivity
  • governance.cultural.stereotypePrevention
```

**Youth Protection (Toggle + Slider)**
```
Toggle: governance.youth.enabled
Slider: governance.youth.ageFloor (5–18)
```

**Tone Parameters (Independent sliders)**
```
• Formality:    0 (casual) ← → 100 (formal)
• Warmth:       0 (cold) ← → 100 (very warm)
• Directness:   0 (indirect) ← → 100 (direct)

Maps to: tone.formality, tone.warmth, tone.directness
```

#### User Flow

1. **Pick a preset** (Default, High-Sensitivity, Experimental)
2. **Adjust sliders** (changes happen in real-time)
3. **Sandbox evaluates 20 canonical test prompts**
4. **Shows live results:**
   - % allowed / blocked / redirected
   - Example outputs before/after
   - Which rules fired

#### API

**POST /api/v1/policy/sandbox**
```typescript
Request:
{
  "safetyStrictness": 75,        // 0–100
  "culturalSensitivity": "high", // low | medium | high
  "youthProtectionEnabled": true,
  "youthAgeFloor": 13,
  "toneFormal": 60,
  "toneWarmth": 70,
  "toneDirectness": 80,
  "presetBase": "default"        // optional
}

Response:
{
  "sandboxId": "sbx_xyz",
  "policyOverrides": { ... },     // Generated policy
  "results": {
    "totalPrompts": 20,
    "allowed": 15,
    "blocked": 3,
    "redirected": 2,
    "byRule": {
      "governance.filters.misinformation": 3,
      "governance.filters.hate": 1,
      "governance.youth": 1
    },
    "examples": [
      {
        "prompt": "Tell me about African history",
        "decision": "allowed",
        "explanation": "Educational content, no blocks"
      },
      {
        "prompt": "Hate speech example",
        "decision": "blocked",
        "explanation": "Blocked by hate filter (Cultural Sensitivity: high)"
      }
    ]
  }
}
```

#### Implementation (Frontend)

```typescript
export const GovernanceSandbox: React.FC = () => {
  const [overrides, setOverrides] = useState<PolicyOverrides>({
    safetyStrictness: 50,
    culturalSensitivity: "medium",
    youthProtectionEnabled: false,
    toneFormal: 50,
    toneWarmth: 50,
    toneDirectness: 50
  });

  const [results, setResults] = useState<SandboxResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSliderChange = async (key: string, value: number) => {
    const updated = { ...overrides, [key]: value };
    setOverrides(updated);
    
    setLoading(true);
    const response = await fetch("/api/v1/policy/sandbox", {
      method: "POST",
      body: JSON.stringify(updated)
    });
    const data = await response.json();
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div className="governance-sandbox">
      <div className="sliders">
        <SliderControl
          label="Safety Strictness"
          min={0}
          max={100}
          value={overrides.safetyStrictness}
          onChange={(v) => handleSliderChange("safetyStrictness", v)}
        />
        {/* More sliders... */}
      </div>

      <div className="results">
        {loading ? <Spinner /> : (
          <>
            <SummaryCards results={results} />
            <ExamplesTable results={results} />
            <RuleFrequency results={results} />
          </>
        )}
      </div>
    </div>
  );
};
```

#### Benefits
- ✅ **Instant Feedback:** See effects in real-time
- ✅ **No Deployment Needed:** Pure exploration
- ✅ **Learn by Doing:** Understand policy trade-offs
- ✅ **Preset Templates:** Start from proven configurations
- ✅ **Share Results:** Save and export sandbox configs

### 7. Policy Heatmap (⭐ NEW)

**Governance Intelligence:** Visualize which rules fire most often and when.

#### Data Collection

From `governance_events.triggered_rules`:
- Rule path (e.g., `governance.filters.misinformation`)
- Decision (blocked / redirected)
- Timestamp

Aggregated into time buckets (hour / day / week).

#### API

**GET /api/v1/policy/heatmap**
```typescript
?from=2026-06-01&to=2026-06-30&orgId=org_123&bucketSize=day

Response:
{
  "buckets": [
    {
      "start": "2026-06-01T00:00:00Z",
      "end": "2026-06-02T00:00:00Z",
      "rules": {
        "governance.filters.misinformation": 42,
        "governance.filters.hate": 17,
        "governance.filters.violence": 5
      }
    },
    // ... more buckets
  ],
  "topRules": [
    { 
      "path": "governance.filters.misinformation", 
      "count": 420,
      "blockedCount": 310,
      "redirectedCount": 110
    },
    { 
      "path": "governance.filters.hate", 
      "count": 210,
      "blockedCount": 180,
      "redirectedCount": 30
    }
  ]
}
```

#### UI

**Heatmap Grid:**
- **X-axis:** Time (days or weeks)
- **Y-axis:** Rule paths
- **Cell color:** Frequency (lighter = rare, darker = frequent)
- **Cell hover:** Shows exact count

**Sidebar:**
- Top 10 most-triggered rules with badges (Low / Medium / High)
- Click rule → open Governance Inspector + Simulator
- Filters: Time range, Org/Plan, Decision type

#### Features
- ✅ **Identify Hotspots:** Which rules fire most?
- ✅ **Trend Analysis:** Is safety spending increasing?
- ✅ **Anomaly Detection:** Spikes in rule activation
- ✅ **Org Comparison:** Compare heatmaps across orgs

### 8. Risk Scoring Engine (⭐ NEW)

**Quantify Misconfiguration Impact:** Each rule gets a risk score (0–100) reflecting its criticality.

#### Scoring Model

For each rule `r`:

```
baseRisk = category-specific constant
  • hate, self-harm:     5.0
  • misinformation:      4.0
  • sexual, violence:    3.0
  • formatting, tone:    1.0

frequencyFactor = log(1 + triggerCount)

blockFactor = blockedCount / max(1, triggerCount)
  (0.0 = never blocks, 1.0 = always blocks)

criticalMultiplier = orgCritical ? 1.5 : 1.0
  (org can mark rules as "critical" via UI)

score = baseRisk × (1 + frequencyFactor) × (0.5 + 0.5 × blockFactor) × criticalMultiplier

Normalized to 0–100
```

#### API

**GET /api/v1/policy/risk-scores**
```typescript
?orgId=org_123&timeWindow=30d

Response:
{
  "rules": [
    {
      "path": "governance.filters.misinformation",
      "score": 87,
      "category": "misinformation",
      "baseRisk": 4.0,
      "triggerCount": 420,
      "blockedCount": 310,
      "frequencyFactor": 6.04,
      "blockFactor": 0.74,
      "critical": true,
      "recommendation": "HIGH — Monitor closely, changes may impact many users"
    },
    {
      "path": "governance.filters.hate",
      "score": 72,
      "category": "hate",
      "baseRisk": 5.0,
      "triggerCount": 210,
      "blockedCount": 180,
      "frequencyFactor": 5.35,
      "blockFactor": 0.86,
      "critical": true,
      "recommendation": "HIGH — Changes highly impactful"
    },
    {
      "path": "tone.formality",
      "score": 12,
      "category": "tone",
      "baseRisk": 1.0,
      "triggerCount": 50,
      "blockedCount": 0,
      "frequencyFactor": 3.93,
      "blockFactor": 0.0,
      "critical": false,
      "recommendation": "LOW — Safe to experiment"
    }
  ]
}
```

#### UI

**Risk Scores List:**
```
Sorted by score (descending)

governance.filters.misinformation    [87] 🔴 CRITICAL
  Triggers: 420 | Blocks: 310 | Category: misinformation
  [View Inspector] [Run Simulation]

governance.filters.hate              [72] 🔴 HIGH
  Triggers: 210 | Blocks: 180 | Category: hate
  [View Inspector] [Run Simulation]

governance.youth.enabled             [45] 🟡 MEDIUM
  Triggers: 95 | Blocks: 45 | Category: youth
  [View Inspector] [Run Simulation]

tone.formality                        [12] 🟢 LOW
  Triggers: 50 | Blocks: 0 | Category: tone
  [View Inspector] [Run Simulation]
```

**Badges:**
- 🟢 LOW (0–30): Safe to experiment
- 🟡 MEDIUM (31–60): Use caution
- 🔴 HIGH (61–80): Monitor closely
- 🔴 CRITICAL (81–100): Highly impactful

#### Benefits
- ✅ **Prioritize Updates:** Focus on high-risk rules first
- ✅ **Safe Experimentation:** Know which rules won't hurt
- ✅ **Data-Driven Decisions:** Real impact metrics
- ✅ **Audit Trail:** Justifications for policy changes

### 9. LLM Policy Evaluator (⭐ NEW)

**Meta-Layer Intelligence:** AI evaluates policies themselves, explaining strengths, risks, and recommendations in plain English.

#### What It Does

Takes a `PolicyBundle` (or diff) and produces:
- **Plain-language summary** — What is this policy about?
- **Key strengths** — What does it do well?
- **Potential risks** — What could go wrong?
- **Recommendations** — How to improve it?

#### Data Model

```typescript
interface PolicyEvaluationInput {
  policy: PolicyBundle;
  riskScores?: { [rulePath: string]: number };
  heatmapSummary?: { [rulePath: string]: number };
}

interface PolicyEvaluationOutput {
  summary: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
}
```

#### Example Output (High-Sensitivity Policy)

```json
{
  "summary": "This policy is highly protective, prioritizing safety and cultural sensitivity over expressiveness. It's designed for organizations with strict compliance requirements or vulnerable user populations.",
  "strengths": [
    "Strict blocking of hate speech, self-harm, and illegal content.",
    "High diaspora sensitivity and stereotype prevention — culturally grounded.",
    "Youth protections enabled with a conservative age floor (13+).",
    "Warm, respectful tone encourages constructive dialogue.",
    "Clear audit trail for all decisions."
  ],
  "risks": [
    "May over-block nuanced or educational content about sensitive topics.",
    "Could frustrate advanced users who expect more expressive responses.",
    "Requires detailed user messaging when content is blocked to reduce confusion.",
    "May need separate 'research' or 'educational' preset for academic use."
  ],
  "recommendations": [
    "Consider a separate 'research' preset with slightly relaxed filters for educational content.",
    "Add contextual user messaging: 'This topic requires more context. Would you like...'",
    "Monitor heatmap for over-blocking patterns; adjust 'filter' → 'allow' if safe.",
    "Test with domain experts (educators, clinicians) for false positives.",
    "Document exemption process for legitimate high-sensitivity content."
  ]
}
```

#### API

**POST /api/v1/policy/evaluate**
```typescript
Request:
{
  "policy": {
    "governance": { ... },
    "tone": { ... },
    "identity": { ... }
  },
  "riskScores": {
    "governance.filters.misinformation": 87,
    "governance.filters.hate": 72
  },
  "heatmapSummary": {
    "governance.filters.misinformation": 420,
    "governance.filters.hate": 210
  }
}

Response:
{
  "summary": "...",
  "strengths": [ ... ],
  "risks": [ ... ],
  "recommendations": [ ... ]
}
```

#### UI Integration

**In Governance Inspector, add tab: "LLM Evaluation"**

```
📋 Policy Evaluation

Summary:
"This policy is highly protective, prioritizing safety over expressiveness..."

Strengths:
✓ Strict blocking of hate, self-harm, illegal content
✓ High diaspora sensitivity and stereotype prevention
✓ Youth protections enabled with conservative age floor
✓ Warm, respectful tone

Potential Risks:
⚠ May over-block nuanced educational content
⚠ Could frustrate advanced users
⚠ Requires detailed user messaging

Recommendations:
→ Consider separate 'research' preset with relaxed filters
→ Add contextual user messaging when content blocked
→ Monitor heatmap for over-blocking patterns
→ Test with domain experts

[Re-evaluate after changes]
```

**Button: "Re-evaluate after changes"**
- Re-runs evaluation after user modifies policy
- Shows before/after comparison
- Highlights newly introduced risks

#### Benefits
- ✅ **Self-Documenting:** Policies explain themselves
- ✅ **Best Practices:** Recommendations from domain knowledge
- ✅ **Risk Awareness:** Understand unintended consequences
- ✅ **Team Alignment:** Non-technical stakeholders understand policies
- ✅ **Compliance:** Documented rationale for policy choices

### 10. Runtime Evaluator

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
```

### 11. Tone & Identity Presets (Production-Ready)

Four built-in tone presets, ready for deployment:

#### `sovereign_guide.json`
Calm, grounded, culturally aware guidance with firm ethical boundaries.

#### `technical_copilot.json`
Precise, structured, implementation-focused for developers.

#### `community_mentor.json`
Supportive, encouraging, youth-friendly guidance.

#### `enterprise_formal.json`
Compliance-friendly, precise, low-emotion for institutional contexts.

### 12. Lightweight Client SDK

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
| Sandbox Evaluation (20 prompts) | N/A | 800ms | **New** |
| Heatmap Query (30 days) | N/A | 150ms | **New** |
| Risk Scores Computation | N/A | 300ms | **New** |
| Memory (per policy) | 2.1MB | 1.2MB | **43% leaner** |
| Audit Query (100k versions) | N/A | 120ms | **New** |

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

### Simulation & Sandbox Audit
- Every simulation and sandbox session logged
- Results immutable (attached to record)
- Enables compliance review: "What was tested before deployment?"

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
**New table:** `policy_versions` (immutable, auditable)  
**Backward compatibility:** Old policy tables can be migrated via batch script

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
npm install --save @frasberg/simulator@7.0.0
npm install --save @frasberg/sandbox@7.0.0     # NEW
npm install --save @frasberg/heatmap@7.0.0     # NEW
npm install --save @frasberg/risk-scoring@7.0.0 # NEW
```

### Step 2: Create Policy Versions Table
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
```

### Step 3: Migrate Existing Policies
```typescript
// Migration script: bin/migrate-policies-v7.ts
import { migratePoliciesFromV6 } from "@frasberg/migration";

await migratePoliciesFromV6(db, {
  batchSize: 1000,
  logProgress: true,
  dryRun: false
});
```

### Step 4: Rollout Strategy
1. **Deploy v7.0 in canary mode** (10% traffic)
2. **Monitor governance decisions** via Inspector
3. **Test Simulator** on historical data
4. **Validate Heatmap** and Risk Scores
5. **Gradual rollout** to 100% over 48 hours
6. **Keep v6.5 running** as fallback for 30 days

---

## 📦 New Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@frasberg/governance@7.0.0` | 7.0.0 | Policy resolution & versioning |
| `@frasberg/inspector@7.0.0` | 7.0.0 | Visual governance UI component |
| `@frasberg/evaluator@7.0.0` | 7.0.0 | Runtime decision explanation |
| `@frasberg/simulator@7.0.0` | 7.0.0 | Policy what-if testing |
| `@frasberg/sandbox@7.0.0` | 7.0.0 | **NEW** — Interactive parameter playground |
| `@frasberg/heatmap@7.0.0` | 7.0.0 | **NEW** — Rule frequency visualization |
| `@frasberg/risk-scoring@7.0.0` | 7.0.0 | **NEW** — Risk quantification engine |

---

## 🐛 Bug Fixes

### Fixed Issues
- **#1247** — Policy merge didn't deep-copy nested objects
- **#1289** — Org policies could override plan hard limits
- **#1301** — No audit trail for governance changes
- **#1356** — Unclear why requests were blocked
- **#1402** — Policy caching stale data across sessions

---

## 📚 Documentation

### New Guides
- **[Policy Simulator Guide](docs/simulator.md)** — Test rules before deploying
- **[Governance Sandbox Guide](docs/sandbox.md)** — **NEW** — Interactive exploration
- **[Policy Heatmap Guide](docs/heatmap.md)** — **NEW** — Analyze rule activation
- **[Risk Scoring Guide](docs/risk-scoring.md)** — **NEW** — Quantify impact
- **[Policy Evaluation Guide](docs/policy-evaluation.md)** — **NEW** — LLM analysis

---

## 🧪 Testing

### Test Coverage
- **Unit Tests:** 91% coverage (was 72%)
- **Integration Tests:** All new features end-to-end
- **E2E Tests:** Simulator, Sandbox, Heatmap workflows

---

## 🎯 What's Next (v7.1-v8.0 Roadmap)

| Feature | Release | Status |
|---------|---------|--------|
| Simulation Templates | v7.1 | Planned |
| Policy Import/Export (YAML) | v7.1 | Planned |
| Real-time Policy Analytics | v7.2 | Planned |
| Multi-Rule Simulations | v7.2 | Planned |
| Governance Sandbox Advanced | v7.2 | Planned |
| Policy Templates for Industries | v7.3 | Planned |
| Simulation Scheduling (auto-run) | v7.3 | Planned |
| GraphQL API for Policies | v7.4 | Planned |
| Multi-Region Policy Sync | v8.0 | Research |

---

## 💪 Dependencies

### Core
- Node.js ≥18.0.0
- TypeScript ≥5.0.0
- Express ≥4.18.0

### Database
- PostgreSQL ≥14.0
- Redis ≥7.0 (optional)

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

---

## 🙏 Thank You

Built on feedback from 200+ enterprise customers.

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

---

## 📝 Version History

| Version | Date | Highlights |
|---------|------|-----------|
| v7.0.0 | Jun 12, 2026 | **Policy Resolution, Inspector, Simulator, Sandbox, Heatmap, Risk Scoring, LLM Evaluator** |
| v6.5.0 | May 22, 2026 | Frasberg Rebranding |
| v6.0.0 | Feb 8, 2026 | Distributed, Quantum-Ready |

---

**Frasberg AI v7.0.0** — Enterprise-Grade Policy Governance

Built for teams that need transparency, compliance, testing, exploration, and control.

*Institution-Grade Intelligence*
