# Branching & Release Flow

## Branch Types

### main
- Always stable and production-ready
- Only updated via PRs from dev or release branches
- Tagged releases originate here

### dev
- Integration branch
- All feature branches merge here first
- CI runs full suite
- Must remain green at all times

### feature/*
- Short-lived branches
- One feature or fix per branch
- Merged into dev via PR

### release/*
- Created when preparing a new version
- Used for final polishing, documentation, and CHANGELOG updates
- Merged into both main and dev

## Flow Diagram

```
                +----------------------+
                |      main (stable)   |
                +----------+-----------+
                           ^
                           |  merge + tag (vX.Y.Z)
                           |
                  +--------+--------+
                  |    release/*    |
                  +--------+--------+
                           ^
                           |  branch from dev
                           |
                +----------+-----------+
                |         dev          |
                +----------+-----------+
                           ^
                           |  merge via PR
                           |
                +----------+-----------+
                |     feature/*        |
                +----------------------+
```

## Release Steps

1. Create release branch: `git checkout -b release/vX.Y.Z`
2. Update version, CHANGELOG, and docs
3. Open PR → main (CI must pass)
4. Merge into main (triggers release workflow)
5. Merge back into dev (keeps dev ahead of main)

## Branch Naming Conventions

### Feature Branches

Format: `feature/<short-description>`

Examples:
```bash
feature/add-streaming-support
feature/improve-error-messages
feature/add-video-generation
```

### Bugfix Branches

Format: `fix/<short-description>`

Examples:
```bash
fix/memory-leak-in-client
fix/invalid-api-key-error
fix/timeout-handling
```

### Release Branches

Format: `release/vX.Y.Z`

Examples:
```bash
release/v1.0.0
release/v1.1.0
release/v2.0.0
```

### Hotfix Branches

Format: `hotfix/<short-description>`

Examples:
```bash
hotfix/critical-security-patch
hotfix/production-crash
```

## Workflow Examples

### Feature Development

```bash
# Start from dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/add-caching

# Make changes and commit
git add .
git commit -m "feat: add caching support"

# Push and create PR
git push origin feature/add-caching
# Open PR: feature/add-caching → dev
```

### Release Process

```bash
# Create release branch from dev
git checkout dev
git pull origin dev
git checkout -b release/v1.2.0

# Update version
npm version minor --no-git-tag-version

# Update CHANGELOG
# Edit CHANGELOG.md

# Commit changes
git add .
git commit -m "chore: prepare v1.2.0 release"

# Push and create PR to main
git push origin release/v1.2.0
# Open PR: release/v1.2.0 → main

# After merge to main, create tag
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0

# Merge back to dev
git checkout dev
git merge main
git push origin dev
```

### Hotfix Process

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/security-patch

# Make critical fix
git add .
git commit -m "fix: security vulnerability in auth"

# Push and create PR to main
git push origin hotfix/security-patch
# Open PR: hotfix/security-patch → main

# After merge, tag immediately
git checkout main
git pull origin main
git tag v1.2.1
git push origin v1.2.1

# Also merge to dev
git checkout dev
git merge main
git push origin dev
```

## Pull Request Requirements

### From feature/* to dev

- [ ] All tests passing
- [ ] Code review approved
- [ ] No merge conflicts
- [ ] Follows commit conventions
- [ ] Documentation updated (if needed)

### From release/* to main

- [ ] All tests passing
- [ ] Version bumped correctly
- [ ] CHANGELOG updated
- [ ] Documentation updated
- [ ] Approval from maintainers
- [ ] CI/CD green

### From hotfix/* to main

- [ ] Critical fix verified
- [ ] Tests added for regression
- [ ] Emergency approval obtained
- [ ] Minimal changes only

## Branch Protection Rules

### main Branch

- Require pull request reviews (2 approvals)
- Require status checks to pass
- Require branches to be up to date
- Include administrators
- No force push
- No deletion

### dev Branch

- Require pull request reviews (1 approval)
- Require status checks to pass
- Allow force push (for maintainers only)
- No deletion

### feature/* Branches

- No protection
- Can be force pushed
- Can be deleted after merge

## Merge Strategies

### Feature to dev

- **Squash and merge** (recommended)
- Creates single clean commit
- Keeps dev history linear

### Release to main

- **Merge commit** (required)
- Preserves release history
- Allows easy rollback

### Hotfix to main

- **Merge commit** (required)
- Emergency changes tracked
- Clear audit trail

## Version Strategy

Follow [Semantic Versioning 2.0.0](https://semver.org/):

### MAJOR (X.y.z)

Breaking changes:
- Changed function signatures
- Removed features
- Altered behavior

Example: `1.5.3 → 2.0.0`

### MINOR (x.Y.z)

New features (backward compatible):
- New methods added
- Optional parameters
- Performance improvements

Example: `1.5.3 → 1.6.0`

### PATCH (x.y.Z)

Bug fixes:
- Fixes
- Documentation updates
- Internal improvements

Example: `1.5.3 → 1.5.4`

## Git Hooks

### Pre-commit

```bash
#!/bin/sh
# Run linter
npm run lint

# Run type check
npx tsc --noEmit
```

### Pre-push

```bash
#!/bin/sh
# Run tests
npm test
```

### Commit-msg

```bash
#!/bin/sh
# Validate commit message format
npx commitlint --edit $1
```

## Common Tasks

### Sync Fork

```bash
git remote add upstream git@github.com:emeraldorbit/frasberg-ai-backend.git
git fetch upstream
git checkout dev
git merge upstream/dev
git push origin dev
```

### Rebase Feature Branch

```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/dev
git push --force-with-lease
```

### Clean Up Old Branches

```bash
# Local
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d

# Remote
git push origin --delete feature/old-branch
```

## Related Documentation

- [Commit Conventions](commit-conventions.md) - Commit message format
- [Contributing Guide](contributing.md) - Contribution guidelines
- [Release Process](release-process.md) - Detailed release steps
