# Frasberg SDK — Issue Triage Protocol

---

## 1. Intake

Every issue enters through GitHub and must be evaluated within the SLA window.

During intake, maintainers check:
- Completeness of the report
- Reproducibility
- Severity
- Category
- Impact
- Whether it aligns with existing issues

If incomplete, the maintainer requests clarification.

---

## 2. Classification

Issues fall into one of the following categories:

### A. Bug
- Incorrect behavior
- Broken functionality
- Unexpected errors
- Provider mismatch
- Regression

### B. Feature Request
- New capability
- Enhancement
- Optional extension

### C. Documentation
- Missing docs
- Incorrect docs
- Outdated examples

### D. Provider Issue
- Provider outage
- Provider API change
- Provider inconsistency

### E. Security
- Vulnerability
- Unsafe behavior
- Dependency risk

### F. Governance / Process
- Workflow issues
- CI/CD problems
- Contribution friction

---

## 3. Severity Levels

### Critical
- Security vulnerabilities
- Broken builds
- Provider outages
- Data exposure
- Severe regressions

**Action:** Assigned immediately, maintainer takes ownership, patch release required

### High
- Major bugs
- Broken features
- Incorrect provider behavior

**Action:** Assigned within 48 hours, added to next patch or minor release

### Medium
- Minor bugs
- Documentation gaps
- Non-breaking inconsistencies

**Action:** Added to backlog, scheduled in roadmap

### Low
- Typos
- Minor enhancements
- Cosmetic issues

**Action:** Tagged as "good first issue" if appropriate, open to contributors

---

## 4. Routing

| Severity | Assignment | Timeline | Release |
|----------|------------|----------|---------|
| Critical | Immediate | < 24 hours | Patch (emergency) |
| High | 48 hours | < 1 week | Next patch/minor |
| Medium | Backlog | Scheduled | Roadmap-driven |
| Low | Community | Open-ended | Opportunistic |

---

## 5. Verification

Before any issue is accepted:
- [ ] Maintainer reproduces the problem
- [ ] Confirms environment
- [ ] Confirms provider behavior
- [ ] Confirms expected vs actual behavior

If not reproducible, issue is returned for clarification.

---

## 6. Labels

Every triaged issue receives:
- **Category label:** bug, feature, docs, provider, security, governance
- **Severity label:** critical, high, medium, low
- **Status label:** triage, accepted, in-progress, blocked, resolved
- **Optional:** good-first-issue, help-wanted, breaking-change

---

## 7. Communication

Maintainers must:
- Respond to new issues within 48 hours
- Provide clear next steps
- Set realistic expectations
- Keep the reporter updated

**Transparency and respect are non-negotiable.**

---

This protocol ensures every issue receives intentional attention and systematic resolution.
