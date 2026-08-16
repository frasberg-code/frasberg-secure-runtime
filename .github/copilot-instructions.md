# Copilot Instructions for frasberg

## Repository Overview

Frasberg is a **behavioral governance engine** for the Frasberg platform. It is a **monorepo** combining:

- A **Python FastAPI backend** (`backend/`) with MongoDB for the Frasberg API.
- **TypeScript packages** (`packages/`, `supabase/frasberg/`, `src/`) implementing tonal modulation, hinge logic, membrane protocol, and runtime enforcement modules.
- A **pnpm workspace** for the TypeScript packages.

**Runtimes:** Python 3.11+, Node.js 18+, pnpm 8+

---

## Project Layout

```
.github/           GitHub Actions workflows (build.yml, ci.yml) and templates
backend/           Python FastAPI app
  server.py        Main FastAPI entry point (MongoDB, auth, all REST routes)
  app/             Application modules (core, auth, integrations, etc.)
  requirements.txt All Python dependencies (pinned)
packages/          pnpm workspace TypeScript packages
  frasberg-governance-engine/
  frasberg-tonal-modulation/
  frasberg-membrane-protocol/
  frasberg-hinge-logic/
  frasberg-continuum-identity/
  frasberg-unified-field-runtime/
src/               TypeScript source (engines, pipelines, orchestration)
supabase/frasberg_ai/  Core runtime modules (TypeScript); structure validated by CI
tests/             TypeScript tests (jest) + Python tests (pytest)
  unit/            Python unit tests
  *.test.ts        TypeScript jest tests
jest.config.js     Jest configuration (ESM, ts-jest)
pytest.ini         Pytest configuration (testpaths=tests, coverage≥70%)
tsconfig.json      Root TypeScript config
pnpm-workspace.yaml  Workspace package list
package.json       Root scripts: build, test, typecheck, lint
requirements-test.txt  Python test dependencies (pytest, pytest-asyncio, etc.)
```

---

## Build & Validation

### Python

```bash
# Install dependencies (always do this first)
pip install -r backend/requirements.txt
pip install -r requirements-test.txt

# Run Python tests (requires no live MongoDB — mocked in tests)
pytest

# Lint
flake8 backend/
mypy backend/
```

- Coverage threshold: 70% (`--cov-fail-under=70` in pytest.ini).
- Tests live in `tests/unit/` (Python). Test files match `test_*.py`.

### TypeScript / Node

```bash
# Install dependencies (always run before build or test)
pnpm install

# Build all packages
pnpm build
# or per-package:
cd packages/frasberg-governance-engine && pnpm build

# Run TypeScript (jest) tests
pnpm test                  # all tests matching tests/**/*.test.ts
pnpm test:codex            # tests/codex_architecture only
pnpm test:packages         # runs pnpm test in each workspace package

# Type check (no emit)
pnpm typecheck             # runs tsc --noEmit

# Lint
pnpm lint                  # runs pnpm lint in each workspace package
```

- Tests use ESM via `ts-jest`. The `moduleNameMapper` strips `.js` extensions.
- Ignored test paths: `tests/frasberg_application_shell/execution/` and `.../pipeline/`.

---

## CI Workflows

Two workflows run on pull requests:

1. **`build.yml`** (on every push/PR): installs pnpm, builds packages, runs governance engine tests.
2. **`ci.yml`** (on PRs touching `src/**`, `supabase/frasberg/**`, `tests/**`, `tsconfig.json`):
   - Validates that all required directories under `supabase/frasberg/` exist.
   - Validates `supabase/frasberg/frasberg_application_shell/app_shell_manifest.json` is valid JSON.
   - **Never remove or rename directories under `supabase/frasberg/`** without updating `ci.yml`.

---

## Code Style

- **Python**: PEP 8, type hints required, max line length 120, docstrings on all functions.
- **TypeScript**: strict mode enabled (`"strict": true` in tsconfig). Use ESM imports.
- PR title format: `feat:`, `fix:`, `docs:`, `test:`.

---

## Environment

- Copy `.env.example` to `.env` and fill in `MONGO_URL`, `DB_NAME`, `JWT_SECRET` before running the backend server.
- Backend server entry point: `python backend/server.py` (runs on port 8001).
- Optional integrations (Hugging Face, W&B, MLflow, Prefect, Dagster) are **not** in `requirements.txt` — install separately if needed.

---

## Key Dependencies

- **Python**: FastAPI, Motor (async MongoDB), Pydantic v2, python-jose, passlib[bcrypt], uvicorn.
- **TypeScript**: ts-jest, jest, typescript 5, express.

Trust these instructions. Only search the codebase if specific information here is incomplete or appears incorrect.
