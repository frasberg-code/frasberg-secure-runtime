# PHASE 6 — MERGE OPERATOR BLOCK (ARTICLE IV GOVERNED MERGE)
# Frasberg AI — Sovereign Autonomous Governance

> Use this as a single operator checklist in the PR conversation.  
> Execute top-to-bottom with no skipped steps.

## A) PRE-FLIGHT MERGE GATE (HARD STOP IF ANY FAIL)
- [ ] PR is open and targets the default branch
- [ ] PR source branch is `autonomy-governed-docs-update`
- [ ] All required CI checks are green (pytest, flake8, mypy, required repo checks)
- [ ] Branch protection/ruleset requirements are satisfied
- [ ] No merge conflicts
- [ ] Diff is documentation-only (no runtime code changes)
- [ ] No secrets introduced
- [ ] Linear history policy will be preserved
- [ ] Governance/Article IV references present in PR body
- [ ] Override lifecycle references present in PR body/checklist

**If any box above is unchecked: STOP. Resolve before continuing.**

---

## B) GOVERNED MERGE EXECUTION
- [ ] Merge method selected: **Manual governed merge**
- [ ] History strategy selected per ruleset: **Rebase** or **Squash** (linear only)
- [ ] Governed merge commit message confirmed (Article IV aligned)
- [ ] Execute merge to default branch now

Record immediately after merge:
- [ ] `MERGE_COMMIT_SHA = <paste SHA>`
- [ ] `MERGE_TIMESTAMP_ISO8601 = <paste timestamp>`
- [ ] `MERGED_BY = <governance authority/admin>`
- [ ] `PR_URL = <paste PR URL>`

---

## C) POST-MERGE VALIDATION (IMMEDIATE)
- [ ] Merge commit SHA exists on default branch
- [ ] Merged file set matches approved governance docs only
- [ ] No unintended files changed
- [ ] PR status shows **Merged**
- [ ] PR links to final merge commit SHA
- [ ] Governance audit trail updated with SHA + timestamp + authority

---

## D) OVERRIDE REVOCATION & PROTECTION RESTORE
- [ ] Bootstrap override revoked
- [ ] Multi-stage / feature-pattern override revoked
- [ ] Temporary admin bypass removed
- [ ] Branch protection fully restored
- [ ] Required checks re-enforced
- [ ] Confirm no residual bypass/exception remains active

---

## E) REQUIRED PHASE 6 ARTIFACT FINALIZATION
Update/finalize these documents with real merge values:
- [ ] `docs/GOVERNANCE_PR_MERGE_CERTIFICATE.md`
  - [ ] Replace `<insert SHA>` with `MERGE_COMMIT_SHA`
  - [ ] Replace `<ISO8601>` with `MERGE_TIMESTAMP_ISO8601`
  - [ ] Replace `<governance authority>` with `MERGED_BY`
- [ ] `docs/GOVERNANCE_PR_MERGE_ANNOUNCEMENT.md`
  - [ ] Replace `<insert SHA>`
  - [ ] Replace `<ISO8601>`
  - [ ] Replace `<governance authority>`
- [ ] `docs/GOVERNANCE_POST_MERGE_AUTONOMY_STABILIZATION_MEMO.md`
  - [ ] Mark stabilization actions completed with timestamped evidence

---

## F) PHASE 6 EXIT CRITERIA (ALL REQUIRED)
- [ ] Governed merge completed successfully
- [ ] CI + merge-gate compliance preserved through merge
- [ ] Override lifecycle fully revoked
- [ ] Branch protections restored to sovereign lockdown
- [ ] Merge certificate issued and archived
- [ ] Announcement issued and archived
- [ ] Post-merge stabilization memo completed
- [ ] Platform ready to transition to **Phase 7**

---

## OPERATOR SIGN-OFF
- [ ] I confirm all Phase 6 controls were executed in order and validated.
- [ ] I confirm Article IV governance posture remains intact.
- [ ] I authorize transition to Phase 7 — Post-Merge Autonomy Stabilization.

**Signed:** `<operator name>`  
**Timestamp (ISO8601):** `<timestamp>`
