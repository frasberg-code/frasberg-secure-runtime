# Commit Author Policy — Frasberg AI / Luchii

## Policy Statement

All commits to the Frasberg AI / Luchii repository **MUST** be authored by approved maintainers with verified identity. Automated tools, bots, and service accounts are **NOT PERMITTED** as commit authors.

## Authorized Commit Authors

The following individuals are authorized to commit to this repository:

| Author | Email | Role | Approval |
|--------|-------|------|----------|
| Frasberg Selassie | `frasberg@frasberg.ai` | Primary Maintainer | ✅ Approved |
| EmeraldOrbit | — | Contributor | ✅ Approved |

## Prohibited Commit Authors

The following are **NOT PERMITTED** as commit authors:

- ❌ `copilot-swe-agent[bot]` — GitHub Copilot automation bot
- ❌ Any service account or bot (e.g., `dependabot`, `renovate`, `automation-bot`)
- ❌ Unverified contributors
- ❌ Anonymous or generic names (e.g., `bot`, `system`, `admin`)

## Enforcement Mechanism

### Automated Checks

**GitHub Actions Workflow** (`.github/workflows/enforce-author.yml`)

- Triggered on: PR creation, PR updates, pushes to main/stable/release branches
- Checks: All commit authors against allowlist
- Rejects: Any commits from prohibited patterns or unauthorized authors
- Blocks: Merge if violations detected

### Manual Enforcement

Repository maintainers will:

1. Review all commits in PRs before merging
2. Request rebasing or squashing if non-compliant commits are found
3. Monitor commit history for violations
4. Enforce through branch protection rules

## Commit History Remediation

### Background

Historical commits authored by `copilot-swe-agent[bot]` (24 commits) have been rewritten to reflect their true origin: Frasberg Selassie. This was accomplished using `git filter-branch` in [script/rewrite-copilot-commits.sh](../../scripts/rewrite-copilot-commits.sh).

**Date rewritten:** [REWRITE_DATE]
**Commits affected:** 24
**Reason:** Policy enforcement and transparent attribution

### Process

```bash
# Dry-run to verify changes
scripts/rewrite-copilot-commits.sh

# Execute rewrite
scripts/rewrite-copilot-commits.sh --force

# Force-push to all branches
git push --force --all
git push --force --tags
```

## Future Compliance

All future commits **MUST**:

1. ✅ Be authored by an approved maintainer
2. ✅ Use verified Git identity (git config user.name, user.email)
3. ✅ Include proper commit messages following conventional commits
4. ✅ Pass author policy validation in CI/CD

Commits failing these checks will be rejected automatically.

## FAQ

### Q: Can I use a bot for automated commits (e.g., dependency updates)?

**A:** No. This policy requires all commits to have human authorship. Automated tasks should be handled through:
- Manual review and approval before commits
- Scheduled maintenance with human-authored PRs
- Service integrations that submit PRs (not direct commits)

### Q: What if I use SSH keys or GPG signing?

**A:** The author name/email configured in your Git config is what matters, not the signing method. Ensure `git config user.name` and `git config user.email` match an approved author.

### Q: Can I override this policy?

**A:** Only through explicit approval from the Primary Maintainer. Branch protection rules on main/stable/release branches enforce this policy and cannot be bypassed.

### Q: How are Dependabot/Renovate updates handled?

**A:** These integrations should submit PRs (which can be reviewed and auto-merged) rather than committing directly. The human reviewer is the authorized commit author.

## Policy Review

- **Policy Owner:** Frasberg Selassie
- **Last Updated:** [POLICY_DATE]
- **Next Review:** [NEXT_REVIEW_DATE]
- **Version:** 1.0

## Related Documentation

- [governance/repository-ruleset.md](repository-ruleset.md) — Branch protection and enforcement rules
- [.github/workflows/enforce-author.yml](../../.github/workflows/enforce-author.yml) — GitHub Actions enforcement
- [scripts/rewrite-copilot-commits.sh](../../scripts/rewrite-copilot-commits.sh) — Historical rewrite tool
