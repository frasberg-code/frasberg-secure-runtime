# Frasberg Governance Guide

This guide explains how to use Frasberg's governance system, including mesh versioning, licensing enforcement, role management, and release pipelines.

---

## Quick Start

### View Mesh Status
```bash
npm run governance:mesh
# or
make mesh-status
```

### Bump Mesh Version
```bash
npm run governance:bump -- 2.1.0
# or
make mesh-bump v=2.1.0
```

### Run License Audit
```bash
npm run license:audit
# or
make license
```

### Check Sync Status
```bash
npm run governance:sync
# or
make sync
```

---

## Mesh Versioning

Frasberg maintains mesh metadata that tracks versioning and governance state:

```json
{
  "meshVersion": "2.0.0",      // Semantic version for governance mesh
  "raftTerm": 42,               // Increment counter for governance events
  "snapshotVersion": "2026.08.14" // Current state snapshot version
}
```

### When to Update

- **meshVersion**: On release tags (v2.0.0 → meshVersion 2.0.0)
- **raftTerm**: On governance events (policy changes, role updates)
- **snapshotVersion**: On state transitions (deployment, migration)

---

## LLM Roles

Frasberg enforces three license roles:

### LLM Provider (Frasberg, Luchii)
- Authority: Define and enforce governance rules
- Capability: Promote releases to staging/production
- Responsibility: Maintain mesh metadata and version alignment

### LLM Bearer (Frasberg, LINQ)
- Authority: Consume governance metadata
- Capability: Enforce identity and behavioral constraints
- Responsibility: Respect mesh versioning and maintain consistency

### LLM Distributor (sdk-js, sdk-python, sdk-go, sdk-rust)
- Authority: Package and distribute artifacts
- Capability: Embed licenses and generate hashes
- Responsibility: Maintain SPDX headers and provenance

---

## Governance Files

### Core Configuration
- **governance.config.json** - Repository governance configuration (license roles, mesh settings)
- **llm-certification.json** - Repo certification status and criteria
- **governance/mesh-registry.json** - Mesh versioning history and state
- **governance/org-role-matrix.json** - Frasberg org-wide role assignments

### Documentation
- **governance/GOVERNANCE.md** - Complete governance specification
- **governance/CHARTER.md** - Organization governance charter
- **governance/HANDBOOK.md** - Release and governance procedures
- **governance/ARCHITECTURE.md** - Org architecture and governance flow

### Release Artifacts
- **release-sync-map.json** - Cross-repo synchronization state
- **release-manifest.json** - Release metadata (generated on tag)
- **release-hashes.json** - SHA-256/512 hashes (generated on release)
- **provenance.json** - SLSA provenance metadata (generated on release)

---

## CI/CD Workflows

### frasberg-ci.yml
Runs on every push/PR:
- License audit
- Role enforcement
- Mesh validation
- Tests and builds
- Release pipeline (on version tags)

### role-aware-promotion.yml
Manual workflow to promote releases:
- Validates LLM Provider role
- Confirms artifacts exist
- Validates mesh metadata alignment
- Deploys to staging/production

### mesh-release-tagger.yml
Automatic on version tags:
- Updates mesh registry from tag
- Commits mesh updates
- Creates release notes
- Publishes release with governance metadata

### llm-cert-check.yml
Runs on PRs and pushes:
- Validates certification manifest
- Checks role alignment
- Verifies criteria
- Confirms org role matrix alignment

---

## Release Process

### 1. Prepare Release
```bash
# Ensure governance is aligned
npm run governance:mesh
npm run license:audit
```

### 2. Tag Release
```bash
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0
```

The `mesh-release-tagger.yml` workflow will automatically:
- Update mesh registry to v2.1.0
- Commit mesh changes
- Create release notes
- Publish to GitHub Releases

### 3. Promote to Production (Provider Only)
```
Go to Actions → Role-Aware Release Promotion
Select environment: prod
Run workflow
```

The workflow will:
- Validate LLM Provider role
- Confirm artifacts exist
- Deploy to target environment
- Update sync map

---

## Governance Commands

### Mesh Management
```bash
# View current mesh
npm run governance:mesh

# Bump major version
npm run governance:bump -- 3.0.0

# Increment raft term (on governance event)
npm run governance:raft

# Set snapshot version
npm run governance:snapshot -- 2026.09.01
```

### Release Management
```bash
# Audit licenses
npm run license:audit

# Generate release manifest
npm run release:manifest

# Package release bundle
npm run release:bundle

# Generate hashes
npm run release:hash

# Generate provenance
npm run release:provenance

# All release steps
npm run release:all
```

### Status Checks
```bash
# Check sync status
npm run governance:sync

# All governance checks
make governance-all
```

---

## Troubleshooting

### Role Enforcement Failed
- Check governance.config.json for correct role settings
- Verify repo is listed in org-role-matrix.json
- Confirm llm-certification.json is valid

### Mesh Metadata Missing
- Ensure governance/mesh-registry.json exists
- Check mesh metadata is valid JSON
- Run `npm run governance:mesh` to verify

### Release Promotion Blocked
- Verify repo has LLM Provider role
- Check all release artifacts exist
- Confirm mesh metadata is aligned

### Certification Check Failed
- Validate llm-certification.json structure
- Ensure governance.config.json is present
- Check criteria fields are set to true for certified status

---

## Best Practices

1. **Always run governance checks before release**
   ```bash
   make governance-all
   ```

2. **Keep mesh version aligned with release tags**
   - meshVersion should match semantic version tag

3. **Review certification criteria regularly**
   - Ensure all criteria remain met
   - Update certification.json if criteria change

4. **Maintain license compliance**
   - Add SPDX headers to all new files
   - Include LICENSE in all packages

5. **Synchronize cross-repo changes**
   - Update release-sync-map.json after major changes
   - Confirm Luchii is sync'd before release

---

## Reference

- **Governance Specification**: [governance/GOVERNANCE.md](governance/GOVERNANCE.md)
- **Organization Charter**: [governance/CHARTER.md](governance/CHARTER.md)
- **Release Handbook**: [governance/HANDBOOK.md](governance/HANDBOOK.md)
- **Org Architecture**: [governance/ARCHITECTURE.md](governance/ARCHITECTURE.md)
- **Org Role Matrix**: [governance/org-role-matrix.json](governance/org-role-matrix.json)
