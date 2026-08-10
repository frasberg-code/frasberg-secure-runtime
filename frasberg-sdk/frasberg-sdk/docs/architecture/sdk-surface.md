# SDK Surface

The public API surface of the Frasberg SDK.

## Design Philosophy

The SDK surface is intentionally minimal:

1. **Small API** - Few functions, clear purpose
2. **No Surprises** - Predictable behavior
3. **Type Safe** - Full TypeScript support
4. **Stable** - Minimal breaking changes

## Public Exports

Located in `src/index.ts`:

```typescript
// Functions
export { createFrasbergClient } from './client/createFrasbergClient';
export { loadFrasbergConfig } from './config/loadFrasbergConfig';

// Types
export type { FrasbergClient } from './client/createFrasbergClient';
export type { FrasbergSystemConfig } from './config/types';
```

## API Functions

### createFrasbergClient()

Creates a Frasberg SDK client instance.

**Signature:**
```typescript
function createFrasbergClient(): FrasbergClient
```

**Returns:** `FrasbergClient` instance

**Throws:** `Error` if configuration is invalid

**Example:**
```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
```

### loadFrasbergConfig()

Loads SDK configuration from environment.

**Signature:**
```typescript
function loadFrasbergConfig(): FrasbergSystemConfig
```

**Returns:** `FrasbergSystemConfig` object

**Example:**
```typescript
import { loadFrasbergConfig } from '@frasberg/core-sdk';

const config = loadFrasbergConfig();
```

## API Types

### FrasbergClient

Interface for the SDK client.

```typescript
interface FrasbergClient {
  generateText(input: string): Promise<string>;
  generateImage(prompt: string): Promise<Buffer>;
  generateVideo(prompt: string): Promise<Buffer>;
}
```

**Methods:**

- **generateText** - Generate text from prompt
- **generateImage** - Generate image from prompt
- **generateVideo** - Generate video from prompt

### FrasbergSystemConfig

Configuration type for the SDK.

```typescript
interface FrasbergSystemConfig {
  // Internal configuration structure
}
```

## API Stability

### Semantic Versioning

The SDK follows [SemVer 2.0.0](https://semver.org/):

- **Patch** (x.y.Z) - Bug fixes, no API changes
- **Minor** (x.Y.z) - New features, backward compatible
- **Major** (X.y.z) - Breaking changes

### Stability Guarantee

Current API (v1.x.x) guarantees:

1. Function signatures won't change
2. Return types won't change
3. Error behavior stays consistent
4. TypeScript types remain compatible

## API Surface Guidelines

### What's Included

- Core client creation
- Generation methods
- Configuration loading
- Essential types

### What's Excluded

- Internal utilities (not exported)
- Provider implementations (internal)
- HTTP client (internal)
- Request/response parsing (internal)

## Internal vs Public

### Public (Exported)

```typescript
// ✅ Public API
export { createFrasbergClient } from './client/createFrasbergClient';
export type { FrasbergClient } from './client/createFrasbergClient';
```

### Internal (Not Exported)

```typescript
// ❌ Internal implementation
function validateApiKey(key: string): boolean {
  // Internal validation logic
}

function buildRequestHeaders(apiKey: string): Record<string, string> {
  // Internal header construction
}
```

## Usage Patterns

### Basic Usage

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
const result = await client.generateText('Hello');
```

### With Type Annotations

```typescript
import { createFrasbergClient, FrasbergClient } from '@frasberg/core-sdk';

const client: FrasbergClient = createFrasbergClient();
const text: string = await client.generateText('Hello');
```

### Configuration Check

```typescript
import { loadFrasbergConfig } from '@frasberg/core-sdk';

try {
  const config = loadFrasbergConfig();
  console.log('Configuration valid');
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

## Extension Patterns

The API surface supports extension without modification:

### Wrapper Pattern

```typescript
import { createFrasbergClient, FrasbergClient } from '@frasberg/core-sdk';

interface ExtendedClient extends FrasbergClient {
  generateTextCached(input: string): Promise<string>;
}

function createExtendedClient(): ExtendedClient {
  const client = createFrasbergClient();
  const cache = new Map<string, string>();
  
  return {
    ...client,
    async generateTextCached(input: string) {
      if (cache.has(input)) return cache.get(input)!;
      const result = await client.generateText(input);
      cache.set(input, result);
      return result;
    }
  };
}
```

### Decorator Pattern

```typescript
function withRetry<T extends FrasbergClient>(client: T): T {
  return new Proxy(client, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== 'function') return original;
      
      return async function(...args: any[]) {
        for (let i = 0; i < 3; i++) {
          try {
            return await original.apply(target, args);
          } catch (error) {
            if (i === 2) throw error;
          }
        }
      };
    }
  });
}

const client = withRetry(createFrasbergClient());
```

## API Evolution

### Adding Features (Minor Version)

New optional methods can be added:

```typescript
// v1.0.0
interface FrasbergClient {
  generateText(input: string): Promise<string>;
  generateImage(prompt: string): Promise<Buffer>;
  generateVideo(prompt: string): Promise<Buffer>;
}

// v1.1.0 - New optional feature
interface FrasbergClient {
  generateText(input: string): Promise<string>;
  generateImage(prompt: string): Promise<Buffer>;
  generateVideo(prompt: string): Promise<Buffer>;
  generateTextStream?(input: string): AsyncIterator<string>; // New
}
```

### Breaking Changes (Major Version)

Signature changes require major version bump:

```typescript
// v1.x.x
generateText(input: string): Promise<string>;

// v2.0.0 - Breaking change
generateText(options: TextOptions): Promise<TextResult>;
```

## Documentation

Each exported function/type is documented:

```typescript
/**
 * Creates a Frasberg SDK client instance.
 * 
 * @returns A configured FrasbergClient instance
 * @throws {Error} If FRASBERG_API_KEY is not set
 * 
 * @example
 * ```typescript
 * const client = createFrasbergClient();
 * const result = await client.generateText('Hello');
 * ```
 */
export function createFrasbergClient(): FrasbergClient {
  // Implementation
}
```

## Testing Surface

All public API is tested:

```typescript
describe('Public API', () => {
  it('exports createFrasbergClient', () => {
    expect(typeof createFrasbergClient).toBe('function');
  });
  
  it('exports loadFrasbergConfig', () => {
    expect(typeof loadFrasbergConfig).toBe('function');
  });
  
  it('exports FrasbergClient type', () => {
    const client: FrasbergClient = createFrasbergClient();
    expect(client).toHaveProperty('generateText');
    expect(client).toHaveProperty('generateImage');
    expect(client).toHaveProperty('generateVideo');
  });
});
```

## Related Documentation

- [Client API](../api/client.md) - Detailed API reference
- [Types Reference](../api/types.md) - TypeScript types
- [Architecture Overview](overview.md) - System design
- [Versioning Policy](../governance/versioning.md) - Version strategy
