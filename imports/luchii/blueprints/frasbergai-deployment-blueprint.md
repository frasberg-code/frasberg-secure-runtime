# FrasbergAI / Luchii Final Deployment Governance Pack

## 1. Branch Protection Rules

### main -> production
- Require pull request.
- Allow merge methods: squash, rebase.
- Require 2 reviewers.
- Dismiss stale approvals on push.
- Require code owner review.
- Require resolved conversations.
- Require status checks:
  - ci
  - test-suite
  - lint
- Require signed commits.
- Require linear history.
- Block force pushes.
- Block branch deletion.
- Production environment approval required.

### dev -> development
- Require pull request.
- Allow merge methods: squash, merge, rebase.
- Require 1 reviewer.
- Dismiss stale approvals on push.
- Require resolved conversations.
- Require status checks:
  - ci
  - unit-tests
- Block force pushes.
- Block branch deletion.
- No approval required.

### feature/* -> active development
- Block force pushes.
- Block branch deletion.

Direct-push restrictions are typically configured through GitHub bypass
permissions or branch push restrictions, not a standalone `restrict_pushes`
ruleset object.

## 2. Environment Routing Policy

### development environment
- Branch: dev.
- Workflow: dev-deploy.yml.
- Secrets:
  - FRASBERGAI_API_KEY
  - FRASBERGAI_MODEL_TOKEN
  - FRASBERGAI_DB_URL
  - FRASBERGAI_DEV_DEPLOY_KEY
- Variables:
  - ENVIRONMENT=development
  - MODEL_NAME=LUCHII
  - FRASBERGAI_VERSION=v1
  - REGION=us-west-2

### staging environment
- Branch: staging.
- Workflow: staging-deploy.yml.
- Secrets:
  - FRASBERGAI_API_KEY
  - FRASBERGAI_MODEL_TOKEN
  - FRASBERGAI_DB_URL
  - FRASBERGAI_STAGING_DEPLOY_KEY
- Variables:
  - ENVIRONMENT=staging
  - MODEL_NAME=LUCHII
  - FRASBERGAI_VERSION=v1
  - REGION=us-west-2

### production environment
- Branch: main.
- Workflow: prod-deploy.yml.
- Secrets:
  - FRASBERGAI_API_KEY
  - FRASBERGAI_MODEL_TOKEN
  - FRASBERGAI_DB_URL
  - FRASBERGAI_DEPLOY_KEY
- Variables:
  - ENVIRONMENT=production
  - MODEL_NAME=LUCHII
  - FRASBERGAI_VERSION=v1
  - REGION=us-west-2

### Routing rules
- dev -> development.
- staging -> staging.
- main -> production.
- No workflow may reference copilot or any non-existent environment.

## 3. Multi-Region Deployment Matrix

### Regions
- Primary: us-west-2.
- Secondary: us-east-1.
- Future: eu-central-1.

### Matrix
| Environment | Region | Role | DB / Data |
| --- | --- | --- | --- |
| development | us-west-2 | internal testing | dev DB |
| staging | us-west-2 | pre-prod | staging DB |
| production | us-west-2 | primary live | prod DB primary |
| production | us-east-1 | failover / DR | prod DB replica |

### Variables for multi-region
- REGION=us-west-2 or us-east-1.
- FRASBERGAI_DB_URL_<REGION>.
- LUCHII_ENDPOINT_<REGION>.

### Workflow matrix (optional future)
```yaml
strategy:
  matrix:
    region: [us-west-2, us-east-1]

env:
  REGION: ${{ matrix.region }}
```

## 4. CI/CD Quality Gate Standard

### Pre-deploy gates
- Unit tests: pytest.
- Linting: flake8 .
- Type checks: mypy .
- API contract tests:
  - pytest tests/test_api.py -k model_name
  - Ensures 422 behavior + required model_name stays correct.

### Python setup hardening
```yaml
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.11"
```

### Deploy guard
```yaml
- name: Deploy
  if: success()
  run: ./deploy.sh <environment>
```

### Optional
- Coverage threshold.
- Post-deploy smoke tests.

## 5. Deployment Security Standard

### Automation token
- Fine-grained.
- Repo-scoped.
- Name: FRASBERGAI_AUTOMATION_TOKEN.
- Permissions:
  - Contents: Read & Write
  - Actions: Read & Write
  - Metadata: Read
  - Optional: Packages: Read & Write
- No admin scopes.
- No org scopes.
- No delete scopes.

### Secrets
- Store in Environment Secrets only:
  - FRASBERGAI_API_KEY
  - FRASBERGAI_MODEL_TOKEN
  - FRASBERGAI_DB_URL
  - FRASBERGAI_DEV_DEPLOY_KEY
  - FRASBERGAI_STAGING_DEPLOY_KEY
  - FRASBERGAI_DEPLOY_KEY

### Environment protection
- Production requires approval.
- Staging optional approval.
- Dev no approval but protected from force-push/deletion.
