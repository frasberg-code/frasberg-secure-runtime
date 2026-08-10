# Advanced Patterns

Advanced usage patterns for the Frasberg AI SDK including caching, retries, batch processing, and more.

## Caching

### Simple In-Memory Cache

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

class CachedFrasbergClient {
  private client: ReturnType<typeof createFrasbergClient>;
  private cache: Map<string, any> = new Map();
  private cacheTTL: number;
  
  constructor(cacheTTL: number = 3600000) {  // 1 hour default
    this.client = createFrasbergClient();
    this.cacheTTL = cacheTTL;
  }
  
  async generateText(prompt: string): Promise<string> {
    const cacheKey = `text:${prompt}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('Cache hit!');
      return cached.value;
    }
    
    // Generate and cache
    const result = await this.client.generateText(prompt);
    this.cache.set(cacheKey, {
      value: result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}

// Usage
const client = new CachedFrasbergClient();
const result1 = await client.generateText('Hello');  // API call
const result2 = await client.generateText('Hello');  // From cache
```

### Redis Cache

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import Redis from 'ioredis';

class RedisCachedClient {
  private client: ReturnType<typeof createFrasbergClient>;
  private redis: Redis;
  private cacheTTL: number;
  
  constructor(redisUrl: string, cacheTTL: number = 3600) {
    this.client = createFrasbergClient();
    this.redis = new Redis(redisUrl);
    this.cacheTTL = cacheTTL;  // seconds
  }
  
  async generateText(prompt: string): Promise<string> {
    const cacheKey = `frasberg:text:${this.hashPrompt(prompt)}`;
    
    // Try cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log('Cache hit!');
      return cached;
    }
    
    // Generate
    const result = await this.client.generateText(prompt);
    
    // Cache result
    await this.redis.setex(cacheKey, this.cacheTTL, result);
    
    return result;
  }
  
  private hashPrompt(prompt: string): string {
    // Simple hash function
    return Buffer.from(prompt).toString('base64');
  }
  
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Usage
const client = new RedisCachedClient('redis://localhost:6379');
const result = await client.generateText('Hello');
await client.close();
```

## Retry Logic

### Exponential Backoff

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

class RetryClient {
  private client: ReturnType<typeof createFrasbergClient>;
  private maxRetries: number;
  private baseDelay: number;
  
  constructor(maxRetries: number = 3, baseDelay: number = 1000) {
    this.client = createFrasbergClient();
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }
  
  async generateTextWithRetry(prompt: string): Promise<string> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.client.generateText(prompt);
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt < this.maxRetries - 1) {
          const delay = this.calculateDelay(attempt);
          console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
  }
  
  private isNonRetryableError(error: any): boolean {
    // Don't retry on auth errors, validation errors, etc.
    const nonRetryableCodes = [
      'INVALID_API_KEY',
      'INVALID_REQUEST',
      'VALIDATION_ERROR'
    ];
    return nonRetryableCodes.includes(error.code);
  }
  
  private calculateDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const client = new RetryClient(3, 1000);
const result = await client.generateTextWithRetry('Generate text');
```

### Circuit Breaker Pattern

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

enum CircuitState {
  CLOSED = 'CLOSED',    // Normal operation
  OPEN = 'OPEN',        // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN'  // Testing if service recovered
}

class CircuitBreaker {
  private client: ReturnType<typeof createFrasbergClient>;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private failureThreshold: number;
  private successThreshold: number;
  private timeout: number;
  private nextAttempt: number = Date.now();
  
  constructor(
    failureThreshold: number = 5,
    successThreshold: number = 2,
    timeout: number = 60000
  ) {
    this.client = createFrasbergClient();
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;
  }
  
  async generateText(prompt: string): Promise<string> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
    }
    
    try {
      const result = await this.client.generateText(prompt);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
  
  getState(): CircuitState {
    return this.state;
  }
}

// Usage
const breaker = new CircuitBreaker(5, 2, 60000);

try {
  const result = await breaker.generateText('Hello');
  console.log(result);
} catch (error) {
  if (error.message === 'Circuit breaker is OPEN') {
    console.log('Service temporarily unavailable');
  }
}
```

## Batch Processing

### Process Multiple Prompts

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

class BatchProcessor {
  private client: ReturnType<typeof createFrasbergClient>;
  private batchSize: number;
  private delayBetweenBatches: number;
  
  constructor(batchSize: number = 5, delayMs: number = 1000) {
    this.client = createFrasbergClient();
    this.batchSize = batchSize;
    this.delayBetweenBatches = delayMs;
  }
  
  async processPrompts(prompts: string[]): Promise<string[]> {
    const results: string[] = [];
    
    // Split into batches
    for (let i = 0; i < prompts.length; i += this.batchSize) {
      const batch = prompts.slice(i, i + this.batchSize);
      
      console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1}...`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(prompt => this.client.generateText(prompt))
      );
      
      results.push(...batchResults);
      
      // Delay before next batch (except for last batch)
      if (i + this.batchSize < prompts.length) {
        await this.sleep(this.delayBetweenBatches);
      }
    }
    
    return results;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const processor = new BatchProcessor(5, 1000);
const prompts = [
  'Prompt 1',
  'Prompt 2',
  'Prompt 3',
  // ... many more
];

const results = await processor.processPrompts(prompts);
console.log(`Processed ${results.length} prompts`);
```

### Queue-Based Processing

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import { Queue, Worker } from 'bullmq';

// Job data interface
interface GenerateJob {
  id: string;
  prompt: string;
  type: 'text' | 'image' | 'video';
}

// Setup queue
const queue = new Queue<GenerateJob>('frasberg-generation', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

// Setup worker
const client = createFrasbergClient();

const worker = new Worker<GenerateJob>(
  'frasberg-generation',
  async (job) => {
    const { prompt, type } = job.data;
    
    console.log(`Processing job ${job.id}: ${type}`);
    
    switch (type) {
      case 'text':
        return await client.generateText(prompt);
      case 'image':
        return await client.generateImage(prompt);
      case 'video':
        return await client.generateVideo(prompt);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  },
  {
    connection: {
      host: 'localhost',
      port: 6379
    },
    concurrency: 5  // Process 5 jobs concurrently
  }
);

// Add jobs to queue
async function addJob(prompt: string, type: GenerateJob['type']) {
  const job = await queue.add('generate', {
    id: Math.random().toString(36),
    prompt,
    type
  });
  
  return job.id;
}

// Usage
const jobId = await addJob('Generate text', 'text');
console.log(`Job ${jobId} added to queue`);
```

## Rate Limiting

### Token Bucket Algorithm

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

class RateLimitedClient {
  private client: ReturnType<typeof createFrasbergClient>;
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;
  
  constructor(maxTokens: number = 10, refillRate: number = 1) {
    this.client = createFrasbergClient();
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;  // tokens per second
    this.lastRefill = Date.now();
  }
  
  async generateText(prompt: string): Promise<string> {
    await this.acquireToken();
    return await this.client.generateText(prompt);
  }
  
  private async acquireToken(): Promise<void> {
    this.refillTokens();
    
    while (this.tokens < 1) {
      // Wait and try again
      await this.sleep(100);
      this.refillTokens();
    }
    
    this.tokens -= 1;
  }
  
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const client = new RateLimitedClient(10, 2);  // 10 tokens, refill 2/sec

for (let i = 0; i < 20; i++) {
  const result = await client.generateText(`Prompt ${i}`);
  console.log(`Generated ${i + 1}/20`);
}
```

## Streaming (Conceptual)

### Stream-Like Interface

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import { EventEmitter } from 'events';

class StreamingClient extends EventEmitter {
  private client: ReturnType<typeof createFrasbergClient>;
  
  constructor() {
    super();
    this.client = createFrasbergClient();
  }
  
  async generateTextStream(prompt: string): Promise<void> {
    this.emit('start', { prompt });
    
    try {
      // Simulate streaming by chunking response
      const fullText = await this.client.generateText(prompt);
      const words = fullText.split(' ');
      
      for (const word of words) {
        this.emit('data', word + ' ');
        await this.sleep(50);  // Simulate delay
      }
      
      this.emit('end', { fullText });
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const client = new StreamingClient();

client.on('start', ({ prompt }) => {
  console.log('Starting generation for:', prompt);
});

client.on('data', (chunk) => {
  process.stdout.write(chunk);
});

client.on('end', () => {
  console.log('\nGeneration complete!');
});

client.on('error', (error) => {
  console.error('Error:', error);
});

await client.generateTextStream('Tell me a story');
```

## Middleware Pattern

### Request/Response Middleware

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

type Middleware = (
  request: any,
  next: () => Promise<any>
) => Promise<any>;

class MiddlewareClient {
  private client: ReturnType<typeof createFrasbergClient>;
  private middlewares: Middleware[] = [];
  
  constructor() {
    this.client = createFrasbergClient();
  }
  
  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }
  
  async generateText(prompt: string): Promise<string> {
    let index = 0;
    
    const next = async (): Promise<any> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return await middleware({ method: 'generateText', prompt }, next);
      }
      return await this.client.generateText(prompt);
    };
    
    return await next();
  }
}

// Middleware examples
const loggingMiddleware: Middleware = async (request, next) => {
  console.log(`[${new Date().toISOString()}] ${request.method}:`, request.prompt);
  const result = await next();
  console.log(`[${new Date().toISOString()}] Completed`);
  return result;
};

const timingMiddleware: Middleware = async (request, next) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  console.log(`Duration: ${duration}ms`);
  return result;
};

const validationMiddleware: Middleware = async (request, next) => {
  if (!request.prompt || request.prompt.length === 0) {
    throw new Error('Prompt cannot be empty');
  }
  return await next();
};

// Usage
const client = new MiddlewareClient()
  .use(validationMiddleware)
  .use(loggingMiddleware)
  .use(timingMiddleware);

const result = await client.generateText('Hello');
```

## Decorator Pattern

### Method Decorators

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

// Caching decorator
function cached(ttl: number = 3600000) {
  const cache = new Map<string, { value: any; expires: number }>();
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);
      
      if (cached && Date.now() < cached.expires) {
        console.log('Cache hit');
        return cached.value;
      }
      
      const result = await originalMethod.apply(this, args);
      cache.set(key, {
        value: result,
        expires: Date.now() + ttl
      });
      
      return result;
    };
    
    return descriptor;
  };
}

// Retry decorator
function retry(attempts: number = 3) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      let lastError: Error;
      
      for (let i = 0; i < attempts; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;
          if (i < attempts - 1) {
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, i) * 1000)
            );
          }
        }
      }
      
      throw lastError!;
    };
    
    return descriptor;
  };
}

// Usage
class DecoratedClient {
  private client = createFrasbergClient();
  
  @cached(3600000)  // Cache for 1 hour
  @retry(3)         // Retry up to 3 times
  async generateText(prompt: string): Promise<string> {
    return await this.client.generateText(prompt);
  }
}

const client = new DecoratedClient();
const result = await client.generateText('Hello');
```

## Advanced Error Recovery

### Fallback Strategy

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

class FallbackClient {
  private primaryClient: ReturnType<typeof createFrasbergClient>;
  private fallbackResponses: Map<string, string>;
  
  constructor() {
    this.primaryClient = createFrasbergClient();
    this.fallbackResponses = new Map([
      ['greeting', 'Hello! How can I help you?'],
      ['farewell', 'Goodbye! Have a great day!'],
      ['error', 'I apologize, but I\'m having trouble processing that right now.']
    ]);
  }
  
  async generateText(prompt: string): Promise<string> {
    try {
      return await this.primaryClient.generateText(prompt);
    } catch (error) {
      console.warn('Primary generation failed, using fallback');
      return this.getFallbackResponse(prompt);
    }
  }
  
  private getFallbackResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return this.fallbackResponses.get('greeting')!;
    }
    
    if (lowerPrompt.includes('bye') || lowerPrompt.includes('goodbye')) {
      return this.fallbackResponses.get('farewell')!;
    }
    
    return this.fallbackResponses.get('error')!;
  }
}

// Usage
const client = new FallbackClient();
const result = await client.generateText('Hello there');
console.log(result);  // Will use fallback if API fails
```

## Related Documentation

- [Basic Usage](basic-usage.md) - Simple examples
- [Integration Examples](integration-examples.md) - Framework integrations
- [Best Practices](../guides/best-practices.md) - Recommended patterns
- [Performance Guidelines](../operations/performance.md) - Optimization tips

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
