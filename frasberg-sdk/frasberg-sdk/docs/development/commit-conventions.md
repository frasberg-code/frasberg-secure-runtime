# Commit Message Conventions

The repository uses **Conventional Commits** for structured, semantic commit messages.

## Format

```
<type>(optional scope): <description>

[optional body]

[optional footer(s)]
```

## Allowed Types

| Type | Purpose |
|------|---------|
| feat | A new feature |
| fix | A bug fix |
| docs | Documentation changes |
| style | Formatting, no code changes |
| refactor | Code restructuring without behavior change |
| perf | Performance improvements |
| test | Adding or updating tests |
| build | Build system changes |
| ci | CI/CD workflow changes |
| chore | Maintenance tasks |
| revert | Reverts a previous commit |

## Examples

**Feature:**
```
feat(client): add text generation endpoint
```

**Fix:**
```
fix(config): correct fallback provider logic
```

**Breaking Change:**
```
feat(client): update generateText signature

BREAKING CHANGE: generateText now requires a prompt object instead of a string.
```

## Rules

- Use lowercase types
- Keep descriptions short and imperative
- One logical change per commit
- Breaking changes must be explicit

## Detailed Guidelines

### Type Selection

Choose the most appropriate type:

**feat** - New functionality
```bash
feat: add streaming support for text generation
feat(client): implement retry logic
feat(api): add generateTextBatch method
```

**fix** - Bug fixes
```bash
fix: resolve memory leak in image generation
fix(config): handle missing environment variables
fix(client): correct timeout handling
```

**docs** - Documentation only
```bash
docs: update installation guide
docs(api): add examples for generateVideo
docs: fix typo in README
```

**style** - Code style changes (no logic change)
```bash
style: format code with prettier
style: fix indentation in client.ts
style(client): remove unused imports
```

**refactor** - Code restructuring
```bash
refactor: simplify error handling logic
refactor(config): extract validation into separate function
refactor: convert callbacks to async/await
```

**perf** - Performance improvements
```bash
perf: optimize image buffer handling
perf(client): reduce memory allocation
perf: implement request pooling
```

**test** - Test changes
```bash
test: add unit tests for generateText
test(client): increase timeout for integration tests
test: mock API responses in tests
```

**build** - Build system changes
```bash
build: update TypeScript to v5.0
build: configure tsconfig for strict mode
build(deps): update vitest to v2.0
```

**ci** - CI/CD changes
```bash
ci: add GitHub Actions workflow
ci: fix failing test job
ci(github): update Node version matrix
```

**chore** - Maintenance tasks
```bash
chore: update dependencies
chore: regenerate package-lock.json
chore(release): bump version to 1.2.0
```

**revert** - Revert previous commit
```bash
revert: "feat: add streaming support"

This reverts commit abc123def456.
```

### Scope (Optional)

Scope specifies which part of the codebase is affected:

```bash
feat(client): add new method
fix(config): resolve issue
docs(api): update reference
test(integration): add new test
```

Common scopes:
- `client` - Client code
- `config` - Configuration
- `api` - API interface
- `types` - TypeScript types
- `docs` - Documentation
- `tests` - Test files
- `ci` - CI/CD
- `deps` - Dependencies

### Description

**Good descriptions:**
```bash
feat: add video generation support
fix: resolve timeout in long requests
docs: update quickstart guide
refactor: simplify error handling
```

**Bad descriptions:**
```bash
feat: stuff        # Too vague
fix: fixed bug    # No information
docs: updates     # What updates?
refactor: changes # What changes?
```

### Body (Optional)

Provide additional context:

```bash
feat: add retry mechanism for failed requests

Implements exponential backoff retry logic for transient failures.
Retries up to 3 times with increasing delays (1s, 2s, 4s).
Only retries on 429, 500, and 502 status codes.
```

### Footer (Optional)

Add metadata like issue references or breaking changes:

```bash
fix: resolve authentication issue

Fixes #42
Closes #43

BREAKING CHANGE: API key format has changed. Update your .env file.
```

## Breaking Changes

Breaking changes must be clearly indicated:

### Option 1: Footer

```bash
feat: change generateText signature

BREAKING CHANGE: generateText now requires an options object instead of a string prompt.
```

### Option 2: Type with !

```bash
feat!: change generateText signature

generateText now requires an options object instead of a string prompt.
```

## Multiple Changes

If multiple unrelated changes are in one commit, consider splitting:

```bash
# ❌ Bad - Multiple unrelated changes
feat: add caching and fix timeout bug

# ✅ Good - Separate commits
feat: add response caching
fix: resolve timeout in video generation
```

## Commit Message Template

Create a template file `.gitmessage`:

```
# <type>(<scope>): <subject>
# |<----  Using a Maximum Of 50 Characters  ---->|

# Explain why this change is being made
# |<----   Try To Limit Each Line to a Maximum Of 72 Characters   ---->|

# Provide links or keys to any relevant tickets, articles or other resources
# Example: Github issue #23

# --- COMMIT END ---
# Type can be
#    feat     (new feature)
#    fix      (bug fix)
#    refactor (refactoring code)
#    style    (formatting, missing semi colons, etc)
#    docs     (changes to documentation)
#    test     (adding or refactoring tests)
#    chore    (updating build tasks, package manager configs, etc)
# --------------------
# Remember to
#    Capitalize the subject line
#    Use the imperative mood in the subject line
#    Do not end the subject line with a period
#    Separate subject from body with a blank line
#    Use the body to explain what and why vs. how
#    Can use multiple lines with "-" for bullet points in body
# --------------------
```

Configure git to use it:

```bash
git config commit.template .gitmessage
```

## Validation

### Commitlint

Install commitlint:

```bash
npm install --save-dev @commitlint/{config-conventional,cli}
```

Configure `.commitlintrc.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert"
      ]
    ],
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]]
  }
}
```

Add git hook:

```bash
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'
```

## Examples by Scenario

### Adding a Feature

```bash
git commit -m "feat(client): add generateTextStream method

Implements streaming text generation for real-time responses.
Returns an AsyncIterator that yields text chunks.

Closes #67"
```

### Fixing a Bug

```bash
git commit -m "fix(config): handle undefined environment variables

Prevents crash when FRASBERG_API_URL is not set.
Falls back to default URL as intended.

Fixes #89"
```

### Updating Documentation

```bash
git commit -m "docs(guides): add error handling examples

Adds comprehensive examples for try-catch patterns
and retry logic in the error handling guide."
```

### Refactoring Code

```bash
git commit -m "refactor(client): extract request builder

Moves HTTP request construction to separate function
for better testability and reusability."
```

### Improving Performance

```bash
git commit -m "perf(client): optimize buffer allocation

Reduces memory usage by pre-allocating buffers
based on Content-Length header.

Improves image generation memory usage by 30%."
```

### Breaking Change

```bash
git commit -m "feat!: update client initialization API

BREAKING CHANGE: createFrasbergClient now requires configuration object.

Before:
  const client = createFrasbergClient();

After:
  const client = createFrasbergClient({ apiKey: '...' });

Migration guide: docs/migration.md"
```

## Tools

### Commitizen

Interactive commit tool:

```bash
npm install --save-dev commitizen cz-conventional-changelog

npx commitizen init cz-conventional-changelog --save-dev --save-exact
```

Use it:

```bash
git add .
npx cz
```

### Commit Message Linter

```bash
# Install
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Validate last commit
npx commitlint --from HEAD~1 --to HEAD --verbose

# Validate commit message file
npx commitlint --edit .git/COMMIT_EDITMSG
```

## Related Documentation

- [Branching Strategy](branching-strategy.md) - Branch workflow
- [Contributing Guide](contributing.md) - How to contribute
- [Release Process](release-process.md) - Release workflow
