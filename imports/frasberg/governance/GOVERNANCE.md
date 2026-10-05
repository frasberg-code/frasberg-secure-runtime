# Frasberg Governance Specification

Frasberg implements a unified governance framework covering licensing, behavioral constraints, mesh metadata, and release integrity. This document defines the rules, expectations, and automated enforcement mechanisms that govern the Frasberg codebase and all dependent subsystems.

---

## 1. Governance Principles

### Identity Preservation
Frasberg enforces identity-preserving conversational and behavioral output across all connected systems, including Luchii, LINQ, Emerald Estates, and Emerald Orbit.

### Licensing Integrity
All code, artifacts, and releases must comply with the unified MIT licensing regime, including root-level and subpackage licensing and SPDX headers.

### Reproducibility
All releases must be reproducible, hash-verified, and provenance-tracked.

### Mesh Governance
Versioning and metadata for mesh components must be tracked, updated, and embedded into release artifacts.

---

## 2. Licensing Governance

### Required License Locations
- `LICENSE` at repository root  
- `LICENSE` inside every subpackage under:
  - `packages/`
  - `apps/`
  - `libs/`
  - `modules/`
  - `sdk/`

### SPDX Requirements
All source files must begin with:
```
SPDX-License-Identifier: MIT
```

### CI Enforcement
CI workflows must:
- Fail if root LICENSE is missing  
- Fail if any subpackage LICENSE is missing  
- Fail if any SPDX header is missing  

---

## 3. Mesh Governance

Mesh metadata includes:
- `meshVersion`
- `raftTerm`
- `snapshotVersion`

Rules:
- Mesh version increments on release tags  
- Raft term increments on governance events  
- Snapshot version updates on state transitions  

Mesh metadata must be embedded into:
- `release-manifest.json`
- Release provenance

---

## 4. Release Governance

Each release must generate:

- `release-manifest.json`
- `release-bundle.tar.gz`
- `release-hashes.json`
- `provenance.json`

Each artifact must embed:
- Root LICENSE
- Mesh metadata
- Commit hash
- Timestamp

Release publication must upload all artifacts to GitHub Releases.

---

## 5. LLM Role Governance

Frasberg enforces three license roles:

### LLM Provider License
- Governs model creation, training, and inference.
- Repos: Frasberg, Luchii
- Authority: Only providers can promote releases.

### LLM Bearer License
- Governs runtime usage, identity preservation, and behavioral constraints.
- Repos: Frasberg, LINQ
- Authority: Bearers consume provider mesh and enforce identity rules.

### LLM Distributor License
- Governs redistribution, packaging, SDKs, and downstream usage.
- Repos: sdk-js, sdk-python, sdk-go, sdk-rust
- Authority: Distributors embed licenses and hashes in all artifacts.

---

## 6. Automation

Required scripts:

- `scripts/propagate-license.ts`
- `scripts/add-spdx-headers.ts`
- `scripts/repo-license-auditor.ts`
- `scripts/generate-release-manifest.ts`
- `scripts/package-release.ts`
- `scripts/hash-release.ts`
- `scripts/generate-provenance.ts`

Required workflows:

- License Enforcement
- Full Release Pipeline
- Release Publication
- Role-Aware Promotion
- Mesh Release Tagger
- LLM Certification Check

---

## 7. Compliance

A Frasberg deployment is compliant when:

- All LICENSE files exist  
- All SPDX headers exist  
- Mesh metadata is correct  
- Release artifacts are complete and hash-verified  
- CI passes without governance failures
- LLM roles are correctly assigned and enforced
