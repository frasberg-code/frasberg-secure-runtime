# Runtime Loader

The Frasberg AI SDK uses a simple, deterministic runtime loading mechanism.

## Loading Strategy

The SDK employs **static loading** - all code is bundled and loaded at import time.

## No Dynamic Loading

The SDK does **not** use:
- Dynamic imports (`import()`)
- `require()` at runtime
- Plugin systems
- Module resolution at runtime
- Conditional provider loading

## Import Flow

```
Application imports SDK
         │
         ▼
index.ts exports
         │
         ├─► createFrasbergClient
         ├─► loadFrasbergConfig
         └─► Types
               │
               ▼
All dependencies loaded statically
         │
         ├─► client/createFrasbergClient.ts
         └─► config/loadFrasbergConfig.ts
                   │
                   └─► config/types.ts
```

## Module Structure

### Entry Point (`src/index.ts`)

```typescript
export { createFrasbergClient } from './client/createFrasbergClient';
export { loadFrasbergConfig } from './config/loadFrasbergConfig';

export type { FrasbergClient } from './client/createFrasbergClient';
export type { FrasbergSystemConfig } from './config/types';
```

### Client Module (`src/client/createFrasbergClient.ts`)

```typescript
import { loadFrasbergConfig } from '../config/loadFrasbergConfig';

export interface FrasbergClient {
  generateText: (input: string) => Promise<string>;
  generateImage: (prompt: string) => Promise<Buffer>;
  generateVideo: (prompt: string) => Promise<Buffer>;
}

export function createFrasbergClient(): FrasbergClient {
  const config = loadFrasbergConfig();
  // Implementation
  return { /* ... */ };
}
```

### Config Module (`src/config/loadFrasbergConfig.ts`)

```typescript
import { FrasbergSystemConfig } from './types';

export function loadFrasbergConfig(): FrasbergSystemConfig {
  // Load and validate configuration
  return { /* ... */ };
}
```

## Build Output

The SDK is compiled to multiple formats:

### CommonJS (`dist/index.js`)

```javascript
// For require()
exports.createFrasbergClient = function() { /* ... */ };
exports.loadFrasbergConfig = function() { /* ... */ };
```

### ES Module (`dist/index.mjs`)

```javascript
// For import
export function createFrasbergClient() { /* ... */ }
export function loadFrasbergConfig() { /* ... */ }
```

### Type Definitions (`dist/index.d.ts`)

```typescript
export declare function createFrasbergClient(): FrasbergClient;
export declare function loadFrasbergConfig(): FrasbergSystemConfig;
export interface FrasbergClient { /* ... */ }
export interface FrasbergSystemConfig { /* ... */ }
```

## Package Exports

Configured in `package.json`:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "module": "dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## Loading Guarantees

### 1. Deterministic Loading

The same imports always load the same code:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
// Always loads the same modules
// No runtime conditionals
```

### 2. No Side Effects

Importing the SDK has no side effects:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
// No HTTP requests
// No file system access
// No environment modifications
```

### 3. Lazy Initialization

Actual work happens only when methods are called:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
// SDK code loaded, but not initialized

const client = createFrasbergClient();
// Configuration loaded, client created

await client.generateText('Hello');
// HTTP request made
```

## Tree Shaking

The SDK supports tree shaking for unused exports:

```typescript
// Only imports what you use
import { createFrasbergClient } from '@frasberg/core-sdk';
// loadFrasbergConfig is not bundled if not used
```

## Runtime Dependencies

The SDK has **zero runtime dependencies**:

```json
{
  "dependencies": {}
}
```

Built-in Node.js modules used:
- `Buffer` (built-in)
- `fetch` (Node.js 18+)

## Compatibility

### Node.js Versions

- **Minimum:** Node.js 18.x (for native `fetch`)
- **Recommended:** Node.js 20.x LTS
- **Tested:** Node.js 18.x, 20.x, 22.x

### Module Systems

Supports both:

**CommonJS:**
```javascript
const { createFrasbergClient } = require('@frasberg/core-sdk');
```

**ES Modules:**
```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
```

## Error Handling During Load

### Missing Dependencies

Since there are no dependencies, this cannot fail.

### Invalid Environment

Configuration errors are caught at runtime, not load time:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
// ✓ Import succeeds

const client = createFrasbergClient();
// ✗ May throw if FRASBERG_AI_API_KEY is missing
```

## Performance

### Load Time

- **Cold start:** < 50ms
- **Hot start:** < 10ms
- **Memory footprint:** < 1MB

### Bundle Size

- **Uncompressed:** ~10KB
- **Gzipped:** ~3KB

## Future Considerations

### Plugin System (Not Planned)

The SDK intentionally avoids plugins to maintain simplicity:

```typescript
// ❌ NOT IMPLEMENTED
interface Plugin {
  name: string;
  onRequest?: (req: Request) => Request;
  onResponse?: (res: Response) => Response;
}

function registerPlugin(plugin: Plugin) {
  // Not implemented
}
```

### Dynamic Providers (Not Planned)

All providers are known at build time:

```typescript
// ❌ NOT IMPLEMENTED
async function loadProvider(name: string) {
  return await import(`./providers/${name}`);
}

// ✅ ACTUAL - Static provider
const provider = new FrasbergAIProvider();
```

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Build SDK
npm run build

# Test locally
npm link
cd ../your-project
npm link @frasberg/core-sdk
```

### Type Checking

```bash
# Check types without emitting
npx tsc --noEmit
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
ls -lh dist/
```

## Related Documentation

- [Architecture Overview](overview.md) - System design
- [SDK Surface](sdk-surface.md) - Public API
- [Development Workflow](../development/local-workflow.md) - Dev guide
