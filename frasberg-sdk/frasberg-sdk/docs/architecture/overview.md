# Architecture Overview

High-level architecture of the Frasberg SDK.

## Design Principles

The Frasberg SDK is built on four core principles:

1. **Sovereign Provider Model** - Single, exclusive API provider (Frasberg)
2. **Zero External Dependencies** - No runtime dependencies on third-party packages
3. **Type Safety First** - Full TypeScript support with strict typing
4. **Minimal Surface Area** - Small, focused API with clear boundaries

## System Architecture

```
┌─────────────────────────────────────────────┐
│           Application Code                   │
│  (User's TypeScript/JavaScript Project)     │
└──────────────┬──────────────────────────────┘
               │
               │ imports
               ▼
┌─────────────────────────────────────────────┐
│          Frasberg SDK                      │
│  ┌───────────────────────────────────────┐  │
│  │   Public API (index.ts)               │  │
│  │   - createFrasbergClient()               │  │
│  │   - loadFrasbergConfig()                 │  │
│  └────────────┬──────────────────────────┘  │
│               │                              │
│  ┌────────────▼──────────────────────────┐  │
│  │   Client Layer                        │  │
│  │   - generateText()                    │  │
│  │   - generateImage()                   │  │
│  │   - generateVideo()                   │  │
│  └────────────┬──────────────────────────┘  │
│               │                              │
│  ┌────────────▼──────────────────────────┐  │
│  │   Configuration Layer                 │  │
│  │   - Environment validation            │  │
│  │   - API key management                │  │
│  └────────────┬──────────────────────────┘  │
│               │                              │
└───────────────┼──────────────────────────────┘
                │
                │ HTTP/HTTPS
                ▼
┌─────────────────────────────────────────────┐
│       Frasberg API                        │
│  ┌───────────────────────────────────────┐  │
│  │   /v1/text                            │  │
│  │   /v1/image                           │  │
│  │   /v1/video                           │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Layer Descriptions

### Application Layer

User's application code that imports and uses the SDK.

**Responsibilities:**
- Import SDK functions
- Provide prompts and inputs
- Handle results and errors
- Implement business logic

### Public API Layer

The exported interface (`src/index.ts`).

**Exports:**
- `createFrasbergClient()` - Client factory function
- `loadFrasbergConfig()` - Configuration loader
- `FrasbergClient` - TypeScript interface
- `FrasbergSystemConfig` - Configuration type

### Client Layer

Core client implementation (`src/client/createFrasbergClient.ts`).

**Responsibilities:**
- Create client instances
- Implement generation methods
- Make HTTP requests
- Parse responses
- Throw errors appropriately

### Configuration Layer

Environment and configuration management (`src/config/`).

**Responsibilities:**
- Load environment variables
- Validate configuration
- Provide defaults
- Enforce security policies

### Frasberg API

External HTTP API (not part of the SDK).

**Endpoints:**
- `POST /v1/text` - Text generation
- `POST /v1/image` - Image generation
- `POST /v1/video` - Video generation

## Data Flow

### Text Generation Flow

```
User Code
  │
  └─► createFrasbergClient()
        │
        └─► Load environment variables
              │
              └─► Validate API key
                    │
                    └─► Create client instance
                          │
User Code                 │
  │                       │
  └─► client.generateText("prompt")
        │                 │
        └─────────────────┘
                          │
                          └─► Prepare HTTP request
                                │
                                └─► POST /v1/text
                                      │
                                      └─► Frasberg API
                                            │
                                            └─► Process prompt
                                                  │
                                                  └─► Generate text
                                                        │
                                                        └─► Return JSON
                                                              │
                          ┌───────────────────────────────────┘
                          │
                          └─► Parse response
                                │
                                └─► Extract text
                                      │
                                      └─► Return to user
```

### Error Flow

```
User Code
  │
  └─► client.generateText("prompt")
        │
        └─► HTTP Request
              │
              ├─► Success (200-299)
              │     │
              │     └─► Return data
              │
              └─► Error (4xx, 5xx)
                    │
                    └─► Throw Error
                          │
                          └─► User's catch block
```

## File Structure

```
src/
├── index.ts                    # Public API exports
├── client/
│   └── createFrasbergClient.ts   # Client implementation
└── config/
    ├── loadFrasbergConfig.ts     # Configuration loader
    └── types.ts               # Configuration types
```

## Request/Response Contracts

### Text Generation

**Request:**
```typescript
POST /v1/text
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {API_KEY}'
}
Body: {
  "input": "prompt text"
}
```

**Response:**
```typescript
200 OK
Body: {
  "output": "generated text"
}
```

### Image Generation

**Request:**
```typescript
POST /v1/image
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {API_KEY}'
}
Body: {
  "prompt": "image description"
}
```

**Response:**
```typescript
200 OK
Content-Type: image/png
Body: <binary PNG data>
```

### Video Generation

**Request:**
```typescript
POST /v1/video
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {API_KEY}'
}
Body: {
  "prompt": "video description"
}
```

**Response:**
```typescript
200 OK
Content-Type: video/mp4
Body: <binary MP4 data>
```

## Security Architecture

### Authentication

- API key required for all requests
- Bearer token authentication
- Keys stored in environment variables
- No keys in source code

### Transport Security

- HTTPS only
- TLS 1.2+ required
- Certificate validation enforced

### Configuration Security

- Environment variable isolation
- No global state
- No credential caching
- Secure defaults

## Performance Characteristics

### Latency

- **Text:** 5-30 seconds typical
- **Image:** 30-90 seconds typical
- **Video:** 120-300 seconds typical

### Throughput

- No client-side batching
- Concurrent requests supported
- Rate limiting at API level

### Memory

- Minimal footprint
- No persistent caching
- Buffers released after use

## Scalability

### Horizontal Scaling

The SDK is stateless and scales horizontally:
- Multiple client instances
- No shared state
- Thread-safe

### Vertical Scaling

Resource usage is minimal:
- Low CPU overhead
- Memory proportional to response size
- No background workers

## Extension Points

The SDK is intentionally minimal, but can be extended:

### Custom Wrappers

```typescript
function createCachedClient() {
  const client = createFrasbergClient();
  const cache = new Map();
  
  return {
    generateText: async (input: string) => {
      if (cache.has(input)) return cache.get(input);
      const result = await client.generateText(input);
      cache.set(input, result);
      return result;
    },
    // ... other methods
  };
}
```

### Middleware Pattern

```typescript
type Middleware = (
  fn: () => Promise<any>
) => Promise<any>;

function withRetry(retries: number): Middleware {
  return async (fn) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
      }
    }
  };
}
```

## Related Documentation

- [Provider Model](provider-model.md) - Provider architecture
- [SDK Surface](sdk-surface.md) - Public API design
- [Provider Abstraction](provider-abstraction.md) - Provider contract
- [Runtime Loader](runtime-loader.md) - Loading mechanism
