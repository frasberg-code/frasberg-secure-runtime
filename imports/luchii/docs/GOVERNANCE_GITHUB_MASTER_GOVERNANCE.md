# FrasbergAI / Luchii - GitHub Master Governance

This master file consolidates deployment governance, CI/CD policy, and security controls for GitHub workflows and repository settings.

## 1) Purpose

Define strict, auditable, and consistent deployment behavior across development, staging, and production.

## 2) Branch -> Environment Routing (Strict)

| Branch | Environment | Workflow | Purpose |
| --- | --- | --- | --- |
| `dev` | `development` | `dev-deploy.yml` | Integration and internal testing |
| `staging` | `staging` | `staging-deploy.yml` | Pre-production validation |
| `main` | `production` | `prod-deploy.yml` | Live production deployment |

No workflow may deploy to an environment outside this mapping.

## 3) Environment Configuration

### development

- Required secrets:
  - `FRASBERGAI_API_KEY`
  - `FRASBERGAI_MODEL_TOKEN`
  - `FRASBERGAI_DB_URL`
  - `FRASBERGAI_DEV_DEPLOY_KEY`
- Required variables:
  - `ENVIRONMENT=development`
  - `MODEL_NAME=LUCHII`
  - `FRASBERGAI_VERSION=v1`
  - `REGION=us-west-2`
- Approval: none
- Protection: block force-push/deletion on `dev`

### staging

- Required secrets:
  - `FRASBERGAI_API_KEY`
  - `FRASBERGAI_MODEL_TOKEN`
  - `FRASBERGAI_DB_URL`
  - `FRASBERGAI_STAGING_DEPLOY_KEY`
- Required variables:
  - `ENVIRONMENT=staging`
  - `MODEL_NAME=LUCHII`
  - `FRASBERGAI_VERSION=v1`
  - `REGION=us-west-2`
- Approval: optional
- Protection: block force-push/deletion on `staging`

### production

- Required secrets:
  - `FRASBERGAI_API_KEY`
  - `FRASBERGAI_MODEL_TOKEN`
  - `FRASBERGAI_DB_URL`
  - `FRASBERGAI_DEPLOY_KEY`
- Required variables:
  - `ENVIRONMENT=production`
  - `MODEL_NAME=LUCHII`
  - `FRASBERGAI_VERSION=v1`
  - `REGION=us-west-2`
- Approval: required
- Protection: block force-push/deletion on `main`

## 4) Required CI/CD Quality Gates

All deploy workflows must pass:

- Unit tests: `pytest`
- Linting: `flake8 .`
- Type checks: `mypy .`
- API contract test: `pytest tests/test_api.py -k model_name`

Python version must be pinned:

```yaml
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.11"
```

Deploy must only run after successful gates:

```yaml
if: success()
```

## 5) Multi-Region Deployment and Security Matrix

- Primary region: `us-west-2`
- Secondary region: `us-east-1`
- Future region: `eu-central-1`

| Environment | Region | Role | DB |
| --- | --- | --- | --- |
| development | us-west-2 | internal testing | dev DB |
| staging | us-west-2 | pre-prod | staging DB |
| production | us-west-2 | primary | prod DB primary |
| production | us-east-1 | failover | prod DB replica (read-only unless failover active) |

## 6) Security Policy Requirements

### Automation token

- Name: `FRASBERGAI_AUTOMATION_TOKEN`
- Type: fine-grained, repo-scoped
- Allowed permissions:
  - Contents: Read & Write
  - Actions: Read & Write
  - Metadata: Read
  - Optional: Packages: Read & Write
- Prohibited scopes:
  - `admin:org`
  - `admin:org_hook`
  - `delete_repo`
  - `delete:packages`
  - Any org-level permission
- Storage: repository secrets only; never in code or workflow files.

### Secrets management

- Secrets must be environment-scoped unless explicitly environment-agnostic.
- Secrets must never be echoed or logged.

### Workflow security

All deploy workflows must define:

```yaml
permissions:
  contents: write
  deployments: write
```

- No workflow may write to other repositories.
- No workflow may reference deprecated `copilot` environment.
- No workflow may run on `main` unless it is production deploy.

### Code integrity

- PR required for merges into `main` and `staging`.
- Required status checks must pass before merge.
- Linear history enforced on `main`.

## 7) Workflow Separation Rules

- Deploy workflows are isolated by environment.
- Contributor/maintenance workflows must not trigger on `main` or `staging`.

## 8) Governance Enforcement (Policy-as-Code)

This repository enforces these controls with:

- `.github/workflows/policy-as-code.yml`
- `.github/policy/check_governance.py`

These checks validate:

- branch -> environment mapping
- forbidden triggers and environment usage
- deploy permissions
- Python 3.11 setup
- required quality gates
- no deprecated `copilot` environment references

## 9) Source Documents

- `docs/DEPLOYMENT_GOVERNANCE.md`
- `docs/SECURITY_POLICY.md`
- `docs/CI_CD_OVERVIEW.md`
