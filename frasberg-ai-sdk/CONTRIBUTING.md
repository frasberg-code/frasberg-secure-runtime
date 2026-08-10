# Contributing to Frasberg AI SDK

Thank you for your interest in contributing to the Frasberg AI SDK. This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to professional standards of conduct. By participating, you are expected to uphold this code.

## Governance

Before contributing, please review:
- [Maintainer Oath](../.github/MAINTAINER_OATH.md) - Our constitutional commitment
- [Code Review Rubric](../.github/CODE_REVIEW_RUBRIC.md) - How PRs are evaluated
- [Issue Triage Protocol](../.github/ISSUE_TRIAGE.md) - How issues are handled

These ensure every contribution aligns with the SDK's identity and principles.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear and descriptive title**
- **Steps to reproduce** the behavior
- **Expected behavior** description
- **Actual behavior** description
- **Environment details** (Node.js version, OS, SDK version)
- **Additional context** (logs, screenshots, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear and descriptive title**
- **Detailed description** of the suggested enhancement
- **Use cases** that would benefit from this enhancement
- **Potential implementation** approach (if you have ideas)

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Write or update tests as needed
5. Ensure tests pass (`npm test`)
6. Ensure TypeScript compiles (`npm run build`)
7. Commit your changes using conventional commits
8. Push to your fork
9. Open a Pull Request

## Development Workflow

### Prerequisites

- Node.js >= 18.0.0
- npm or pnpm
- TypeScript knowledge

### Setup

```bash
# Clone your fork
git clone https://github.com/your-username/frasberg.git
cd frasberg/frasberg-ai-sdk

# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test
```

### Project Structure

```
frasberg-ai-sdk/
├── src/
│   ├── client/       # Client implementation
│   ├── config/       # Configuration handling
│   └── utils/        # Utility functions
├── dist/             # Build output (generated)
└── package.json
```

## Coding Standards

### TypeScript Style

- Use **strict mode** (`strict: true` in tsconfig.json)
- No `any` types unless absolutely necessary
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Use `const` by default, `let` only when reassignment is needed

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters

### Naming Conventions

- **Files**: camelCase (e.g., `createFrasbergClient.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `FrasbergClient`)
- **Functions/Variables**: camelCase (e.g., `loadFrasbergConfig`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_API_URL`)

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(client): add retry logic for failed requests

fix(config): handle missing environment variables gracefully

docs(readme): update installation instructions
```

## Testing

- Write tests for all new features
- Ensure existing tests pass before submitting PR
- Aim for high test coverage (>80%)
- Use descriptive test names

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)

## Review Process

1. All PRs require review before merging
2. Address review feedback promptly
3. Keep PRs focused and reasonably sized
4. Rebase on main if requested

## Questions?

If you have questions, please open an issue or contact @frasberg.

## License

By contributing, you agree that your contributions will be licensed under the UNLICENSED license.
