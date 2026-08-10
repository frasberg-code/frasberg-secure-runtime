# Provider Abstraction Contract

This document defines the contract that all providers must implement to integrate with the Frasberg AI SDK.

## Provider Interface

Every provider must implement:

```typescript
export interface FrasbergProvider {
  name: string;
  generateText?(input: TextRequest): Promise<TextResponse>;
  generateImage?(input: ImageRequest): Promise<ImageResponse>;
  generateVideo?(input: VideoRequest): Promise<VideoResponse>;
}
```

## Request Normalization

All requests are normalized before reaching the provider:

### TextRequest
```typescript
{
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}
```

### ImageRequest
```typescript
{
  prompt: string;
  width?: number;
  height?: number;
}
```

### VideoRequest
```typescript
{
  prompt: string;
  duration?: number;
  resolution?: string;
}
```

## Response Normalization

Providers must return normalized responses:

### TextResponse
```typescript
{ text: string; }
```

### ImageResponse
```typescript
{ url: string; }
```

### VideoResponse
```typescript
{ url: string; }
```

## Error Contract

Providers must throw errors using the SDK's unified shape:

```typescript
throw {
  name: "FrasbergRequestError",
  message: "Provider failed to generate text.",
  code: "REQUEST_FAILED",
  cause: err
};
```

## Provider Isolation

- No shared state between providers
- No global variables
- No cross-provider communication
- No leaking of provider URLs or API keys

## Current Implementation

### Frasberg AI Provider

The current SDK implements a single provider: Frasberg AI.

```typescript
class FrasbergAIProvider implements FrasbergProvider {
  name = 'frasberg-ai';
  
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.FRASBERG_AI_API_KEY || '';
    this.baseUrl = process.env.FRASBERG_AI_API_URL || 
      'https://api.frasberg-ai.yourdomain.com';
    
    if (!this.apiKey) {
      throw new Error('FRASBERG_AI_API_KEY is missing');
    }
  }
  
  async generateText(input: TextRequest): Promise<TextResponse> {
    const response = await fetch(`${this.baseUrl}/v1/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: input.prompt })
    });
    
    if (!response.ok) {
      throw {
        name: 'FrasbergRequestError',
        message: `Text generation failed: ${response.status}`,
        code: 'REQUEST_FAILED'
      };
    }
    
    const data = await response.json();
    return { text: data.output };
  }
  
  async generateImage(input: ImageRequest): Promise<ImageResponse> {
    const response = await fetch(`${this.baseUrl}/v1/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: input.prompt })
    });
    
    if (!response.ok) {
      throw {
        name: 'FrasbergRequestError',
        message: `Image generation failed: ${response.status}`,
        code: 'REQUEST_FAILED'
      };
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    // In normalized response, we would return URL
    // Current implementation returns Buffer directly
    return { url: `data:image/png;base64,${buffer.toString('base64')}` };
  }
  
  async generateVideo(input: VideoRequest): Promise<VideoResponse> {
    const response = await fetch(`${this.baseUrl}/v1/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: input.prompt })
    });
    
    if (!response.ok) {
      throw {
        name: 'FrasbergRequestError',
        message: `Video generation failed: ${response.status}`,
        code: 'REQUEST_FAILED'
      };
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    return { url: `data:video/mp4;base64,${buffer.toString('base64')}` };
  }
}
```

## Provider Registration

In a multi-provider system, providers would be registered:

```typescript
// Future pattern (not currently implemented)
const providerRegistry = new Map<string, FrasbergProvider>();

function registerProvider(provider: FrasbergProvider) {
  providerRegistry.set(provider.name, provider);
}

function getProvider(name: string): FrasbergProvider {
  const provider = providerRegistry.get(name);
  if (!provider) {
    throw new Error(`Provider ${name} not found`);
  }
  return provider;
}

// Register Frasberg AI
registerProvider(new FrasbergAIProvider());
```

## Provider Selection

Currently, there is no provider selection - Frasberg AI is always used:

```typescript
// Current implementation
export function createFrasbergClient(): FrasbergClient {
  // Always creates Frasberg AI provider
  const provider = new FrasbergAIProvider();
  
  return {
    generateText: (input) => provider.generateText({ prompt: input }),
    generateImage: (prompt) => provider.generateImage({ prompt }),
    generateVideo: (prompt) => provider.generateVideo({ prompt })
  };
}
```

## Error Handling Contract

### Error Structure

```typescript
interface FrasbergError {
  name: 'FrasbergRequestError' | 'FrasbergConfigError' | 'FrasbergValidationError';
  message: string;
  code: string;
  cause?: Error;
}
```

### Error Codes

| Code | Meaning | Provider Action |
|------|---------|----------------|
| `CONFIG_MISSING` | Configuration missing | Throw during initialization |
| `REQUEST_FAILED` | HTTP request failed | Throw with status code in message |
| `PARSE_ERROR` | Response parsing failed | Throw with details |
| `TIMEOUT` | Request timeout | Throw after timeout period |
| `RATE_LIMIT` | Rate limit exceeded | Throw with 429 status |

### Error Examples

```typescript
// Configuration error
throw {
  name: 'FrasbergConfigError',
  message: 'API key not configured',
  code: 'CONFIG_MISSING'
};

// Request error
throw {
  name: 'FrasbergRequestError',
  message: 'Text generation failed: 401',
  code: 'REQUEST_FAILED'
};

// Parsing error
throw {
  name: 'FrasbergRequestError',
  message: 'Failed to parse response',
  code: 'PARSE_ERROR',
  cause: originalError
};
```

## Request/Response Flow

```
Client Request
     │
     ▼
Request Normalization
     │
     ▼
Provider.generateText()
     │
     ├─► Validate input
     │
     ├─► Build HTTP request
     │
     ├─► Execute request
     │
     ├─► Check response status
     │
     ├─► Parse response
     │
     └─► Normalize response
           │
           ▼
     TextResponse
           │
           ▼
     Client receives result
```

## Validation Contract

### Input Validation

Providers must validate:

```typescript
function validateTextRequest(input: TextRequest): void {
  if (!input.prompt || typeof input.prompt !== 'string') {
    throw {
      name: 'FrasbergValidationError',
      message: 'Prompt must be a non-empty string',
      code: 'INVALID_INPUT'
    };
  }
  
  if (input.prompt.length === 0) {
    throw {
      name: 'FrasbergValidationError',
      message: 'Prompt cannot be empty',
      code: 'INVALID_INPUT'
    };
  }
}
```

### Response Validation

Providers must validate responses:

```typescript
function validateTextResponse(data: any): TextResponse {
  if (!data || typeof data.output !== 'string') {
    throw {
      name: 'FrasbergRequestError',
      message: 'Invalid response format',
      code: 'PARSE_ERROR'
    };
  }
  
  return { text: data.output };
}
```

## Provider Lifecycle

### Initialization

```typescript
constructor() {
  // 1. Load configuration
  // 2. Validate required fields
  // 3. Set up HTTP client
  // 4. No external calls yet
}
```

### Request Execution

```typescript
async generateText(input: TextRequest): Promise<TextResponse> {
  // 1. Validate input
  // 2. Build request
  // 3. Execute HTTP call
  // 4. Handle response
  // 5. Normalize result
  // 6. Return or throw
}
```

### Cleanup

Providers are stateless and require no cleanup:

```typescript
// No cleanup needed
// No persistent connections
// No background workers
```

## Future Extensions

### Streaming Support

```typescript
interface FrasbergProvider {
  generateTextStream?(
    input: TextRequest
  ): AsyncIterator<TextChunk>;
}
```

### Batch Operations

```typescript
interface FrasbergProvider {
  generateTextBatch?(
    inputs: TextRequest[]
  ): Promise<TextResponse[]>;
}
```

### Configuration Options

```typescript
interface ProviderOptions {
  timeout?: number;
  retries?: number;
  baseUrl?: string;
}
```

## Related Documentation

- [Provider Model](provider-model.md) - Provider architecture
- [Architecture Overview](overview.md) - System design
- [Error Handling](../guides/error-handling.md) - Error patterns
