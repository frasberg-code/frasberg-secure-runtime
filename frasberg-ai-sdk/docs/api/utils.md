# Utils API Reference

Utility functions and helpers for the Frasberg SDK.

## Overview

The Frasberg SDK is designed with minimal dependencies and a small API surface. Currently, there are no exported utility functions in the public API.

## Internal Utilities

The SDK uses internal utilities that are not exposed in the public API:

- Request normalization
- Response parsing
- Error formatting
- HTTP client configuration

These are implementation details and may change without notice.

## Future Utilities

Future versions may include utility functions for:

### Prompt Helpers

```typescript
// Potential future API
import { formatPrompt, sanitizeInput } from '@frasberg/core-sdk/utils';

const prompt = formatPrompt({
  context: 'You are a helpful assistant',
  input: 'Explain quantum computing'
});
```

### Response Processing

```typescript
// Potential future API
import { extractText, parseMetadata } from '@frasberg/core-sdk/utils';

const text = extractText(response);
const metadata = parseMetadata(response);
```

### Validation

```typescript
// Potential future API
import { validateApiKey, validatePrompt } from '@frasberg/core-sdk/utils';

if (!validateApiKey(key)) {
  throw new Error('Invalid API key format');
}
```

## Custom Utilities

You can create your own utilities for common patterns:

### Retry Utility

```typescript
// utils/retry.ts
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }
  throw new Error('Should not reach here');
}

// Usage
import { createFrasbergClient } from '@frasberg/core-sdk';
import { retry } from './utils/retry';

const client = createFrasbergClient();
const result = await retry(() => client.generateText('Hello'));
```

### Timeout Utility

```typescript
// utils/timeout.ts
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// Usage
import { withTimeout } from './utils/timeout';

const result = await withTimeout(
  client.generateVideo('Complex scene'),
  120000 // 2 minutes
);
```

### Cache Utility

```typescript
// utils/cache.ts
export class GenerationCache {
  private cache = new Map<string, any>();
  
  async getCached<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await fn();
    this.cache.set(key, result);
    return result;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new GenerationCache();
const result = await cache.getCached(
  'hello-prompt',
  () => client.generateText('Hello')
);
```

### Batch Processing Utility

```typescript
// utils/batch.ts
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}

// Usage
import { processBatch } from './utils/batch';

const prompts = ['prompt1', 'prompt2', 'prompt3', /* ... */];
const results = await processBatch(
  prompts,
  (prompt) => client.generateText(prompt),
  3 // Process 3 at a time
);
```

### Rate Limiter Utility

```typescript
// utils/rate-limiter.ts
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  
  constructor(
    private maxConcurrent: number,
    private delayMs: number = 0
  ) {}
  
  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.running++;
    
    try {
      const result = await fn();
      if (this.delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
      return result;
    } finally {
      this.running--;
    }
  }
}

// Usage
const limiter = new RateLimiter(5, 200); // 5 concurrent, 200ms delay

const result = await limiter.run(() =>
  client.generateText('Hello')
);
```

### Progress Tracker Utility

```typescript
// utils/progress.ts
export class ProgressTracker {
  private completed = 0;
  
  constructor(
    private total: number,
    private callback?: (progress: number) => void
  ) {}
  
  async track<T>(promise: Promise<T>): Promise<T> {
    try {
      const result = await promise;
      this.completed++;
      this.report();
      return result;
    } catch (error) {
      this.completed++;
      this.report();
      throw error;
    }
  }
  
  private report() {
    const progress = (this.completed / this.total) * 100;
    this.callback?.(progress);
  }
}

// Usage
const tracker = new ProgressTracker(10, (progress) => {
  console.log(`Progress: ${progress.toFixed(0)}%`);
});

const prompts = [...]; // 10 prompts
const results = await Promise.all(
  prompts.map(prompt =>
    tracker.track(client.generateText(prompt))
  )
);
```

## Recommended Third-Party Utilities

For production use, consider these well-maintained libraries:

### Retry Logic
- **p-retry** - https://github.com/sindresorhus/p-retry
- **async-retry** - https://github.com/vercel/async-retry

### Rate Limiting
- **p-limit** - https://github.com/sindresorhus/p-limit
- **bottleneck** - https://github.com/SGrondin/bottleneck

### Caching
- **node-cache** - https://github.com/node-cache/node-cache
- **lru-cache** - https://github.com/isaacs/node-lru-cache

### Logging
- **winston** - https://github.com/winstonjs/winston
- **pino** - https://github.com/pinojs/pino

## Related Documentation

- [Client API](client.md) - Client methods reference
- [Best Practices](../guides/best-practices.md) - Production patterns
- [Error Handling](../guides/error-handling.md) - Error handling utilities
