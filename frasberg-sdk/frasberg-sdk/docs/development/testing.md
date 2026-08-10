# Testing Guide

Comprehensive guide to testing the Frasberg SDK.

## Overview

The Frasberg SDK uses [Vitest](https://vitest.dev/) as its testing framework. Our testing strategy includes unit tests, integration tests, and end-to-end tests to ensure reliability and correctness.

## Test Structure

```
src/
├── __tests__/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── fixtures/       # Test fixtures and mock data
└── [module]/
    └── __tests__/      # Module-specific tests
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test File

```bash
npm test -- src/__tests__/unit/client.test.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

## Unit Testing

### Testing Client Methods

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFrasbergClient } from '../client';

describe('FrasbergClient', () => {
  let client: ReturnType<typeof createFrasbergClient>;

  beforeEach(() => {
    // Reset environment before each test
    vi.stubEnv('FRASBERG_API_KEY', 'test-api-key');
    vi.stubEnv('FRASBERG_API_URL', 'https://test.api.com');
    
    client = createFrasbergClient();
  });

  it('should generate text successfully', async () => {
    // Mock fetch response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'Generated text' })
    });

    const result = await client.generateText('test prompt');
    
    expect(result).toBe('Generated text');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/text'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        })
      })
    );
  });

  it('should throw error when API key is missing', () => {
    vi.stubEnv('FRASBERG_API_KEY', '');
    
    expect(() => createFrasbergClient()).toThrow('API key is required');
  });
});
```

### Testing Utilities

```typescript
import { describe, it, expect } from 'vitest';
import { validateConfig, buildRequestOptions } from '../utils';

describe('Utils', () => {
  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config = {
        apiKey: 'test-key',
        apiUrl: 'https://api.test.com'
      };
      
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw error for missing API key', () => {
      const config = {
        apiKey: '',
        apiUrl: 'https://api.test.com'
      };
      
      expect(() => validateConfig(config)).toThrow('API key is required');
    });

    it('should throw error for invalid URL', () => {
      const config = {
        apiKey: 'test-key',
        apiUrl: 'not-a-url'
      };
      
      expect(() => validateConfig(config)).toThrow('Invalid API URL');
    });
  });
});
```

## Integration Testing

### Testing with Real API

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createFrasbergClient } from '../client';
import dotenv from 'dotenv';

// Load environment variables for integration tests
dotenv.config({ path: '.env.test' });

describe('Integration Tests', () => {
  let client: ReturnType<typeof createFrasbergClient>;

  beforeAll(() => {
    // Ensure test environment is configured
    if (!process.env.FRASBERG_API_KEY) {
      throw new Error('FRASBERG_API_KEY not set for integration tests');
    }
    
    client = createFrasbergClient();
  });

  it('should generate text with real API', async () => {
    const result = await client.generateText('Hello, world!');
    
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  }, { timeout: 30000 }); // Longer timeout for API calls

  it('should handle API errors gracefully', async () => {
    await expect(
      client.generateText('')
    ).rejects.toThrow();
  });
});
```

## Mocking Strategies

### Mock fetch API

```typescript
import { vi } from 'vitest';

// Mock successful response
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ result: 'mock data' })
});

// Mock error response
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  status: 400,
  json: async () => ({ error: 'Bad request' })
});

// Mock network error
global.fetch = vi.fn().mockRejectedValue(
  new Error('Network error')
);
```

### Mock Environment Variables

```typescript
import { vi } from 'vitest';

vi.stubEnv('FRASBERG_API_KEY', 'test-key');
vi.stubEnv('FRASBERG_API_URL', 'https://test.api.com');
```

### Mock File System

```typescript
import { vi } from 'vitest';
import fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock data'))
}));
```

## Test Patterns

### AAA Pattern (Arrange, Act, Assert)

```typescript
it('should process data correctly', () => {
  // Arrange
  const input = 'test input';
  const expected = 'expected output';
  
  // Act
  const result = processData(input);
  
  // Assert
  expect(result).toBe(expected);
});
```

### Given-When-Then

```typescript
describe('Feature: Text Generation', () => {
  it('Given valid prompt, When generating text, Then returns result', async () => {
    // Given
    const prompt = 'test prompt';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'generated text' })
    });
    
    // When
    const result = await client.generateText(prompt);
    
    // Then
    expect(result).toBe('generated text');
  });
});
```

### Parameterized Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('validateUrl', () => {
  it.each([
    ['https://api.test.com', true],
    ['http://localhost:3000', true],
    ['not-a-url', false],
    ['', false],
    ['ftp://test.com', false]
  ])('should validate %s as %s', (url, expected) => {
    expect(isValidUrl(url)).toBe(expected);
  });
});
```

## Test Coverage

### Coverage Requirements

- **Overall Coverage**: ≥ 80%
- **Statements**: ≥ 80%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Lines**: ≥ 80%

### Generate Coverage Report

```bash
npm test -- --coverage
```

### View Coverage Report

```bash
open coverage/index.html
```

### Coverage Configuration

Configure coverage in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/fixtures/**'
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    }
  }
});
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ❌ Bad - tests depend on each other
let sharedState;

it('test 1', () => {
  sharedState = 'value';
});

it('test 2', () => {
  expect(sharedState).toBe('value'); // Depends on test 1
});

// ✅ Good - tests are independent
it('test 1', () => {
  const state = 'value';
  expect(state).toBe('value');
});

it('test 2', () => {
  const state = 'value';
  expect(state).toBe('value');
});
```

### 2. Clear Test Names

Use descriptive test names that explain what is being tested:

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should generate text when valid prompt is provided', () => { ... });
```

### 3. One Assertion Per Test

Focus each test on a single behavior:

```typescript
// ❌ Bad - testing multiple things
it('should work', () => {
  expect(result.text).toBeTruthy();
  expect(result.metadata).toBeDefined();
  expect(result.timestamp).toBeGreaterThan(0);
});

// ✅ Good - separate tests for each assertion
it('should return text in result', () => {
  expect(result.text).toBeTruthy();
});

it('should include metadata in result', () => {
  expect(result.metadata).toBeDefined();
});
```

### 4. Use beforeEach for Setup

```typescript
describe('Client', () => {
  let client;

  beforeEach(() => {
    vi.stubEnv('FRASBERG_API_KEY', 'test-key');
    client = createFrasbergClient();
  });

  it('should generate text', async () => {
    // Test implementation
  });
});
```

### 5. Clean Up After Tests

```typescript
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
```

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every push to `dev` or `main`
- Before releases

### CI Configuration

Tests must pass before merging:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests Timing Out

Increase timeout for slow tests:

```typescript
it('should handle slow operation', async () => {
  // Test implementation
}, { timeout: 30000 }); // 30 seconds
```

### Mock Not Working

Ensure mocks are set up before the test runs:

```typescript
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
});
```

### Environment Variables Not Set

Use `vi.stubEnv` to set environment variables:

```typescript
vi.stubEnv('FRASBERG_API_KEY', 'test-key');
```

## Related Documentation

- [Contributing Guide](contributing.md)
- [Local Workflow](local-workflow.md)
- [Commit Conventions](commit-conventions.md)
- [Best Practices](../guides/best-practices.md)
