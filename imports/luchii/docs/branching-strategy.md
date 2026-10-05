# Frasberg AI Branching Strategy Document
Version 1.0 — © 2026 Frasberg AI

## Purpose
This document defines the official branching model for all Frasberg AI repositories, ensuring consistency, governance compliance, and high-integrity development across the ecosystem.

Frasberg AI uses a **governed branching strategy** designed for:

- Multi-region deployment
- Strict code quality
- Legal and safety compliance
- High-velocity development
- Auditability and traceability

# 1. Branch Types

## 1. Main Branch (`main`)
**Role:** Production source of truth  
**Protection:** Maximum  
**Ruleset:** `FrasbergAI-Core-Protection`  
**CI/CD:** Full pipeline -> staging -> production  
**Quality Gates:**

- Code quality severity: **Errors**
- Coverage: **>=80%**
- Signed commits only
- PR required
- No direct pushes
- No force pushes

**What goes here:**

- Approved, governed, production-ready code
- Release candidates merged from `stable`
- Finalized governance/legal documents

## 2. Stable Branch (`stable`)
**Role:** Release staging branch  
**Protection:** Maximum  
**Ruleset:** `FrasbergAI-Core-Protection`  
**CI/CD:** Full pipeline -> release tagging  
**Quality Gates:**

- Code quality severity: **Errors**
- Coverage: **>=85%**
- Signed commits only
- PR required
- No direct pushes

**What goes here:**

- Release-ready merges from `main`
- Versioned artifacts
- Tagged releases (e.g., `v1.0.0`)

## 3. Release Branches (`release/*`)
**Role:** Version-specific release preparation  
**Protection:** High  
**Ruleset:** `FrasbergAI-Core-Protection`  
**CI/CD:** Full pipeline  
**Quality Gates:**

- Code quality severity: **Errors**
- Coverage: **>=80%**

**What goes here:**

- Release-specific fixes
- Hotfixes
- Version locking

## 4. Feature Branches (`feature/*`)
**Role:** Active development  
**Protection:** Medium  
**Ruleset:** None (lightweight)  
**CI/CD:** Build + lint + tests  
**Quality Gates:**

- Code quality severity: **Errors**
- Coverage: recommended but not required

**What goes here:**

- New features
- Model improvements
- Engine upgrades
- UI components

## 5. Documentation Branches (`docs/*`)
**Role:** Documentation, governance, legal, API updates  
**Protection:** Medium  
**Ruleset:** `FrasbergAI-Docs-Governance`  
**CI/CD:** Lint + governance validation  
**Quality Gates:**

- Code quality severity: **Errors only**
- No coverage requirement

**What goes here:**

- Governance Constitution
- Safety Charter
- Enterprise License
- API Reference
- Portal Wireframe
- Multi-region blueprint

## 6. Governance Branches (`governance/*`)
**Role:** High-impact governance changes  
**Protection:** High  
**Ruleset:** `FrasbergAI-Docs-Governance`  
**CI/CD:** Governance validation + security scan  
**Quality Gates:**

- Code quality severity: **Errors**
- No coverage requirement

**What goes here:**

- Constitutions
- Policies
- Rulesets
- Legal documents

## 7. Hotfix Branches (`hotfix/*`)
**Role:** Emergency fixes  
**Protection:** Medium  
**CI/CD:** Full pipeline  
**Quality Gates:**

- Code quality severity: **Errors**
- Coverage: waived for emergencies

**What goes here:**

- Critical production fixes
- Security patches
- Urgent model corrections

# 2. Branch Lifecycle

### Feature -> PR -> main -> stable -> release -> production

1. Developer creates `feature/*`
2. PR opened to `main`
3. CI/CD gates run
4. Governance review (if applicable)
5. Merge into `main`
6. Promote to `stable` for release
7. Tag release
8. Deploy to production

# 3. Governance Workflow

### Governance-sensitive changes require:

- PR
- Signed commits
- Governance review
- Safety validation
- Legal approval (if applicable)

Governance branches (`governance/*`) must reference:

- Constitution
- Safety Charter
- Brand Protection Policy
- Enterprise License

# 4. Documentation Workflow

### Docs changes require:

- PR
- Signed commits
- Lint checks
- Governance validation (for legal/safety docs)

Docs branches (`docs/*`) merge into `main` only after review.

# 5. Release Workflow

### Release branches (`release/*`) follow:

- Freeze
- Final testing
- Tagging
- Merge into `stable`
- Merge into `main`
- Deploy

# 6. Hotfix Workflow

### Hotfix branches (`hotfix/*`) follow:

- Immediate creation
- Direct PR to `main`
- Accelerated review
- Merge
- Deploy
- Backport to `stable` and `release/*`

# 7. Branch Naming Conventions

| Type | Format | Example |
| --- | --- | --- |
| Feature | `feature/<name>` | `feature/luchii-context-upgrade` |
| Docs | `docs/<name>` | `docs/governance-legal-pack-v2` |
| Governance | `governance/<name>` | `governance/safety-charter-update` |
| Release | `release/<version>` | `release/v1.0.0` |
| Hotfix | `hotfix/<issue>` | `hotfix/production-crash` |

# 8. Enforcement

Branching strategy is enforced via:

- GitHub Rulesets
- CI/CD quality gates
- Governance review
- Signed commits
- Deployment requirements

# 9. Summary

Frasberg AI's branching strategy ensures:

- High integrity
- Strong governance
- Legal compliance
- Multi-region reliability
- Developer velocity
- Auditability

This is the branching model used by Frasberg AI platform with governed architectures.
