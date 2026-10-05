# Frasberg AI CI/CD Quality Gate Blueprint

## Workflow Mapping

### Deploy Workflows
- `prod-deploy.yml`
  - Trigger: push to `main`
  - Environment: `production`
- `staging-deploy.yml`
  - Trigger: push to `staging`
  - Environment: `staging`
- `dev-deploy.yml`
  - Trigger: push to `dev`
  - Environment: `development`

### Required Deploy Workflow Permissions
```yaml
permissions:
  contents: write
  deployments: write
```

### Required Deploy Workflow Secrets
- Production
```yaml
env:
  FRASBERGAI_API_KEY: ${{ secrets.FRASBERGAI_API_KEY }}
  FRASBERGAI_MODEL_TOKEN: ${{ secrets.FRASBERGAI_MODEL_TOKEN }}
  FRASBERGAI_DB_URL: ${{ secrets.FRASBERGAI_DB_URL }}
  FRASBERGAI_DEPLOY_KEY: ${{ secrets.FRASBERGAI_DEPLOY_KEY }}
```
- Staging
```yaml
env:
  FRASBERGAI_API_KEY: ${{ secrets.FRASBERGAI_API_KEY }}
  FRASBERGAI_MODEL_TOKEN: ${{ secrets.FRASBERGAI_MODEL_TOKEN }}
  FRASBERGAI_DB_URL: ${{ secrets.FRASBERGAI_DB_URL }}
  FRASBERGAI_STAGING_DEPLOY_KEY: ${{ secrets.FRASBERGAI_STAGING_DEPLOY_KEY }}
```
- Development
```yaml
env:
  FRASBERGAI_API_KEY: ${{ secrets.FRASBERGAI_API_KEY }}
  FRASBERGAI_MODEL_TOKEN: ${{ secrets.FRASBERGAI_MODEL_TOKEN }}
  FRASBERGAI_DB_URL: ${{ secrets.FRASBERGAI_DB_URL }}
  FRASBERGAI_DEV_DEPLOY_KEY: ${{ secrets.FRASBERGAI_DEV_DEPLOY_KEY }}
```

## Deploy Quality Gates

### Pre-Deploy Checks (All Deploy Workflows)
```yaml
- name: Run tests
  run: pytest
- name: Lint
  run: flake8 .
- name: Type check
  run: mypy .
```

### Contract and Schema Gates
- Run API contract tests from `tests/test_api.py`.
- Include `model/token` request validation checks (`model_name` required).
- Validate OpenAPI schema consistency with `python scripts/check_openapi.py`.

### Deploy Execution Rule
```yaml
- name: Deploy
  if: success()
  run: bash scripts/deploy.sh <environment>
```

## Deployment Security Standard

### Secrets
- Store deployment secrets only in GitHub Environment secrets.
- Required secret families:
  - `FRASBERGAI_API_KEY`
  - `FRASBERGAI_MODEL_TOKEN`
  - `FRASBERGAI_DB_URL`
  - `FRASBERGAI_*_DEPLOY_KEY`

### Token Policy
- Deploy keys must be fine-grained.
- Keys must be repository-scoped.
- Keys should expire every 90 days.
- Permissions should stay minimal:
  - `contents` read/write
  - `deployments` read/write
  - `metadata` read

### Environment Policy
- Allowed environments only:
  - `development`
  - `staging`
  - `production`
- Each environment should maintain:
  - At least one protection rule.
  - At least three secrets.
  - At least four environment variables.

### Access Policy
- `production`: require reviewer approvals.
- `staging`: approvals optional but recommended.
- `development`: no approval required, but branch protection still enforced.

## Branch Protection Rules

### main (production)
- Require pull requests.
- Require status checks.
- Prevent force pushes.
- Prevent deletions.
- Optional: require linear history.

### staging
- Require pull requests.
- Require status checks.
- Prevent force pushes.
- Prevent deletions.

### dev
- Prevent force pushes.
- Prevent deletions.
- Optional: require status checks.

## Environment Routing Rules
- `development` deploys from `dev` only.
- `staging` deploys from `staging` only.
- `production` deploys from `main` only.
- Each deploy workflow job must target exactly one environment.
- Do not reference removed or non-existent environments (such as `copilot`).

## Multi-Region Deployment Matrix (Future)

### Regions
- Region A: `us-west-2` (primary)
- Region B: `us-east-1` (secondary)
- Region C: `eu-central-1` (future)

### Environment Routing
| Environment | Region | Database | Traffic Role |
| --- | --- | --- | --- |
| development | us-west-2 | dev DB | internal only |
| staging | us-west-2 | staging DB | pre-prod testing |
| production | us-west-2 | prod DB | primary live |
| production | us-east-1 | prod replica | failover / DR |
