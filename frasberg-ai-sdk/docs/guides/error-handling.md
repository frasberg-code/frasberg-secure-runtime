# Error Handling

Comprehensive guide to error handling in the Frasberg AI SDK.

## Error Types

The SDK can throw errors in the following scenarios:

### 1. Configuration Errors

Thrown when the SDK is misconfigured.

```typescript
Error: FRASBERG_AI_API_KEY is missing
```

**Cause:** Missing or undefined API key  
**Solution:** Set `FRASBERG_AI_API_KEY` environment variable

### 2. HTTP Errors

Thrown when API requests fail.

```typescript
Error: Text generation failed: 401
Error: Image generation failed: 429
Error: Video generation failed: 500
```

**Common HTTP Status Codes:**

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Unauthorized | Check API key validity |
| 403 | Forbidden | Verify account permissions |
| 429 | Too Many Requests | Implement rate limiting/retry |
| 500 | Internal Server Error | Retry after delay |
| 502 | Bad Gateway | Retry after delay |
| 504 | Gateway Timeout | Check prompt complexity |

### 3. Network Errors

Thrown when network connectivity fails.

```typescript
Error: fetch failed
```

**Causes:**
- No internet connection
- DNS resolution failure
- Network timeout
- Firewall blocking

## Basic Error Handling

### Try-Catch Pattern

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

try {
  const result = await client.generateText('Your prompt');
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Advanced Error Handling

### Categorizing Errors

```typescript
async function handleGeneration(prompt: string) {
  try {
    return await client.generateText(prompt);
  } catch (error) {
    const message = error.message;
    
    // Authentication errors
    if (message.includes('401')) {
      throw new Error('Invalid API key. Please check your credentials.');
    }
    
    // Rate limit errors
    if (message.includes('429')) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Server errors
    if (message.includes('500') || message.includes('502')) {
      throw new Error('Server error. Please retry in a few moments.');
    }
    
    // Timeout errors
    if (message.includes('504')) {
      throw new Error('Request timeout. Consider simplifying your prompt.');
    }
    
    // Generic fallback
    throw new Error(`Generation failed: ${message}`);
  }
}
```

### Retry Logic

```typescript
async function generateWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryable = error.message.includes('429') ||
                         error.message.includes('500') ||
                         error.message.includes('502');
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  throw new Error('Should not reach here');
}

// Usage
const result = await generateWithRetry(() =>
  client.generateText('Your prompt')
);
```

### Timeout Wrapper

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Usage
try {
  const result = await withTimeout(
    client.generateVideo('Complex scene'),
    120000, // 2 minutes
    'Video generation took too long'
  );
} catch (error) {
  console.error('Timeout or error:', error.message);
}
```

## Production Patterns

### Comprehensive Error Handler

```typescript
interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    retryable: boolean;
  };
}

async function safeGenerate(
  prompt: string
): Promise<string | ErrorResponse> {
  try {
    return await client.generateText(prompt);
  } catch (error) {
    const message = error.message;
    
    if (message.includes('FRASBERG_AI_API_KEY')) {
      return {
        success: false,
        error: {
          type: 'CONFIGURATION_ERROR',
          message: 'API key not configured',
          retryable: false
        }
      };
    }
    
    if (message.includes('401')) {
      return {
        success: false,
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'Invalid API key',
          retryable: false
        }
      };
    }
    
    if (message.includes('429')) {
      return {
        success: false,
        error: {
          type: 'RATE_LIMIT_ERROR',
          message: 'Rate limit exceeded',
          retryable: true
        }
      };
    }
    
    if (message.includes('500') || message.includes('502')) {
      return {
        success: false,
        error: {
          type: 'SERVER_ERROR',
          message: 'Server temporarily unavailable',
          retryable: true
        }
      };
    }
    
    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: error.message,
        retryable: false
      }
    };
  }
}
```

### Logging Errors

```typescript
interface ErrorLog {
  timestamp: string;
  operation: string;
  prompt: string;
  error: string;
  statusCode?: number;
}

const errorLogs: ErrorLog[] = [];

async function generateWithLogging(
  operation: 'text' | 'image' | 'video',
  prompt: string
) {
  try {
    switch (operation) {
      case 'text':
        return await client.generateText(prompt);
      case 'image':
        return await client.generateImage(prompt);
      case 'video':
        return await client.generateVideo(prompt);
    }
  } catch (error) {
    const statusMatch = error.message.match(/failed: (\d+)/);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;
    
    errorLogs.push({
      timestamp: new Date().toISOString(),
      operation,
      prompt,
      error: error.message,
      statusCode
    });
    
    throw error;
  }
}
```

## Best Practices

### 1. Always Use Try-Catch

Never call SDK methods without error handling:

```typescript
// ❌ Bad
const result = await client.generateText(prompt);

// ✅ Good
try {
  const result = await client.generateText(prompt);
} catch (error) {
  // Handle error
}
```

### 2. Provide User-Friendly Messages

```typescript
try {
  await client.generateImage(prompt);
} catch (error) {
  // ❌ Bad: Expose raw error
  alert(error.message);
  
  // ✅ Good: User-friendly message
  alert('Unable to generate image. Please try again.');
  console.error('Details:', error);
}
```

### 3. Log Errors for Debugging

```typescript
try {
  return await client.generateVideo(prompt);
} catch (error) {
  console.error('Video generation failed:', {
    prompt,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  throw error;
}
```

### 4. Handle Configuration Errors Early

```typescript
// Validate configuration at startup
try {
  const client = createFrasbergClient();
  console.log('✓ SDK initialized successfully');
} catch (error) {
  console.error('✗ SDK initialization failed:', error.message);
  process.exit(1);
}
```

## Related Guides

- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [Best Practices](best-practices.md) - Production patterns
- [Performance Guidelines](../operations/performance.md) - Optimization tips
