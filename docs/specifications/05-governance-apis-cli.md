# Frasberg Autonomous Cloud V1 — Governance APIs & CLI Specification

## 1. Purpose

Define how human operators, compliance teams, and councils interact with the Autonomous Cloud through governance APIs and CLI tools to approve decisions, monitor safety, adjust policies, and maintain human oversight.

## 2. Governance Responsibilities Framework

### ACO (Autonomous Cloud Operator) Responsibilities

The ACO is the primary human interface to the system. ACO responsibilities are categorized:

| Category | Examples | Requires Approval | Escalation Path |
|----------|----------|-------------------|-----------------|
| **Health** | Monitor global health | No | — |
| **Policy** | Approve policy changes | Yes | security-review, legal-review |
| **Safety** | Approve safety envelope changes | Yes | safety-board |
| **Compliance** | Approve compliance bundles (GDPR, HIPAA, Sovereign) | Yes | legal-review, compliance-team |
| **SLA** | Approve SLA guarantees | Yes | finance-review, operations-review |
| **Routing** | Approve region routing rules | Yes | — |
| **Upgrade** | Approve system upgrades | Yes | technical-review, safety-review |
| **Epoch** | Review daily epoch reports | No | — |
| **Audit** | Review audit logs | No | — |

### Councils

Governance authority is distributed across councils:

- **Sovereignty Council**: Enforces residency, sovereign zones, corridor restrictions
- **Compliance Council**: Enforces GDPR, HIPAA, custom compliance bundles
- **Safety Council**: Enforces safety envelope, SLA thresholds, failsafe boundaries
- **Finance Council**: Enforces cost budgets, pricing guarantees, SLA pricing
- **Technical Council**: Enforces upgrade policies, tech debt management

## 3. Governance REST API

### Base Endpoint

```
GET/POST /api/v1/governance/*
Authentication: Bearer {api_token}
Rate Limit: 100 req/min
```

### Core Resources

#### Responsibilities

**List all responsibilities:**
```
GET /api/v1/governance/responsibilities
```

Response:
```json
{
  "responsibilities": [
    {
      "id": "monitor_health",
      "category": "health",
      "description": "Monitor global autonomy health across all regions",
      "requiresApproval": false
    },
    {
      "id": "approve_policy_change",
      "category": "policy",
      "description": "Approve global policy changes before deployment",
      "requiresApproval": true,
      "escalationPath": ["security-review", "legal-review"]
    }
  ]
}
```

#### Health Reports

**Get health summary:**
```
GET /api/v1/governance/health
```

Response:
```json
{
  "timestamp": "2025-07-17T15:30:00Z",
  "totalTenants": 1250,
  "avgHealth": 94.2,
  "avgUptime": 99.87,
  "avgSlaHealth": 99.94,
  "criticalCount": 2,
  "warningCount": 18,
  "status": "HEALTHY"
}
```

#### Approval Workflow

**Get pending approvals:**
```
GET /api/v1/governance/approvals?status=pending
```

Response:
```json
{
  "approvals": [
    {
      "id": "appr_8f3c9d2e",
      "type": "policy_change",
      "proposalId": "prop_2a1b4c7f",
      "title": "Update SLA tier pricing",
      "description": "Adjust premium tier SLA guarantees",
      "requiredCouncils": ["finance", "compliance"],
      "submittedAt": "2025-07-17T14:00:00Z",
      "deadline": "2025-07-17T15:00:00Z",
      "approvals": [
        {
          "council": "finance",
          "status": "approved",
          "approver": "alice@frasberg.ai",
          "timestamp": "2025-07-17T14:15:00Z"
        },
        {
          "council": "compliance",
          "status": "pending",
          "approver": null
        }
      ]
    }
  ]
}
```

**Approve/Reject:**
```
POST /api/v1/governance/approvals/{id}/approve
Content-Type: application/json

{
  "council": "compliance",
  "approver": "bob@frasberg.ai",
  "notes": "Verified against GDPR requirements"
}
```

Response:
```json
{
  "status": "approved",
  "timestamp": "2025-07-17T14:31:00Z",
  "allApprovalsComplete": true,
  "approvalToken": "token_xyz123"
}
```

#### Safety Envelope

**Get safety envelope status:**
```
GET /api/v1/governance/safety-envelope
```

Response:
```json
{
  "state": "green",
  "dimensions": {
    "sla": { "status": "green", "value": 99.94, "threshold": 99.9 },
    "latency": { "status": "green", "value": 186, "threshold": 250 },
    "compliance": { "status": "green", "violations": 0 },
    "sovereignty": { "status": "green", "violations": 0 },
    "mesh": { "status": "amber", "score": 0.68, "threshold": 0.7 },
    "evolution": { "status": "green", "recentFailures": 0 }
  },
  "alerts": []
}
```

**Force mode change:**
```
POST /api/v1/governance/kernel/mode
Content-Type: application/json

{
  "mode": "steady_state",
  "reason": "Governance override - emergency stabilization"
}
```

#### Compliance & Policies

**Get compliance bundles:**
```
GET /api/v1/governance/compliance/bundles
```

Response:
```json
{
  "bundles": [
    {
      "id": "gdpr",
      "name": "GDPR Compliance",
      "status": "active",
      "rules": [
        {
          "id": "gdpr_residency",
          "description": "Data residency: EU only",
          "enforcement": "strict"
        }
      ]
    }
  ]
}
```

**Get SLA profiles:**
```
GET /api/v1/governance/sla/profiles
```

Response:
```json
{
  "profiles": [
    {
      "tier": "premium",
      "slaGuarantee": 99.99,
      "latencyP95": 100,
      "cost": "$X/month"
    }
  ]
}
```

#### Audit & Logging

**Get audit logs:**
```
GET /api/v1/governance/audit/logs?days=7&action=policy_change
```

Response:
```json
{
  "logs": [
    {
      "id": "audit_abc123",
      "timestamp": "2025-07-17T14:22:00Z",
      "action": "policy_change",
      "actor": "alice@frasberg.ai",
      "resource": "sla_profile_premium",
      "changes": { "guarantee": "99.95 → 99.99" },
      "impact": "Affects 450 tenants"
    }
  ]
}
```

**Get epoch reports:**
```
GET /api/v1/governance/epochs/{epochId}/report
```

Response:
```json
{
  "epochId": "epoch_2025_07_17",
  "metrics": {
    "health": 94.2,
    "uptime": 99.87,
    "costSavings": 12500,
    "optimizations": 47,
    "issues": []
  }
}
```

## 4. Governance CLI Tool

### Installation

```bash
npm install -g @frasberg/governance-cli
frasberg-gov --version
```

### Configuration

```bash
frasberg-gov config set --api-key sk_live_xxxxx
frasberg-gov config set --api-url https://governance.frasberg.cloud
frasberg-gov config set --council "compliance"
```

### Command Groups

#### Status Commands

```bash
# Overall system health
frasberg-gov status

# Safety envelope
frasberg-gov safety status
frasberg-gov safety dimensions

# Kernel mode
frasberg-gov kernel mode
frasberg-gov kernel history

# Federation view
frasberg-gov federation status
frasberg-gov federation regions
frasberg-gov federation corridors
```

#### Approval Commands

```bash
# List pending approvals
frasberg-gov approvals list
frasberg-gov approvals list --council compliance
frasberg-gov approvals list --status pending

# View approval details
frasberg-gov approvals show appr_8f3c9d2e

# Approve/Reject
frasberg-gov approvals approve appr_8f3c9d2e --notes "Verified"
frasberg-gov approvals reject appr_8f3c9d2e --reason "Needs revision"

# Bulk approval (for pre-approved templates)
frasberg-gov approvals batch-approve --template low-risk
```

#### Policy & Compliance Commands

```bash
# List compliance bundles
frasberg-gov compliance bundles

# Enable/disable compliance
frasberg-gov compliance enable gdpr
frasberg-gov compliance disable hipaa

# List SLA profiles
frasberg-gov sla list

# Update SLA (requires approval)
frasberg-gov sla update premium --guarantee 99.99 --submit
frasberg-gov sla approve sla_update_xyz
```

#### Evolution Commands

```bash
# List proposed evolutions
frasberg-gov evolution proposals
frasberg-gov evolution proposals --state pending

# View proposal details
frasberg-gov evolution show prop_2a1b4c7f

# Simulation results
frasberg-gov evolution simulate prop_2a1b4c7f

# Approve/Reject evolution
frasberg-gov evolution approve prop_2a1b4c7f
frasberg-gov evolution reject prop_2a1b4c7f --reason "Safety score too low"

# Execute immediately (for pre-approved)
frasberg-gov evolution execute prop_2a1b4c7f --force
```

#### Audit & Reporting Commands

```bash
# View audit logs
frasberg-gov audit logs --days 7
frasberg-gov audit logs --action policy_change
frasberg-gov audit logs --actor alice@frasberg.ai

# Export audit trail
frasberg-gov audit export --format json --output audit_trail.json

# Generate compliance report
frasberg-gov report compliance --period monthly
frasberg-gov report compliance --standard gdpr

# Epoch reports
frasberg-gov epoch status
frasberg-gov epoch report 2025_07_17
```

#### Emergency Commands

```bash
# Emergency mode: freeze evolution, set to steady_state
frasberg-gov emergency freeze-evolution
frasberg-gov emergency steady-state

# Emergency: lock all corridors
frasberg-gov emergency lock-corridors

# Emergency: force audit mode (log everything)
frasberg-gov emergency audit-mode

# View emergency logs
frasberg-gov emergency logs

# Exit emergency mode
frasberg-gov emergency exit --confirmation "I understand the risks"
```

### Interactive Mode

```bash
frasberg-gov interactive

> health
[Health status display]

> approvals pending
[List of pending approvals]

> approve appr_xyz --notes "Checked"
✓ Approved

> exit
```

## 5. Event-Driven Notifications

The system can push notifications to governance stakeholders:

### Webhook Configuration

```bash
frasberg-gov notify webhook create \
  --url https://hooks.slack.com/services/... \
  --events approval_needed,safety_amber,safety_red \
  --filter "council==compliance"
```

### Notification Types

- `approval_needed` — new proposal requires approval
- `safety_amber` / `safety_red` — safety envelope degraded
- `sla_breach` — SLA guarantee at risk
- `compliance_violation` — compliance rule breach
- `evolution_rollback` — evolution reverted
- `governance_escalation` — incident escalated to council
- `audit_alert` — suspicious activity detected

## 6. Integration with Kubernetes

CLI can deploy as K8s controller:

```bash
frasberg-gov k8s install --namespace governance
```

Watches custom resources:

```yaml
apiVersion: governance.frasberg.cloud/v1
kind: ApprovalRequest
metadata:
  name: policy-update-xyz
spec:
  type: policy_change
  proposalId: prop_abc123
  requiredCouncils:
    - compliance
    - finance
status:
  approvals:
    compliance: approved
    finance: pending
```

## 7. Audit & Compliance

All API calls and CLI commands are logged with:
- Actor (user, service account)
- Timestamp
- Action taken
- Resource modified
- Full request/response body
- IP address
- User-Agent

Logs retained for minimum 7 years per compliance requirements.
