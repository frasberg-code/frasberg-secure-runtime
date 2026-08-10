# Contributing Guide

Thank you for your interest in contributing to the Frasberg SDK! This guide will help you get started.

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team. All complaints will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0 or pnpm >= 8.0.0
- Git
- TypeScript knowledge
- Familiarity with AI/ML concepts (helpful but not required)

### Development Setup

1. **Fork the repository**

   Click the "Fork" button on the GitHub repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/frasberg-sdk.git
   cd frasberg-sdk
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/emeraldorbit/frasberg-backend.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Build the project**

   ```bash
   npm run build
   ```

7. **Run tests**

   ```bash
   npm test
   ```

For detailed development workflow, see [Local Workflow Guide](local-workflow.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check the [existing issues](https://github.com/emeraldorbit/frasberg-backend/issues)
2. Check the [troubleshooting guide](../guides/troubleshooting.md)
3. Verify you're using the latest version

When creating a bug report, include:
- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node version, SDK version)
- **Code samples** demonstrating the issue
- **Error messages** and stack traces

**Bug Report Template:**

```markdown
**Description**
A clear description of the bug.

**To Reproduce**
1. Step 1
2. Step 2
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., macOS 13.0]
- Node: [e.g., 18.15.0]
- SDK Version: [e.g., 1.2.0]

**Code Sample**
```typescript
// Minimal code to reproduce
```

**Error Message**
```
Paste error message here
```
```

### Requesting Features

Before requesting a feature:
1. Check [existing feature requests](https://github.com/emeraldorbit/frasberg-backend/issues?q=is%3Aissue+label%3Aenhancement)
2. Consider if it aligns with the project's goals
3. Think about how it would benefit other users

When requesting a feature, include:
- **Clear title** describing the feature
- **Use case** explaining why this is needed
- **Proposed solution** or implementation ideas
- **Alternatives considered**

### Submitting Changes

#### 1. Create a Branch

Follow our [branching strategy](branching-strategy.md):

```bash
# Update your local main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

#### 2. Make Changes

- Write clean, maintainable code
- Follow [TypeScript best practices](../guides/best-practices.md)
- Add tests for new functionality
- Update documentation as needed
- Follow [commit conventions](commit-conventions.md)

#### 3. Test Your Changes

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build project
npm run build

# Test locally
npm link
cd /path/to/test-project
npm link @frasberg/core-sdk
```

#### 4. Commit Your Changes

Follow [commit conventions](commit-conventions.md):

```bash
git add .
git commit -m "feat: add image caching support"
```

Commit message format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Maintenance tasks

#### 5. Push Changes

```bash
git push origin feature/your-feature-name
```

#### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template
5. Link related issues

**Pull Request Template:**

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Fixes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Updated documentation

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

## Pull Request Process

### 1. Automated Checks

Your PR must pass:
- ✅ All tests
- ✅ Linting
- ✅ Type checking
- ✅ Build
- ✅ Code coverage thresholds

### 2. Code Review

- At least one maintainer must approve
- Address all review comments
- Keep discussions focused and professional
- Be open to feedback and suggestions

### 3. Merging

Once approved:
1. Ensure branch is up to date with `dev`
2. Squash commits if needed
3. Maintainer will merge the PR

## Code Style Guidelines

### TypeScript

```typescript
// ✅ Good
export async function generateText(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  if (!prompt) {
    throw new Error('Prompt is required');
  }
  
  return await apiCall(prompt, options);
}

// ❌ Bad
export async function generateText(prompt: string, options?: any): Promise<any> {
  if(!prompt) throw new Error('Prompt is required');
  return await apiCall(prompt,options);
}
```

### Naming Conventions

- **Variables/Functions**: camelCase (`generateText`, `apiKey`)
- **Classes/Interfaces**: PascalCase (`FrasbergClient`, `GenerateOptions`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`, `MAX_RETRIES`)
- **Files**: kebab-case (`frasberg-client.ts`, `api-utils.ts`)

### Documentation

Add JSDoc comments for public APIs:

```typescript
/**
 * Generates text using Frasberg AI.
 * 
 * @param prompt - The text prompt to generate from
 * @param options - Optional generation parameters
 * @returns Promise resolving to generated text
 * @throws {Error} If prompt is empty or API request fails
 * 
 * @example
 * ```typescript
 * const text = await client.generateText('Hello world');
 * console.log(text);
 * ```
 */
export async function generateText(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ Good - Specific error types
if (!apiKey) {
  throw new ValidationError('API key is required');
}

try {
  return await fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    throw new ApiError('Network request failed', { cause: error });
  }
  throw error;
}

// ❌ Bad - Generic errors
if (!apiKey) {
  throw new Error('Error');
}

try {
  return await fetchData();
} catch (error) {
  console.log('Error:', error);
}
```

## Testing Guidelines

- Write tests for all new features
- Maintain code coverage above 80%
- Use descriptive test names
- Follow [testing guide](testing.md)

```typescript
describe('generateText', () => {
  it('should generate text with valid prompt', async () => {
    const result = await client.generateText('test');
    expect(result).toBeTruthy();
  });

  it('should throw error for empty prompt', async () => {
    await expect(
      client.generateText('')
    ).rejects.toThrow('Prompt is required');
  });
});
```

## Documentation Guidelines

Update documentation when:
- Adding new features
- Changing existing behavior
- Fixing bugs that affect usage
- Adding examples or tutorials

Documentation locations:
- `docs/` - User-facing documentation
- `README.md` - Quick start and overview
- Code comments - Implementation details
- `CHANGELOG.md` - Version history

## Community

### Getting Help

- 💬 [GitHub Discussions](https://github.com/emeraldorbit/frasberg-backend/discussions)
- 🐛 [Issue Tracker](https://github.com/emeraldorbit/frasberg-backend/issues)
- 📖 [Documentation](../index.md)

### Stay Updated

- Watch the repository for updates
- Follow [release notes](../../CHANGELOG.md)
- Join discussions on new features

## Recognition

Contributors are recognized in:
- `CHANGELOG.md` for their contributions
- GitHub contributor graph
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (UNLICENSED - proprietary to Emerald Estates).

## Questions?

If you have questions about contributing, feel free to:
- Open a [GitHub Discussion](https://github.com/emeraldorbit/frasberg-backend/discussions)
- Contact the maintainers
- Check existing documentation

Thank you for contributing to Frasberg SDK! 🎉

## Related Documentation

- [Branching Strategy](branching-strategy.md)
- [Commit Conventions](commit-conventions.md)
- [Local Workflow](local-workflow.md)
- [Testing Guide](testing.md)
- [Release Process](release-process.md)
