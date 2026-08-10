# Local Development Workflow

Guide for developing the Frasberg AI SDK locally.

## Setup

### 1. Clone Repository

```bash
git clone https://github.com/frasberg/frasberg-ai-backend.git
cd frasberg-ai-backend/frasberg-ai-sdk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file:

```env
FRASBERG_AI_API_KEY=your-development-key
FRASBERG_AI_API_URL=https://dev-api.frasberg-ai.com
```

## Development Commands

### Build

```bash
npm run build
```

Outputs to `dist/`:
- `index.js` - CommonJS
- `index.mjs` - ES Module
- `index.d.ts` - TypeScript types

### Clean

```bash
npm run clean
```

Removes `dist/` directory.

### Type Check

```bash
npx tsc --noEmit
```

Checks TypeScript types without emitting files.

### Watch Mode

```bash
npx tsc --watch
```

Rebuilds on file changes.

## Testing

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage

```bash
npm test -- --coverage
```

### Specific Test

```bash
npm test -- client.test.ts
```

## Code Quality

### Linting

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Local Testing

### Link Locally

In SDK directory:

```bash
npm link
```

In your test project:

```bash
npm link @frasberg/core-sdk
```

### Test Changes

```typescript
// test-project/index.ts
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
const result = await client.generateText('Test');
console.log(result);
```

### Unlink

```bash
npm unlink @frasberg/core-sdk
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
```

### 2. Make Changes

Edit files in `src/`:

```
src/
├── index.ts
├── client/
│   └── createFrasbergClient.ts
└── config/
    ├── loadFrasbergConfig.ts
    └── types.ts
```

### 3. Test Changes

```bash
npm run build
npm test
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

Follow [Commit Conventions](commit-conventions.md).

### 5. Push and Create PR

```bash
git push origin feature/my-feature
```

Open PR: `feature/my-feature` → `dev`

## Debugging

### VS Code Configuration

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Node.js Debugging

```bash
node --inspect-brk node_modules/.bin/vitest run
```

Then attach debugger.

## Common Tasks

### Add New Method

1. Update interface in `src/client/createFrasbergClient.ts`
2. Implement method
3. Add tests
4. Update documentation

### Change API

1. Consider if breaking change
2. Update types
3. Update implementation
4. Update tests
5. Update docs
6. Update CHANGELOG

### Fix Bug

1. Write failing test
2. Fix bug
3. Verify test passes
4. Update docs if needed

## File Structure

```
frasberg-ai-sdk/
├── src/                    # Source code
│   ├── index.ts           # Public exports
│   ├── client/            # Client code
│   └── config/            # Configuration
├── docs/                  # Documentation
├── dist/                  # Build output (gitignored)
├── node_modules/          # Dependencies (gitignored)
├── package.json           # Package config
├── tsconfig.json          # TypeScript config
└── README.md             # Main readme
```

## Best Practices

### 1. Small Commits

Make small, focused commits:

```bash
# ✅ Good
git commit -m "feat: add retry logic"
git commit -m "test: add tests for retry logic"
git commit -m "docs: document retry behavior"

# ❌ Bad
git commit -m "add feature with tests and docs"
```

### 2. Test Before Commit

Always test before committing:

```bash
npm run build && npm test
```

### 3. Keep Branches Updated

Regularly sync with dev:

```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/dev
```

### 4. Clean Up

Remove unused code and imports:

```bash
# Find unused exports
npx ts-unused-exports tsconfig.json

# Remove unused imports
npx eslint --fix src/
```

## Troubleshooting

### Build Failures

```bash
# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Test Failures

```bash
# Run single test for debugging
npm test -- client.test.ts --reporter=verbose
```

### Type Errors

```bash
# Check types
npx tsc --noEmit --pretty

# Generate type definitions
npx tsc --declaration --emitDeclarationOnly
```

### Link Issues

```bash
# Reset links
npm unlink @frasberg/core-sdk
cd /path/to/sdk
npm link
cd /path/to/project
npm link @frasberg/core-sdk
```

## Related Documentation

- [Testing Guide](testing.md) - Testing practices
- [Contributing](contributing.md) - Contribution guidelines
- [Branching Strategy](branching-strategy.md) - Branch workflow
- [Commit Conventions](commit-conventions.md) - Commit format
