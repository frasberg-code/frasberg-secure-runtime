# Frasberg AI — Post-Rebrand Verification Checklist

**Repository:** `FrasbergAI/frasberg`  
**Version:** 7.0.0+  
**Last Updated:** 2026-08-10  
**Status:** ✅ All automated checks passing

This document is the canonical acceptance checklist confirming the Sofia → Frasberg rebrand is complete and the repository is fully aligned.

---

## 1. Brand Text Cleanup

- [x] No `Sofia`, `sofia`, `SOFIA`, or `Sofia Core` references remain in any tracked source, config, or doc file
- [x] No `sofia-core` package or import references remain
- [x] All package scopes use `@frasberg/*`
- [x] All environment variables use `FRASBERG_*` prefix
- [x] Creator attribution is set to Frasberg AI

---

## 2. Repository Slug & URL Alignment

**Canonical repo:** `https://github.com/FrasbergAI/frasberg`

- [x] `REBRANDING_COMPLETE.md` — GitHub settings URL updated to `FrasbergAI/frasberg`
- [x] `GITHUB_SETTINGS_WEB_UI_GUIDE.md` — all step URLs updated to `FrasbergAI/frasberg`
- [x] `CONTRIBUTING.md` — `git clone` / `cd` instructions use `frasberg` repo name
- [x] `MONTH_1_COMPLETE.md` — `cd` command references updated
- [x] `CHANGELOG_v5.0.0.md` — `cd` command references updated
- [x] `CURRENT_STATUS.md` — workspace path updated
- [x] `READY_TO_LAUNCH_v6.0.0.md` — workspace path updated
- [x] `README_CODEX.md` — directory tree updated
- [x] `marketing/landing/HOMEPAGE.md` — `cd` commands updated
- [ ] **MANUAL** — GitHub repository "About" description updated via Settings UI
- [ ] **MANUAL** — GitHub repository visibility set as desired (private if required)

---

## 3. Path & Directory Structure

- [x] No duplicated `supabase/supabase/...` nested paths exist in tracked files
- [x] Canonical directory is `supabase/frasberg_ai/` (not `supabase/sofia_core/` or `supabase/frasberg_core/`)
- [x] `supabase/frasberg_ai/frasberg_ai_application_shell/app_shell_manifest.json` is valid JSON
- [x] CI workflow `ci.yml` validates the correct `supabase/frasberg_ai/` structure

---

## 4. Verification Docs Consistency

All of the following docs agree on `FrasbergAI/frasberg` as the canonical repo and `frasberg_ai` as the canonical module prefix:

- [x] `REBRANDING_COMPLETE.md`
- [x] `DEPLOYMENT_VERIFICATION_CHECKLIST.md`
- [x] `DEPLOYMENT_STATUS.md`
- [x] `QUICK_REFERENCE.md`
- [x] `IMPLEMENTATION_COMPLETE.md`
- [x] `RELEASE_NOTES.md`
- [x] `RELEASE_NOTES_v7.0.0.md`
- [x] `CODE_CHANGES_VERIFICATION.md`
- [x] `README.md`
- [x] `VERIFICATION_CHECKLIST.md` (this file)

---

## 5. Open PR Cleanup

| PR | Status | Action |
|----|--------|--------|
| #105 | dirty/draft | Close as duplicate — superseded by this canonical PR |
| #106 | dirty/draft | Close as duplicate — superseded by this canonical PR |
| #107 | dirty/draft | Close as duplicate — superseded by this canonical PR |

**One canonical PR** (this work) contains all alignment fixes in a clean, mergeable branch. The three overlapping draft PRs should be closed after this PR is merged.

---

## 6. CI / Build Health

- [x] `build.yml` workflow passes — pnpm build + governance engine tests
- [x] `ci.yml` workflow passes — `supabase/frasberg_ai/` directory structure validated
- [x] `app_shell_manifest.json` is valid JSON (CI-checked)
- [x] Python tests (`pytest`) pass with ≥70% coverage
- [x] TypeScript type-check (`pnpm typecheck`) passes

---

## 7. Final Acceptance Criteria

The repository is considered **fully aligned** when all items above are checked, and:

1. This PR is merged to `main`
2. PRs #105, #106, and #107 are closed as duplicates
3. The two manual GitHub Settings steps (About description + visibility) are completed by a repo admin

---

## Known Intentional Exceptions

- `FRASBERG_CONFIGURATION.md` Supabase function URL contains `frasberg-ai-backend` as the **deployed function name** — this is the live Supabase Edge Function endpoint name and must not be changed here without a corresponding Supabase deployment rename.
- `release/` subdirectory contains historical release snapshots; legacy naming within those archives is preserved intentionally.
