# Types API Reference

TypeScript type definitions for the Frasberg SDK.

## Exported Types

### FrasbergClient

The main client interface for the SDK.

```typescript
interface FrasbergClient {
  generateText: (input: string) => Promise<string>;
  generateImage: (prompt: string) => Promise<Buffer>;
  generateVideo: (prompt: string) => Promise<Buffer>;
}
```

**Usage:**

```typescript
import { FrasbergClient } from '@frasberg/core-sdk';

let client: FrasbergClient;
```

---

### FrasbergSystemConfig

Configuration type for the SDK system.

```typescript
interface FrasbergSystemConfig {
  // Configuration fields
  // (Internal structure)
}
```

**Usage:**

```typescript
import { FrasbergSystemConfig } from '@frasberg/core-sdk';

const config: FrasbergSystemConfig = loadFrasbergConfig();
```

---

## Internal Types

These types are used internally but not exported in the public API.

### Request Types

```typescript
// Text generation request
interface TextRequest {
  input: string;
}

// Image generation request
interface ImageRequest {
  prompt: string;
}

// Video generation request
interface VideoRequest {
  prompt: string;
}
```

### Response Types

```typescript
// Text generation response
interface TextResponse {
  output: string;
}

// Image response (binary data)
type ImageResponse = Buffer;

// Video response (binary data)
type VideoResponse = Buffer;
```

---

## Type Guards

Create type guards for runtime type checking:

```typescript
function isFrasbergClient(obj: any): obj is FrasbergClient {
  return (
    obj &&
    typeof obj.generateText === 'function' &&
    typeof obj.generateImage === 'function' &&
    typeof obj.generateVideo === 'function'
  );
}

// Usage
if (isFrasbergClient(client)) {
  await client.generateText('Hello');
}
```

---

## Custom Types

Define your own types for application-specific needs:

### Generation Options

```typescript
interface GenerationOptions {
  retries?: number;
  timeout?: number;
  onProgress?: (progress: number) => void;
}

async function generateText(
  client: FrasbergClient,
  prompt: string,
  options: GenerationOptions = {}
): Promise<string> {
  const { retries = 3, timeout = 30000 } = options;
  // Implementation
}
```

### Result Types

```typescript
interface GenerationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

async function safeGenerate(
  prompt: string
): Promise<GenerationResult<string>> {
  const start = Date.now();
  
  try {
    const data = await client.generateText(prompt);
    return {
      success: true,
      data,
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - start
    };
  }
}
```

### Batch Types

```typescript
interface BatchRequest {
  prompts: string[];
  concurrency?: number;
}

interface BatchResult {
  results: string[];
  errors: Array<{ index: number; error: string }>;
  duration: number;
}

async function batchGenerate(
  client: FrasbergClient,
  request: BatchRequest
): Promise<BatchResult> {
  // Implementation
}
```

---

## Generic Types

Useful generic types for working with the SDK:

```typescript
// Async function type
type AsyncFn<T, R> = (arg: T) => Promise<R>;

// Generation function type
type GenerationFn<T> = () => Promise<T>;

// Result mapper type
type ResultMapper<T, R> = (result: T) => R;

// Error handler type
type ErrorHandler = (error: Error) => void;
```

**Usage:**

```typescript
const textGenerator: GenerationFn<string> = () =>
  client.generateText('Hello');

const mapper: ResultMapper<string, number> = (text) =>
  text.length;

const errorHandler: ErrorHandler = (error) =>
  console.error('Error:', error.message);
```

---

## Utility Types

TypeScript utility types for common patterns:

### Promisify

```typescript
type Promisify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : T[K];
};
```

### Optional Fields

```typescript
type OptionalFields<T, K extends keyof T> = Omit<T, K> & 
  Partial<Pick<T, K>>;

// Example
interface Request {
  prompt: string;
  maxTokens: number;
  temperature: number;
}

type RequestWithDefaults = OptionalFields<
  Request,
  'maxTokens' | 'temperature'
>;
```

### Async Return Type

```typescript
type AsyncReturnType<T extends (...args: any) => any> = 
  T extends (...args: any) => Promise<infer R> ? R : never;

// Example
type TextResult = AsyncReturnType<FrasbergClient['generateText']>;
// TextResult = string
```

---

## Enums

Define enums for typed constants:

```typescript
enum GenerationType {
  Text = 'text',
  Image = 'image',
  Video = 'video'
}

enum ErrorCode {
  Unauthorized = 401,
  Forbidden = 403,
  RateLimit = 429,
  ServerError = 500,
  Timeout = 504
}

// Usage
async function generate(type: GenerationType, prompt: string) {
  switch (type) {
    case GenerationType.Text:
      return await client.generateText(prompt);
    case GenerationType.Image:
      return await client.generateImage(prompt);
    case GenerationType.Video:
      return await client.generateVideo(prompt);
  }
}
```

---

## Type Assertion Helpers

```typescript
function assertString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
}

function assertBuffer(value: unknown): asserts value is Buffer {
  if (!Buffer.isBuffer(value)) {
    throw new Error('Expected Buffer');
  }
}

// Usage
const result = await client.generateText('Hello');
assertString(result);
// TypeScript now knows result is string
```

---

## Discriminated Unions

For handling different result types:

```typescript
type GenerationResult =
  | { type: 'text'; data: string }
  | { type: 'image'; data: Buffer }
  | { type: 'video'; data: Buffer };

function processResult(result: GenerationResult) {
  switch (result.type) {
    case 'text':
      console.log('Text:', result.data);
      break;
    case 'image':
      console.log('Image size:', result.data.length);
      break;
    case 'video':
      console.log('Video size:', result.data.length);
      break;
  }
}
```

---

## Type Examples

### Wrapped Client

```typescript
interface WrappedClient {
  client: FrasbergClient;
  metrics: {
    requestCount: number;
    errorCount: number;
  };
}

function createWrappedClient(client: FrasbergClient): WrappedClient {
  return {
    client,
    metrics: {
      requestCount: 0,
      errorCount: 0
    }
  };
}
```

### Configuration Builder

```typescript
interface ConfigBuilder {
  setApiKey(key: string): ConfigBuilder;
  setApiUrl(url: string): ConfigBuilder;
  build(): void;
}

const config: ConfigBuilder = {
  setApiKey(key: string) {
    process.env.FRASBERG_API_KEY = key;
    return this;
  },
  setApiUrl(url: string) {
    process.env.FRASBERG_API_URL = url;
    return this;
  },
  build() {
    // Validation logic
  }
};
```

---

## Best Practices

### 1. Use Explicit Types

```typescript
// ✅ Good
const client: FrasbergClient = createFrasbergClient();

// ❌ Avoid implicit any
const client = createFrasbergClient() as any;
```

### 2. Leverage Type Inference

```typescript
// ✅ Good - type is inferred
const result = await client.generateText('Hello');

// ❌ Unnecessary annotation
const result: string = await client.generateText('Hello');
```

### 3. Use Generics for Reusability

```typescript
// ✅ Good
async function processGeneration<T>(
  fn: () => Promise<T>,
  processor: (data: T) => void
): Promise<T> {
  const result = await fn();
  processor(result);
  return result;
}
```

### 4. Document Complex Types

```typescript
/**
 * Configuration for batch text generation
 */
interface BatchConfig {
  /** Maximum number of concurrent requests */
  maxConcurrency: number;
  
  /** Timeout in milliseconds per request */
  timeout: number;
  
  /** Callback for progress updates */
  onProgress?: (completed: number, total: number) => void;
}
```

---

## Related Documentation

- [Client API](client.md) - Client methods and usage
- [Configuration API](config.md) - Configuration types
- [Best Practices](../guides/best-practices.md) - TypeScript patterns
