# CI/CD Fix - npm to pnpm Migration

## Issue

CI workflows were failing with:
```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

## Root Cause

The repository was converted to a pnpm workspace with `workspace:*` protocol dependencies in `package.json`, but the CI workflow `.github/workflows/codex-ci.yml` was still using `npm ci` which doesn't support the pnpm workspace protocol.

## Solution

Updated `.github/workflows/codex-ci.yml` to use pnpm instead of npm:

### Changes Made

1. **Added pnpm setup step** to all jobs:
   ```yaml
   - name: Setup pnpm
     uses: pnpm/action-setup@v2
     with:
       version: 8
   ```

2. **Updated Node.js setup cache** from `npm` to `pnpm`:
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       cache: 'pnpm'  # Changed from 'npm'
   ```

3. **Replaced npm commands** with pnpm equivalents:
   - `npm ci` → `pnpm install`
   - `npm test` → `pnpm test`
   - `npm run test:codex` → `pnpm run test:codex`
   - `npx tsc` → `pnpm exec tsc`

### Affected Jobs

- ✅ Test Codex Architecture (Node 18.x, 20.x)
- ✅ Lint TypeScript
- ✅ Build Project

## Verification

All workflows now consistently use pnpm:
- `.github/workflows/build.yml` - Already using pnpm ✅
- `.github/workflows/codex-ci.yml` - Updated to use pnpm ✅
- `.github/workflows/ci.yml` - No package manager needed ✅

## Expected Result

CI builds should now pass successfully as pnpm can properly handle `workspace:*` dependencies.
