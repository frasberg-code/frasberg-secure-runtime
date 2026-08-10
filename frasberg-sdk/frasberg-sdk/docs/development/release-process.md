# Release Process

Detailed workflow for releasing new versions of the Frasberg SDK.

## Overview

Frasberg SDK follows [Semantic Versioning 2.0.0](../governance/versioning.md) and has a structured release process to ensure quality and consistency.

## Release Types

### Patch Release (1.0.x)

Bug fixes and minor updates that don't affect the API.

**When to use:**
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements

**Example:** `1.0.0` → `1.0.1`

### Minor Release (1.x.0)

New features that are backward compatible.

**When to use:**
- New features
- New API methods (backward compatible)
- Deprecations (with warnings)
- Significant improvements

**Example:** `1.0.0` → `1.1.0`

### Major Release (x.0.0)

Breaking changes that are not backward compatible.

**When to use:**
- Breaking API changes
- Removed deprecated features
- Major refactoring
- Architecture changes

**Example:** `1.0.0` → `2.0.0`

## Release Workflow

### 1. Pre-Release Planning

**Create Release Issue**

```markdown
## Release: vX.Y.Z

**Target Date:** YYYY-MM-DD

### Included Changes
- [ ] Feature 1 (#123)
- [ ] Bug fix 2 (#124)
- [ ] Documentation update (#125)

### Pre-Release Checklist
- [ ] All PRs merged to dev
- [ ] Tests passing
- [ ] Documentation updated
- [ ] CHANGELOG prepared
- [ ] Migration guide (if breaking changes)

### Release Checklist
- [ ] Version bumped
- [ ] Git tag created
- [ ] NPM package published
- [ ] GitHub release created
- [ ] Announcement drafted
```

**Review Merged PRs**

```bash
# List merged PRs since last release
gh pr list --state merged --base dev --limit 50

# Review changes
git log v1.0.0..HEAD --oneline
```

### 2. Prepare Release Branch

**Create Release Branch**

```bash
# Ensure dev is up to date
git checkout dev
git pull origin dev

# Create release branch
git checkout -b release/v1.1.0

# Push release branch
git push origin release/v1.1.0
```

### 3. Update Version

**Bump Version in package.json**

```bash
# For patch release
npm version patch

# For minor release
npm version minor

# For major release
npm version major
```

Or manually edit `package.json`:

```json
{
  "name": "@frasberg/core-sdk",
  "version": "1.1.0",
  ...
}
```

**Update package-lock.json**

```bash
npm install
```

**Commit Version Bump**

```bash
git add package.json package-lock.json
git commit -m "chore: bump version to 1.1.0"
```

### 4. Update CHANGELOG

**Edit CHANGELOG.md**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-02-04

### Added
- New image caching functionality (#123)
- Support for custom headers (#125)
- Retry mechanism for failed requests (#127)

### Changed
- Improved error messages for API failures (#124)
- Updated TypeScript to 5.3.0 (#126)

### Fixed
- Fixed memory leak in video generation (#128)
- Corrected type definitions for options (#129)

### Deprecated
- `oldMethod()` will be removed in v2.0.0, use `newMethod()` instead

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Text generation support
- Image generation support
- Video generation support
- TypeScript support
- ESM and CJS support

[1.1.0]: https://github.com/emeraldorbit/frasberg-backend/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/emeraldorbit/frasberg-backend/releases/tag/v1.0.0
```

**Commit CHANGELOG**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v1.1.0"
```

### 5. Update Documentation

**Review Documentation**

- Update version numbers in examples
- Update API documentation
- Update migration guides
- Update README if needed

**Common Files to Update:**

```bash
# Update README
docs/README.md

# Update installation guide
docs/getting-started/installation.md

# Update API reference
docs/api/client.md
docs/api/types.md

# Add migration guide (if breaking changes)
docs/MIGRATION.md
```

**Commit Documentation Updates**

```bash
git add docs/
git commit -m "docs: update documentation for v1.1.0"
```

### 6. Testing

**Run Full Test Suite**

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run integration tests
npm run test:integration
```

**Manual Testing**

```bash
# Build the package
npm run build

# Link locally
npm link

# Test in sample project
cd /path/to/test-project
npm link @frasberg/core-sdk

# Run test scenarios
node test-scenarios.js
```

**Verify Build Output**

```bash
# Check dist files
ls -la dist/

# Verify types
tsc --noEmit

# Check exports
node -e "console.log(require('./dist/index.js'))"
node -e "import('./dist/index.mjs').then(console.log)"
```

### 7. Create Pull Request

**Push Release Branch**

```bash
git push origin release/v1.1.0
```

**Create PR to main**

```markdown
## Release: v1.1.0

### Changes
See [CHANGELOG.md](CHANGELOG.md) for full details.

### Summary
- Added X new features
- Fixed Y bugs
- Improved Z

### Pre-Release Checklist
- [x] Version bumped
- [x] CHANGELOG updated
- [x] Documentation updated
- [x] Tests passing
- [x] Build successful

### Post-Merge Tasks
- [ ] Create git tag
- [ ] Publish to NPM
- [ ] Create GitHub release
- [ ] Merge back to dev
- [ ] Announce release
```

### 8. Review and Merge

**Code Review**

- At least 2 maintainers must approve
- All CI checks must pass
- No merge conflicts

**Merge to main**

```bash
# Squash and merge or merge commit (depending on policy)
gh pr merge --merge
```

### 9. Tag Release

**Create Git Tag**

```bash
# Checkout main
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.1.0 -m "Release v1.1.0"

# Push tag
git push origin v1.1.0
```

### 10. Publish to NPM

**Build for Production**

```bash
# Clean previous builds
npm run clean

# Build package
npm run build

# Verify package contents
npm pack --dry-run
```

**Publish Package**

```bash
# Login to NPM (if needed)
npm login

# Publish package
npm publish --access public

# Verify publication
npm view @frasberg/core-sdk version
```

**For Beta/RC Releases:**

```bash
# Publish with tag
npm publish --tag beta

# Install beta version
npm install @frasberg/core-sdk@beta
```

### 11. Create GitHub Release

**Using GitHub CLI**

```bash
gh release create v1.1.0 \
  --title "v1.1.0" \
  --notes-file RELEASE_NOTES.md
```

**Or via GitHub UI:**

1. Go to repository releases
2. Click "Draft a new release"
3. Select tag `v1.1.0`
4. Add release title: `v1.1.0`
5. Copy content from CHANGELOG
6. Upload any assets (if applicable)
7. Click "Publish release"

**Release Notes Template:**

```markdown
## 🎉 What's New in v1.1.0

### ✨ Features
- **Image Caching**: Improved performance with built-in caching (#123)
- **Custom Headers**: Support for custom request headers (#125)
- **Retry Logic**: Automatic retry for failed requests (#127)

### 🐛 Bug Fixes
- Fixed memory leak in video generation (#128)
- Corrected type definitions (#129)

### 📚 Documentation
- Updated API documentation
- Added caching examples
- Improved troubleshooting guide

### 🔧 Internal
- Updated dependencies
- Improved test coverage to 85%

## 📦 Installation

```bash
npm install @frasberg/core-sdk@1.1.0
```

## 🔄 Upgrade Guide

See [MIGRATION.md](MIGRATION.md) for upgrade instructions.

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete details.

## 🙏 Contributors

Thanks to all contributors who made this release possible!
- @contributor1
- @contributor2
```

### 12. Merge Back to dev

**Create PR from main to dev**

```bash
git checkout main
git pull origin main
git checkout -b merge/main-to-dev
git push origin merge/main-to-dev
```

**Create PR:**

```markdown
## Merge main to dev

Merging v1.1.0 release back to dev branch.

### Changes
- Version bump to 1.1.0
- Updated CHANGELOG
- Documentation updates
```

**Merge PR**

```bash
gh pr merge --merge
```

### 13. Post-Release Tasks

**Announce Release**

- Post to internal channels
- Update project status
- Notify stakeholders

**Update Project Board**

- Close release issue
- Move completed items to "Done"
- Plan next release

**Monitor for Issues**

- Watch for bug reports
- Monitor NPM download stats
- Check GitHub issues

## Emergency Hotfix Process

For critical bugs in production:

### 1. Create Hotfix Branch

```bash
git checkout main
git pull origin main
git checkout -b hotfix/v1.1.1
```

### 2. Fix the Issue

```bash
# Make fix
git add .
git commit -m "fix: critical bug in generateImage"
```

### 3. Bump Version (Patch)

```bash
npm version patch
```

### 4. Update CHANGELOG

```markdown
## [1.1.1] - 2024-02-05

### Fixed
- Critical bug causing crashes in generateImage (#130)
```

### 5. Fast-Track Release

```bash
# Create PR to main
gh pr create --base main --title "Hotfix v1.1.1"

# After approval, merge
gh pr merge --merge

# Tag and publish
git checkout main
git pull
git tag -a v1.1.1 -m "Hotfix v1.1.1"
git push origin v1.1.1
npm publish

# Create GitHub release
gh release create v1.1.1 --title "v1.1.1 (Hotfix)" --notes "Critical bug fix"

# Merge back to dev
git checkout dev
git merge main
git push origin dev
```

## Rollback Procedure

If a release has critical issues:

### 1. Unpublish from NPM (within 72 hours)

```bash
npm unpublish @frasberg/core-sdk@1.1.0
```

### 2. Or Deprecate

```bash
npm deprecate @frasberg/core-sdk@1.1.0 "Critical bug, use 1.1.1 instead"
```

### 3. Remove Git Tag

```bash
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0
```

### 4. Delete GitHub Release

```bash
gh release delete v1.1.0
```

## Automation

### GitHub Actions

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
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
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

## Checklist

Use [Publishing Checklist](../operations/publishing-checklist.md) for detailed steps.

## Related Documentation

- [Versioning Policy](../governance/versioning.md)
- [Deprecation Policy](../governance/deprecation.md)
- [Publishing Checklist](../operations/publishing-checklist.md)
- [Branching Strategy](branching-strategy.md)
- [Commit Conventions](commit-conventions.md)
