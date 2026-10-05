# FrasbergAI / Luchii - CI/CD Overview

## 1. Purpose
This overview explains how the Luchii CI/CD pipeline works, how code flows through environments, and how deployments are validated and executed.

## 2. Pipeline Flow
1. Developer pushes to `dev`, `staging`, or `main`.
2. GitHub Actions triggers the corresponding workflow:
   - `dev-deploy.yml`
   - `staging-deploy.yml`
   - `prod-deploy.yml`
3. Workflow runs quality gates.
4. If successful:
   - Development deploys automatically.
   - Staging deploys automatically (optional approval).
   - Production deploy requires approval.
5. Deployment script (`deploy.sh`) executes environment-specific logic.

## 3. Workflow Responsibilities

### dev-deploy.yml
- Runs on `dev`
- Deploys to development environment
- Used for integration testing

### staging-deploy.yml
- Runs on `staging`
- Deploys to staging environment
- Used for pre-production validation

### prod-deploy.yml
- Runs on `main`
- Deploys to production environment
- Requires approval

## 4. Quality Gates
Each workflow enforces:
- Python setup (3.11)
- Dependency installation
- Unit tests
- Linting
- Type checks
- API contract tests
- Deploy only if all succeed

## 5. Environment Secrets
Each environment has its own:
- API key
- Model token
- DB URL
- Deploy key

This ensures isolation and prevents cross-environment leakage.

## 6. Multi-Region Awareness
The pipeline supports:
- Primary region: `us-west-2`
- Secondary region: `us-east-1`

Future expansion is supported via region variables.

## 7. Contributor Workflows
Non-deploy workflows (for example, cache clearing) are isolated and cannot trigger on `main` or `staging`.

## 8. Governance Integration
This CI/CD system is governed by:
- Deployment Governance
- Security Policy
- Branch Protection Rules
- Environment Protection Rules

All must be applied before enabling production deploys.
