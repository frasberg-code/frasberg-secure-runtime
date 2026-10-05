# Frasberg Org Architecture Map

## Governance Layers

### Layer 1: Governance (Frasberg)
- **Repo**: `FrasbergAI/Frasberg`
- **Components**:
  - Governance Engine
  - Mesh Metadata (versioning, state)
  - Licensing Enforcement
  - Release Integrity Tooling
  - LLM Role Manager
- **Authority**: Source of truth for all governance rules

### Layer 2: Model (Luchii)
- **Repo**: `FrasbergAI/Luchii`
- **Components**:
  - Text Generation Engine
  - Inference Services
  - Kubernetes + Helm deployment
- **Governed By**:
  - Mesh metadata from Frasberg
  - Licensing + release rules
  - Identity preservation constraints

### Layer 3: Interface (LINQ)
- **Repos**: `FrasbergAI/LINQ`, Portals, Consoles
- **Components**:
  - UI + Runtime Clients
  - API Gateways
  - Identity/Behavior Enforcement
- **Governed By**:
  - SDK + API governance
  - Identity + tonal rules
  - Bearer role requirements

### Layer 4: SDK Distribution
- **Repos**:
  - `FrasbergAI/sdk-js`
  - `FrasbergAI/sdk-python`
  - `FrasbergAI/sdk-go`
  - `FrasbergAI/sdk-rust`
- **Components**:
  - Client libraries
  - Integration tooling
  - Package managers (npm, PyPI, etc.)
- **Governed By**:
  - SPDX + LICENSE embedding
  - Release artifacts + provenance
  - Distributor role requirements

---

## Governance Flow

```
Frasberg defines governance
    ↓
    ├─→ Mesh metadata versioning
    ├─→ Licensing rules
    ├─→ Release integrity
    └─→ LLM role assignments
    
    ↓
Luchii consumes governance
    ├─→ Model behavior governed
    ├─→ Release sync'd
    ├─→ Mesh versioning aligned
    └─→ Provider role enforced
    
    ↓
LINQ + Portals consume governance
    ├─→ UI/runtime behavior governed
    ├─→ Bearer role enforced
    ├─→ Identity rules applied
    └─→ SDK integration compliance
    
    ↓
SDKs propagate governance
    ├─→ LICENSE embedded
    ├─→ SPDX headers included
    ├─→ Hashes/provenance published
    └─→ Distributor role enforced
    
    ↓
External Integrators inherit all rules
```

---

## LLM Role Authority Matrix

| Role | Repos | Authority | Responsibilities |
|------|-------|-----------|------------------|
| **Provider** | Frasberg, Luchii | Define governance; promote releases | Mesh versioning; release integrity; version alignment |
| **Bearer** | Frasberg, LINQ | Enforce identity; consume metadata | Respect mesh; apply behavioral rules; maintain consistency |
| **Distributor** | sdk-* | Package & embed; ensure compliance | LICENSE/SPDX embedding; hash verification; provenance |

---

## Synchronization Points

| Point | Components | Flow |
|-------|------------|------|
| **Mesh Metadata** | Frasberg → Luchii → LINQ → SDKs | Single source of truth |
| **Release Tags** | Frasberg ↔ Luchii (synchronized) | Version parity enforcement |
| **License Enforcement** | Shared CI workflows | Org-wide compliance |
| **Provenance** | Unified SLSA-style metadata | End-to-end traceability |
| **Release Artifacts** | Shared bundle + manifest structure | Consistent packaging |

---

## Governance Guarantees

**Frasberg is the source of truth for:**

- Licensing governance
- Mesh versioning & state
- Release integrity rules
- LLM role assignments
- Behavioral identity constraints
- Reproducibility standards

**All other repos in FrasbergAI inherit and enforce these rules.**
