# Frasberg Governance Quick Reference

## 🎯 What Was Created

### ✅ Configuration (3 files)
- `governance.config.json` - Repo config with LLM roles
- `governance/mesh-registry.json` - Mesh state & history
- `llm-certification.json` - Certification manifest

### ✅ Documentation (6 files)
- `governance/GOVERNANCE.md` - Tech spec
- `governance/CHARTER.md` - Organization charter
- `governance/HANDBOOK.md` - Release procedures
- `governance/ARCHITECTURE.md` - Org structure
- `GOVERNANCE_GUIDE.md` - Quick start guide
- `GOVERNANCE_IMPLEMENTATION.md` - Summary

### ✅ Automation (4 workflows)
- `frasberg-ci.yml` - License, role, mesh checks
- `role-aware-promotion.yml` - Provider-only promotion
- `mesh-release-tagger.yml` - Automatic mesh tagging
- `llm-cert-check.yml` - Certification validation

### ✅ Tools & Build (3 files)
- `cli/frasberg-governance.js` - CLI tool
- `Makefile` - Make targets
- `package.json` - Updated with 7 scripts

### ✅ Org Governance (2 files)
- `governance/org-role-matrix.json` - All 7 repos
- `release-sync-map.json` - Frasberg ↔ Luchii sync

**Total: 18 core governance files + 1 reference structure file**

---

## 🚀 Quick Commands

```bash
# View mesh status
npm run governance:mesh
make mesh-status

# Bump version (2.1.0)
npm run governance:bump -- 2.1.0
make mesh-bump v=2.1.0

# Increment raft term (governance event)
npm run governance:raft
make mesh-raft

# Check sync status
npm run governance:sync
make sync

# All checks
make governance-all

# Release (after git tag v2.1.0)
# mesh-release-tagger.yml runs automatically
# Then use Actions → Role-Aware Release Promotion
```

---

## 📊 LLM Roles

| Role | Repos | Authority |
|------|-------|-----------|
| **Provider** | Frasberg, Luchii | Define governance; promote releases |
| **Bearer** | Frasberg, LINQ | Enforce identity; consume metadata |
| **Distributor** | sdk-js, sdk-python, sdk-go, sdk-rust | Package; distribute; ensure compliance |

---

## 🔄 Release Flow

```
1. Commit code
2. Push to main (CI validates: license, roles, mesh, tests)
3. Tag v2.1.0 (mesh-release-tagger runs automatically)
4. Click "Run workflow" on role-aware-promotion (Provider only)
5. Select environment (staging or prod)
6. Done! Release published with all governance metadata
```

---

## 📁 File Locations

| Purpose | File |
|---------|------|
| Repo config | `governance.config.json` |
| Mesh state | `governance/mesh-registry.json` |
| Certification | `llm-certification.json` |
| Org matrix | `governance/org-role-matrix.json` |
| Governance spec | `governance/GOVERNANCE.md` |
| Quick start | `GOVERNANCE_GUIDE.md` |
| CLI tool | `cli/frasberg-governance.js` |
| CI workflow | `.github/workflows/frasberg-ci.yml` |
| Promotion | `.github/workflows/role-aware-promotion.yml` |

---

## ✨ Key Features

✅ **Identity-Preserving Governance**
- Behavioral constraints across all systems

✅ **Mesh Versioning**
- meshVersion, raftTerm, snapshotVersion
- Complete audit trail with history

✅ **LLM Role System**
- Provider (Frasberg, Luchii) - define & promote
- Bearer (Frasberg, LINQ) - enforce & consume
- Distributor (SDKs) - package & distribute

✅ **Release Pipeline**
- Automated CI on push/PR
- Role-aware promotion to staging/prod
- Mesh-aware release tagging
- Cross-repo synchronization

✅ **Compliance & Audit**
- License enforcement
- SPDX header validation
- Provenance tracking
- Hash verification

---

## 📚 Documentation Map

For different needs, read:

- **Getting started** → `GOVERNANCE_GUIDE.md`
- **Technical details** → `governance/GOVERNANCE.md`
- **Organization structure** → `governance/ARCHITECTURE.md`
- **Release procedures** → `governance/HANDBOOK.md`
- **Charter & principles** → `governance/CHARTER.md`
- **Org-wide matrix** → `governance/org-role-matrix.json`
- **Implementation details** → `GOVERNANCE_IMPLEMENTATION.md`

---

## 🔗 Next Steps

1. Review files in `governance/` folder
2. Read `GOVERNANCE_GUIDE.md` for quick start
3. Test with `npm run governance:mesh`
4. Commit: `git add . && git commit -m "chore(governance): add org-wide governance"`
5. Push and watch CI run
6. Create Luchii/LINQ/SDK configs based on repo roles
7. Create first release tag to test mesh-release-tagger

---

## 🎓 Learning Path

```
Week 1: Read GOVERNANCE_GUIDE.md + test mesh commands
Week 2: Review governance/GOVERNANCE.md (technical spec)
Week 3: Test CI workflow with a release tag
Week 4: Test role-aware-promotion workflow
Week 5: Configure Luchii/LINQ/SDK repos with same structure
```

---

## 💡 Pro Tips

- Keep mesh version in sync with release tags (v2.1.0 → meshVersion 2.1.0)
- Use `make governance-all` before any release
- Check role alignment before creating releases
- Review `governance/org-role-matrix.json` before adding new repos
- Use `npm run governance:sync` to verify cross-repo state

---

**Frasberg Governance v1.0.0 - Fully Implemented & Ready**
