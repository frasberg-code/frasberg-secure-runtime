# Frasberg Unified Release Handbook

This handbook defines the complete release process for Frasberg, including licensing, mesh metadata, artifact generation, hashing, provenance, and publication.

---

## 1. Pre-Release Requirements

### Licensing
- Root LICENSE present  
- Subpackage LICENSE coverage complete  
- SPDX headers added to all source files  

### Mesh Governance
- meshVersion updated  
- raftTerm incremented if governance event occurred  
- snapshotVersion updated  

### CI
- License auditor passes  
- Mesh validator passes  
- Tests pass  
- LLM role validation passes

---

## 2. Release Artifact Generation

### Required Artifacts
- `release-manifest.json`
- `release-bundle.tar.gz`
- `release-hashes.json`
- `provenance.json`

### Artifact Contents
- Commit hash  
- Timestamp  
- Mesh metadata  
- Package list  
- LICENSE embedded
- LLM roles metadata

---

## 3. Release Pipeline Steps

1. Checkout repository  
2. Run license auditor  
3. Run mesh validator
4. Run LLM role validator
5. Build packages  
6. Generate manifest  
7. Package bundle  
8. Generate hashes  
9. Generate provenance  
10. Publish artifacts to GitHub Releases  

---

## 4. LLM Provider Release Promotion

**Only LLM Providers can promote to staging/production.**

Steps:
1. Verify repository is certified LLM Provider
2. Load governance.config.json and check `license.roles.llmProvider`
3. Confirm all release artifacts exist
4. Validate mesh metadata alignment
5. Execute deployment to target environment
6. Update release-sync-map.json for downstream repos

---

## 5. Cross-Repo Synchronization

Frasberg ↔ Luchii versions must remain aligned.

- Update `release-sync-map.json`  
- Validate tag propagation  
- Confirm mesh metadata consistency
- Trigger synchronous updates in dependent repos

---

## 6. Post-Release Verification

- All artifacts published  
- Release notes generated  
- Provenance validated  
- Hashes verified  
- Mesh timeline updated
- Certification status confirmed

---

## 7. Governance Compliance

A release is compliant when:

- All licensing rules are satisfied  
- All mesh metadata is correct  
- All artifacts exist and are valid  
- CI pipelines pass  
- Cross-repo sync is aligned
- LLM roles are properly assigned
- Certification manifest is valid
