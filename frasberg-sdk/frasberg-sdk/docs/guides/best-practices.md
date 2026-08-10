# Best Practices

Production-ready patterns and recommendations for the Frasberg SDK.

## Configuration

### Secure API Key Management

**✅ DO:**
```typescript
// Load from environment variables
const apiKey = process.env.FRASBERG_API_KEY;

// Use GitHub Secrets for CI/CD
// Use Supabase Vault for production
```

**❌ DON'T:**
```typescript
// Never hardcode API keys
const apiKey = 'sk-123456789...'; // NEVER DO THIS

// Never commit .env files
// Never log API keys
```

### Environment Separation

```typescript
// development.env
FRASBERG_API_KEY=dev-key-here
FRASBERG_API_URL=https://dev-api.frasberg.com

// production.env (keep secure!)
FRASBERG_API_KEY=prod-key-here
FRASBERG_API_URL=https://api.frasberg.com
```

## Error Handling

### Always Use Try-Catch

```typescript
// ✅ Proper error handling
async function generate(prompt: string) {
  try {
    return await client.generateText(prompt);
  } catch (error) {
    logger.error('Generation failed', { prompt, error });
    throw new Error('Unable to complete request');
  }
}

// ❌ No error handling
async function generate(prompt: string) {
  return await client.generateText(prompt); // Will crash on error
}
```

### Implement Retry Logic

```typescript
async function generateWithRetry(prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.generateText(prompt);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (!error.message.includes('429')) throw error; // Don't retry non-rate-limit errors
      
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Performance

### Avoid Blocking Operations

```typescript
// ✅ Good: Parallel processing
async function generateMultiple(prompts: string[]) {
  return await Promise.all(
    prompts.map(prompt => client.generateText(prompt))
  );
}

// ❌ Bad: Sequential processing
async function generateMultiple(prompts: string[]) {
  const results = [];
  for (const prompt of prompts) {
    results.push(await client.generateText(prompt));
  }
  return results;
}
```

### Implement Timeouts

```typescript
async function generateWithTimeout(prompt: string, timeoutMs = 30000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  
  return Promise.race([
    client.generateText(prompt),
    timeout
  ]);
}
```

### Cache When Appropriate

```typescript
const cache = new Map<string, string>();

async function generateCached(prompt: string) {
  if (cache.has(prompt)) {
    return cache.get(prompt)!;
  }
  
  const result = await client.generateText(prompt);
  cache.set(prompt, result);
  return result;
}
```

## Resource Management

### Handle Large Files Properly

```typescript
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

// ✅ Stream large files
async function saveVideo(prompt: string, outputPath: string) {
  const buffer = await client.generateVideo(prompt);
  await fs.writeFile(outputPath, buffer);
}

// Clean up resources
process.on('exit', () => {
  // Cleanup code here
});
```

### Limit Concurrent Requests

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  
  constructor(private maxConcurrent: number) {}
  
  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.running >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
    }
  }
}

const limiter = new RateLimiter(5);

// Use limiter for all requests
const result = await limiter.run(() => 
  client.generateText(prompt)
);
```

## Logging and Monitoring

### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

async function generate(prompt: string) {
  const startTime = Date.now();
  logger.info('Generation started', { prompt });
  
  try {
    const result = await client.generateText(prompt);
    const duration = Date.now() - startTime;
    
    logger.info('Generation completed', { 
      prompt, 
      duration,
      resultLength: result.length 
    });
    
    return result;
  } catch (error) {
    logger.error('Generation failed', { 
      prompt, 
      error: error.message,
      duration: Date.now() - startTime
    });
    throw error;
  }
}
```

### Metrics Tracking

```typescript
interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDuration: number;
}

const metrics: Metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageDuration: 0
};

async function generateWithMetrics(prompt: string) {
  metrics.totalRequests++;
  const startTime = Date.now();
  
  try {
    const result = await client.generateText(prompt);
    metrics.successfulRequests++;
    
    const duration = Date.now() - startTime;
    metrics.averageDuration = 
      (metrics.averageDuration * (metrics.totalRequests - 1) + duration) / 
      metrics.totalRequests;
    
    return result;
  } catch (error) {
    metrics.failedRequests++;
    throw error;
  }
}
```

## Testing

### Mock for Testing

```typescript
// test-utils.ts
export function createMockClient() {
  return {
    generateText: async (input: string) => `Mock response for: ${input}`,
    generateImage: async (prompt: string) => Buffer.from('mock-image'),
    generateVideo: async (prompt: string) => Buffer.from('mock-video')
  };
}

// test.ts
import { createMockClient } from './test-utils';

test('generates text', async () => {
  const client = createMockClient();
  const result = await client.generateText('test');
  expect(result).toBe('Mock response for: test');
});
```

### Integration Testing

```typescript
describe('Frasberg SDK Integration', () => {
  let client: FrasbergClient;
  
  beforeAll(() => {
    // Use test API key
    process.env.FRASBERG_API_KEY = 'test-key';
    client = createFrasbergClient();
  });
  
  it('generates text successfully', async () => {
    const result = await client.generateText('Hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout
});
```

## Production Checklist

Before deploying to production:

- [ ] API keys stored securely (GitHub Secrets or Supabase Vault)
- [ ] Error handling implemented for all SDK calls
- [ ] Retry logic added for transient failures
- [ ] Logging configured for debugging
- [ ] Metrics/monitoring in place
- [ ] Rate limiting implemented
- [ ] Timeouts configured appropriately
- [ ] Tests passing (unit and integration)
- [ ] No API keys in source code
- [ ] Environment variables validated
- [ ] Documentation updated

## Code Review Checklist

When reviewing code that uses the SDK:

- [ ] No hardcoded API keys or sensitive data
- [ ] All SDK calls wrapped in try-catch
- [ ] Appropriate error messages for users
- [ ] No blocking operations in critical paths
- [ ] Resource cleanup handled properly
- [ ] Tests cover error cases
- [ ] Logging doesn't expose sensitive information
- [ ] Rate limits respected
- [ ] Timeouts configured

## Related Guides

- [Error Handling](error-handling.md) - Comprehensive error patterns
- [Troubleshooting](troubleshooting.md) - Common issues
- [Performance Guidelines](../operations/performance.md) - Optimization
- [Security Policy](../governance/security.md) - Security best practices
