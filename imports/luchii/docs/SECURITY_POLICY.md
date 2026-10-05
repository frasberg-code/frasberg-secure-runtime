# FrasbergAI / Luchii - Security Policy

## 1. Purpose
This policy defines the security controls for CI/CD, secrets, tokens, environments, and deployment operations for the Luchii AI Model.

## 2. Token Security

### Automation Token
Name: `FRASBERGAI_AUTOMATION_TOKEN`
Type: Fine-grained, repo-scoped

Permissions:
- Contents: Read & Write
- Actions: Read & Write
- Metadata: Read
- Optional: Packages: Read & Write

Prohibited:
- `admin:org`
- `admin:org_hook`
- `delete_repo`
- `delete:packages`
- Any org-level permissions

Token must be stored only in:
- Repository Secrets
- Never in code, workflows, or environment variables

## 3. Secrets Management
All secrets must be stored in Environment Secrets, never in repository secrets unless environment-agnostic.

Required secrets per environment:
- `FRASBERGAI_API_KEY`
- `FRASBERGAI_MODEL_TOKEN`
- `FRASBERGAI_DB_URL`
- Environment-specific deploy key:
  - `FRASBERGAI_DEV_DEPLOY_KEY`
  - `FRASBERGAI_STAGING_DEPLOY_KEY`
  - `FRASBERGAI_DEPLOY_KEY`

Secrets must never be logged or echoed.

## 4. Environment Protection

### production
- Mandatory approval before deployment
- Restricted deployers
- Audit logging enabled
- Block force-push and deletion on `main`

### staging
- Optional approval
- Block force-push and deletion on `staging`

### development
- No approval
- Block force-push and deletion on `dev`

## 5. Workflow Security
All deploy workflows must use:

```yaml
permissions:
  contents: write
  deployments: write
```

- No workflow may write to other repositories.
- No workflow may reference deprecated environments.
- No workflow may run on `main` unless it is production deploy.

## 6. Code Integrity
- All merges into `main` and `staging` require PRs.
- All merges require passing status checks.
- Linear history enforced on `main`.

## 7. Multi-Region Security
- Region variables must be environment-scoped.
- DB URLs must be region-specific.
- Failover region (`us-east-1`) must use read-only replicas unless failover is active.
