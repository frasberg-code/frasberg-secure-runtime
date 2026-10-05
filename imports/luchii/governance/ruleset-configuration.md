# FrasbergAI / Luchii Branch Rulesets + Environments (Final)

Repository: `FrasbergAI/luchii`
Date finalized: `2026-07-12`

This document defines the repository ruleset baseline for branch protection,
environment routing, deployment protections, and check naming.

## 1) Branch Rulesets

GitHub rulesets should target `branch` and use `conditions.ref_name.include`
branch patterns such as `main`, `dev`, and `feature/*`.

### Ruleset: `Protect main`

```json
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": ["squash", "rebase"],
        "dismiss_stale_reviews_on_push": true,
        "dismissal_restriction": {
          "enabled": false,
          "allowed_actors": []
        },
        "require_code_owner_review": true,
        "require_last_push_approval": false,
        "required_approving_review_count": 2,
        "required_review_thread_resolution": true,
        "required_reviewers": []
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "Core CI (tests, lint, mypy)", "integration_id": null },
          { "context": "Production Deploy", "integration_id": null }
        ],
        "strict_required_status_checks_policy": true
      }
    },
    { "type": "required_signatures" },
    { "type": "required_linear_history" },
    { "type": "deletion" },
    { "type": "non_fast_forward" }
  ]
}
```

### Ruleset: `Protect dev`

```json
{
  "name": "Protect dev",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["dev"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": ["squash", "merge", "rebase"],
        "dismiss_stale_reviews_on_push": true,
        "dismissal_restriction": {
          "enabled": false,
          "allowed_actors": []
        },
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_approving_review_count": 1,
        "required_review_thread_resolution": true,
        "required_reviewers": []
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "Core CI (tests, lint, mypy)", "integration_id": null },
          { "context": "Dev Deploy", "integration_id": null }
        ],
        "strict_required_status_checks_policy": true
      }
    },
    { "type": "deletion" },
    { "type": "non_fast_forward" }
  ]
}
```

### Ruleset: `Protect feature branches`

```json
{
  "name": "Protect feature branches",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["feature/*"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" }
  ]
}
```

### UI mapping

- **Target branches** -> `main`, `dev`, `feature/*`
- **Require a pull request before merging** -> `pull_request`
- **Required approvals** -> `required_approving_review_count`
- **Dismiss stale approvals** -> `dismiss_stale_reviews_on_push`
- **Require code owner review** -> `require_code_owner_review`
- **Require conversation resolution** -> `required_review_thread_resolution`
- **Require status checks** -> `required_status_checks`
- **Require signed commits** -> `required_signatures`
- **Require linear history** -> `required_linear_history`
- **Block force pushes** -> `non_fast_forward`
- **Block deletions** -> `deletion`

### Important implementation caveat

For branch-specific direct-push restrictions, GitHub typically models the control
through bypass permissions or branch push restrictions rather than a standalone
`restrict_pushes` rule object in the minimal ruleset schema shown above.

## 2) Environments

Create and maintain exactly these environments:

- `development`
- `staging`
- `production`

### Environment Secrets

#### development
- `FRASBERGAI_API_KEY`
- `FRASBERGAI_MODEL_TOKEN`
- `FRASBERGAI_DB_URL`
- `FRASBERGAI_DEV_DEPLOY_KEY`

#### staging
- `FRASBERGAI_API_KEY`
- `FRASBERGAI_MODEL_TOKEN`
- `FRASBERGAI_DB_URL`
- `FRASBERGAI_STAGING_DEPLOY_KEY`

#### production
- `FRASBERGAI_API_KEY`
- `FRASBERGAI_MODEL_TOKEN`
- `FRASBERGAI_DB_URL`
- `FRASBERGAI_DEPLOY_KEY`

### Environment Variables (all environments)

- `ENVIRONMENT` = (`development` | `staging` | `production`)
- `MODEL_NAME` = `LUCHII`
- `FRASBERGAI_VERSION` = `v1`
- `REGION` = `us-west-2`

### Routing rules
- `dev` -> `development`
- `staging` -> `staging`
- `main` -> `production`
- No workflow may reference `copilot` or any non-existent environment.

## 3) Deployment Protection Rules

### production
- Required reviewers: enabled (1-2 reviewers).
- Required approval before deployment: enabled.
- Restrict deployments to approved users/teams: enabled (recommended).

### staging
- Optional approval (reviewers may be configured and can be made required later).

### development
- No deployment approval required.

## 4) Required Status Check Names (exact)

- `Production Deploy`
- `Staging Deploy`
- `Dev Deploy`
- `Core CI (tests, lint, mypy)`

These names must match GitHub check run names exactly (case-sensitive).

## 5) Policy-as-code application

- Ruleset definitions are stored in:
  - `.github/rulesets/protect-main.json`
  - `.github/rulesets/protect-dev.json`
  - `.github/rulesets/protect-feature-branches.json`
- Apply/update rulesets using workflow:
  - `.github/workflows/apply-branch-rulesets.yml`
- The governance policy check (`.github/policy/check_governance.py`) validates these
  ruleset files exist, are active branch rulesets, and target:
  - `~DEFAULT_BRANCH` for main
  - `dev` for development
  - `feature/*` for feature branches
