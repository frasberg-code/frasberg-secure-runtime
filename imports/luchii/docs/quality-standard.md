# Frasberg AI Quality Standard

## Code Quality
- No failing code quality **Errors** allowed on protected branches.
- Warnings and Notes should be addressed when practical.
- All code must be readable, documented, and consistent with project style.

## CI/CD Pre-Deploy Gates
- Unit tests: `pytest`
- Linting: `flake8 .`
- Type checks: `mypy .`
- API contract tests: `pytest tests/test_api.py -k model_name`

## Runtime Guardrails
- Python runtime in CI must be pinned to `3.11` using `actions/setup-python@v5`.
- Deploy steps must be guarded with `if: success()`.

## Testing
- Unit tests are required for all core logic.
- Coverage thresholds are optional policy controls and may be enforced by ruleset.
- Critical paths must have explicit tests.

## Security
- No known high or critical vulnerabilities.
- Secret scanning must be clean.
- Code scanning (CodeQL) must pass.
- Deployment secrets must be stored as environment-scoped secrets only.

## Governance
- Changes affecting governance, safety, or legal docs must:
  - Go through PR review.
  - Be tagged with `governance` or `legal`.
  - Reference relevant constitutions or policies.

## Documentation
- Public-facing APIs must have up-to-date docs.
- Major changes require README and API reference updates.

## Enforcement
Quality gates are enforced via:
- GitHub Rulesets
- CI/CD pipelines
- Governance review for high-impact changes
