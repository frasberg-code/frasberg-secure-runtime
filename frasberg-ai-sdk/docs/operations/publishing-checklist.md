# NPM Publishing Checklist

Complete checklist for publishing Frasberg AI SDK to NPM.

## Pre-Publishing Requirements

### Prerequisites

- [ ] Maintainer access to NPM package
- [ ] NPM 2FA configured and enabled
- [ ] Git repository access
- [ ] All changes merged to `main` branch
- [ ] CI/CD pipeline passing

### Environment Setup

```bash
# Verify NPM authentication
npm whoami

# Check registry
npm config get registry
# Should be: https://registry.npmjs.org/

# Verify package access
npm access ls-packages

# Check 2FA status
npm profile get
```

## Pre-Release Checklist

### Code Quality

- [ ] All tests passing locally
  ```bash
  npm test
  ```

- [ ] All tests passing in CI
  ```bash
  # Check GitHub Actions status
  gh run list --branch main --limit 1
  ```

- [ ] Linting passes
  ```bash
  npm run lint
  ```

- [ ] TypeScript compilation succeeds
  ```bash
  npm run build
  ```

- [ ] No TypeScript errors
  ```bash
  tsc --noEmit
  ```

- [ ] Code coverage meets threshold (≥80%)
  ```bash
  npm test -- --coverage
  ```

### Version Management

- [ ] Version number updated in `package.json`
  ```json
  {
    "version": "1.2.0"
  }
  ```

- [ ] Version follows [Semantic Versioning](../governance/versioning.md)
  - Patch: Bug fixes (1.0.x)
  - Minor: New features (1.x.0)
  - Major: Breaking changes (x.0.0)

- [ ] `package-lock.json` updated
  ```bash
  npm install
  ```

- [ ] No uncommitted changes
  ```bash
  git status
  # Should show clean working directory
  ```

### Documentation

- [ ] CHANGELOG.md updated
  ```markdown
  ## [1.2.0] - 2024-02-04
  
  ### Added
  - Feature X
  
  ### Fixed
  - Bug Y
  ```

- [ ] README.md updated (if needed)
  - Version badges
  - Installation instructions
  - New feature documentation

- [ ] API documentation updated
  - JSDoc comments
  - Type definitions
  - Examples

- [ ] Migration guide created (for breaking changes)
  - Create `docs/MIGRATION_v1_to_v2.md`
  - Document all breaking changes
  - Provide migration examples

### Dependencies

- [ ] Dependencies up to date
  ```bash
  npm outdated
  ```

- [ ] No known vulnerabilities
  ```bash
  npm audit
  ```

- [ ] License compliance checked
  ```bash
  npx license-checker --summary
  ```

- [ ] Peer dependencies specified correctly
  ```json
  {
    "peerDependencies": {}
  }
  ```

### Build Validation

- [ ] Clean build directory
  ```bash
  npm run clean
  ```

- [ ] Fresh build created
  ```bash
  npm run build
  ```

- [ ] Build artifacts verified
  ```bash
  ls -la dist/
  # Should contain:
  # - index.js (CJS)
  # - index.mjs (ESM)
  # - index.d.ts (Types)
  # - *.map files
  ```

- [ ] Package contents verified
  ```bash
  npm pack --dry-run
  ```

- [ ] Package size acceptable
  ```bash
  # Check unpacked size
  npm pack --dry-run | grep "Unpacked size"
  # Should be reasonable (< 1MB for SDK)
  ```

### Testing

- [ ] Unit tests pass
  ```bash
  npm test
  ```

- [ ] Integration tests pass
  ```bash
  npm run test:integration
  ```

- [ ] Test in local project
  ```bash
  npm link
  cd /path/to/test-project
  npm link @frasberg/core-sdk
  # Run test scenarios
  ```

- [ ] Test both CJS and ESM imports
  ```javascript
  // CJS
  const { createFrasbergClient } = require('@frasberg/core-sdk');
  
  // ESM
  import { createFrasbergClient } from '@frasberg/core-sdk';
  ```

- [ ] TypeScript types work correctly
  ```bash
  # In test project with TypeScript
  tsc --noEmit
  ```

## Publishing Checklist

### Git Preparation

- [ ] All changes committed
  ```bash
  git status
  ```

- [ ] On correct branch (`main`)
  ```bash
  git branch --show-current
  ```

- [ ] Branch up to date
  ```bash
  git pull origin main
  ```

- [ ] Create git tag
  ```bash
  git tag -a v1.2.0 -m "Release v1.2.0"
  ```

- [ ] Push tag to remote
  ```bash
  git push origin v1.2.0
  ```

### NPM Publishing

- [ ] Login to NPM
  ```bash
  npm login
  # Enter credentials + 2FA code
  ```

- [ ] Verify package.json settings
  ```json
  {
    "name": "@frasberg/core-sdk",
    "version": "1.2.0",
    "private": false,
    "publishConfig": {
      "access": "public"
    }
  }
  ```

- [ ] Publish to NPM
  ```bash
  npm publish --access public
  ```
  
  For beta/pre-release:
  ```bash
  npm publish --tag beta
  ```

- [ ] Verify publication
  ```bash
  npm view @frasberg/core-sdk version
  # Should show new version: 1.2.0
  ```

- [ ] Check NPM page
  ```bash
  open https://www.npmjs.com/package/@frasberg/core-sdk
  ```

- [ ] Test installation
  ```bash
  # In temporary directory
  npm install @frasberg/core-sdk@1.2.0
  ```

### GitHub Release

- [ ] Create GitHub release
  ```bash
  gh release create v1.2.0 \
    --title "v1.2.0" \
    --notes-file RELEASE_NOTES.md
  ```

- [ ] Or via GitHub UI
  1. Go to repository releases
  2. Click "Draft a new release"
  3. Select tag `v1.2.0`
  4. Add title: `v1.2.0`
  5. Copy CHANGELOG content
  6. Attach assets (if any)
  7. Click "Publish release"

- [ ] Verify release appears
  ```bash
  gh release view v1.2.0
  ```

### Post-Publishing

- [ ] Verify package on NPM
  - [ ] README displays correctly
  - [ ] Version is correct
  - [ ] Files are included
  - [ ] Keywords are set

- [ ] Test installation from NPM
  ```bash
  mkdir test-install && cd test-install
  npm init -y
  npm install @frasberg/core-sdk
  node -e "console.log(require('@frasberg/core-sdk'))"
  ```

- [ ] Update dist-tag (if needed)
  ```bash
  # Make version latest
  npm dist-tag add @frasberg/core-sdk@1.2.0 latest
  
  # Or make it beta
  npm dist-tag add @frasberg/core-sdk@1.2.0 beta
  ```

- [ ] Smoke test published package
  ```bash
  # Create test file
  echo "
  const { createFrasbergClient } = require('@frasberg/core-sdk');
  console.log('SDK loaded successfully');
  " > test.js
  
  node test.js
  ```

## Post-Release Checklist

### Communication

- [ ] Announce release internally
  - Team Slack/Discord channel
  - Email to stakeholders
  - Project status update

- [ ] Update project documentation
  - [ ] Project website
  - [ ] Internal wiki
  - [ ] Developer portal

- [ ] Social media (if applicable)
  - Twitter announcement
  - LinkedIn update
  - Blog post

### Repository Maintenance

- [ ] Merge release changes back to `dev`
  ```bash
  git checkout dev
  git merge main
  git push origin dev
  ```

- [ ] Close related issues
  ```bash
  # Close issues fixed in release
  gh issue close 123 --comment "Fixed in v1.2.0"
  ```

- [ ] Update project board
  - Move completed items to "Done"
  - Archive release milestone

- [ ] Close release milestone
  ```bash
  gh issue milestone close "v1.2.0"
  ```

### Monitoring

- [ ] Monitor NPM download stats
  ```bash
  npm view @frasberg/core-sdk
  ```

- [ ] Watch for issues
  - Check GitHub issues
  - Monitor error reports
  - Check user feedback

- [ ] Monitor CI/CD
  - Ensure builds still pass
  - Check for new issues

- [ ] Set up alerts (if not already)
  - NPM download anomalies
  - GitHub issue spikes
  - Security vulnerabilities

### Documentation Updates

- [ ] Update docs site version selector
- [ ] Generate API documentation
  ```bash
  npm run docs:generate
  ```
- [ ] Deploy documentation updates
- [ ] Verify documentation links

## Rollback Procedure

If critical issues are discovered:

### Immediate Actions

- [ ] Assess severity
  - Critical: Immediate action
  - High: Action within 24 hours
  - Medium: Action within week

- [ ] Deprecate problematic version
  ```bash
  npm deprecate @frasberg/core-sdk@1.2.0 "Critical bug, use 1.2.1 instead"
  ```

- [ ] Publish hotfix (if possible)
  ```bash
  # Create hotfix branch
  git checkout -b hotfix/v1.2.1
  
  # Fix issue, bump version
  npm version patch
  
  # Publish hotfix
  npm publish
  ```

- [ ] Update dist-tag
  ```bash
  # Point latest to previous working version
  npm dist-tag add @frasberg/core-sdk@1.1.0 latest
  ```

### Communication

- [ ] Notify users immediately
  - GitHub issue
  - NPM deprecation message
  - Email/Slack announcement

- [ ] Document issue
  - Root cause analysis
  - Impact assessment
  - Remediation steps

- [ ] Post-mortem
  - What went wrong
  - How to prevent
  - Process improvements

## Automation

### GitHub Actions

Consider automating with workflow:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
```

## Security Considerations

- [ ] NPM 2FA enabled
- [ ] Token permissions minimal
- [ ] No secrets in code
- [ ] Verified provenance
- [ ] Signed commits/tags

## Troubleshooting

### Common Issues

**"You do not have permission to publish"**
```bash
# Verify authentication
npm whoami

# Check package access
npm access ls-packages
```

**"Version already published"**
```bash
# Bump version
npm version patch

# Or check current version
npm view @frasberg/core-sdk version
```

**"Invalid 2FA code"**
```bash
# Ensure time is synchronized
# Use authenticator app, not SMS

# Re-login
npm logout
npm login
```

**"Package size too large"**
```bash
# Check what's being included
npm pack --dry-run

# Update .npmignore
echo "tests/" >> .npmignore
echo "docs/" >> .npmignore
```

## Related Documentation

- [Release Process](../development/release-process.md)
- [Versioning Policy](../governance/versioning.md)
- [Maintenance Schedule](maintenance-schedule.md)
- [Performance Guidelines](performance.md)

## Quick Reference

```bash
# Full publishing flow
npm test && \
npm run build && \
git tag -a v1.2.0 -m "Release v1.2.0" && \
git push origin v1.2.0 && \
npm publish && \
gh release create v1.2.0
```

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
