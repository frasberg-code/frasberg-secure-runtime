# FrasbergAI / Luchii - Deployment Governance

## 1. Purpose
This document defines the governance, routing, quality gates, and operational rules for deploying the Luchii AI Model across development, staging, and production environments. It ensures consistency, safety, auditability, and predictable behavior across all CI/CD workflows.

## 2. Branch -> Environment Mapping

| Branch | Environment | Workflow | Purpose |
| --- | --- | --- | --- |
| `dev` | development | `dev-deploy.yml` | Integration, internal testing |
| `staging` | staging | `staging-deploy.yml` | Pre-production validation |
| `main` | production | `prod-deploy.yml` | Live production deployment |

Routing is strict. No workflow may deploy to an environment other than the one mapped above.

## 3. Environment Configuration

### development
- Secrets:
  - `FRASBERGAI_API_KEY`
  - `FRASBERGAI_MODEL_TOKEN`
  - `FRASBERGAI_DB_URL`
  - `FRASBERGAI_DEV_DEPLOY_KEY`
- Variables:
  - `ENVIRONMENT=development`
  - `MODEL_NAME=LUCHII`
  - `FRASBERGAI_VERSION=v1`
  - `REGION=us-west-2`
- Approvals: none
- Protection: block force-push/deletion on `dev`

### staging
- Secrets:
  - `FRASBERGAI_API_KEY`
  - `FRASBERGAI_MODEL_TOKEN`
  - `FRASBERGAI_DB_URL`
  - `FRASBERGAI_STAGING_DEPLOY_KEY`
- Variables:
  - `ENVIRONMENT=staging`
  - `MODEL_NAME=LUCHII`
  - `FRASBERGAI_VERSION=v1`
  - `REGION=us-west-2`
- Approvals: optional
- Protection: block force-push/deletion on `staging`

### production
- Secrets:
  - `FRASBERGAI_API_KEY`
  - `FRASBERGAI_MODEL_TOKEN`
  - `FRASBERGAI_DB_URL`
  - `FRASBERGAI_DEPLOY_KEY`
- Variables:
  - `ENVIRONMENT=production`
  - `MODEL_NAME=LUCHII`
  - `FRASBERGAI_VERSION=v1`
  - `REGION=us-west-2`
- Approvals: required
- Protection: block force-push/deletion on `main`

## 4. CI/CD Quality Gates
All deploy workflows must pass:
- Unit tests (`pytest`)
- Linting (`flake8 .`)
- Type checks (`mypy .`)
- API contract tests (`pytest tests/test_api.py -k model_name`)

Python version consistency:

```yaml
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.11"
```

Deploy only runs if all gates succeed:

```yaml
if: success()
```

## 5. Multi-Region Deployment Matrix
Primary region: `us-west-2`
Secondary region: `us-east-1`
Future region: `eu-central-1`

| Environment | Region | Role | DB |
| --- | --- | --- | --- |
| development | us-west-2 | internal testing | dev DB |
| staging | us-west-2 | pre-prod | staging DB |
| production | us-west-2 | primary | prod DB primary |
| production | us-east-1 | failover | prod DB replica |

## 6. Workflow Separation
- Deploy workflows are isolated per environment.
- Contributor maintenance workflows cannot trigger on `main` or `staging`.
- No workflow references the deprecated `copilot` environment.

## 7. Governance Enforcement
- Branch protections must be applied before enabling deployments.
- Environment protection rules must be configured before production deploys.
- Secrets must be present before workflow execution.
