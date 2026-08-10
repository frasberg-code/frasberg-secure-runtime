# Client API Reference

Complete API reference for the Frasberg AI SDK client.

## createFrasbergClient

Creates and returns a Frasberg AI SDK client instance.

### Signature

```typescript
function createFrasbergClient(): FrasbergClient
```

### Returns

`FrasbergClient` - A client instance with methods for text, image, and video generation.

### Example

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
```

### Configuration

The client is configured via environment variables:

- **`FRASBERG_AI_API_KEY`** (required): Your Frasberg AI API key
- **`FRASBERG_AI_API_URL`** (optional): API base URL (default: `https://api.frasberg-ai.yourdomain.com`)

### Throws

- **Error**: If `FRASBERG_AI_API_KEY` is not set

---

## FrasbergClient

Interface representing the Frasberg AI SDK client.

### Type Definition

```typescript
interface FrasbergClient {
  generateText: (input: string) => Promise<string>;
  generateImage: (prompt: string) => Promise<Buffer>;
  generateVideo: (prompt: string) => Promise<Buffer>;
}
```

---

## generateText

Generates text based on the provided input prompt.

### Signature

```typescript
generateText(input: string): Promise<string>
```

### Parameters

- **input** (`string`, required): The text prompt to generate from

### Returns

`Promise<string>` - The generated text content

### Example

```typescript
const result = await client.generateText(
  'Explain the theory of relativity in simple terms'
);

console.log(result);
// Output: "The theory of relativity, proposed by Albert Einstein..."
```

### Throws

- **Error**: `Text generation failed: {statusCode}` when the API request fails

### HTTP Details

**Endpoint:** `POST /v1/text`

**Request Body:**
```json
{
  "input": "your prompt here"
}
```

**Response Body:**
```json
{
  "output": "generated text here"
}
```

---

## generateImage

Generates an image based on the provided prompt.

### Signature

```typescript
generateImage(prompt: string): Promise<Buffer>
```

### Parameters

- **prompt** (`string`, required): Description of the image to generate

### Returns

`Promise<Buffer>` - A Node.js Buffer containing the PNG image data

### Example

```typescript
import fs from 'fs/promises';

const imageBuffer = await client.generateImage(
  'A sunset over mountains'
);

await fs.writeFile('sunset.png', imageBuffer);
```

### Throws

- **Error**: `Image generation failed: {statusCode}` when the API request fails

### HTTP Details

**Endpoint:** `POST /v1/image`

**Request Body:**
```json
{
  "prompt": "your prompt here"
}
```

**Response:** Binary PNG image data

---

## generateVideo

Generates a video based on the provided prompt.

### Signature

```typescript
generateVideo(prompt: string): Promise<Buffer>
```

### Parameters

- **prompt** (`string`, required): Description of the video to generate

### Returns

`Promise<Buffer>` - A Node.js Buffer containing the MP4 video data

### Example

```typescript
import fs from 'fs/promises';

const videoBuffer = await client.generateVideo(
  'A time-lapse of clouds moving'
);

await fs.writeFile('clouds.mp4', videoBuffer);
```

### Throws

- **Error**: `Video generation failed: {statusCode}` when the API request fails

### HTTP Details

**Endpoint:** `POST /v1/video`

**Request Body:**
```json
{
  "prompt": "your prompt here"
}
```

**Response:** Binary MP4 video data

---

## Error Handling

All client methods can throw errors. Always wrap calls in try-catch blocks:

```typescript
try {
  const result = await client.generateText('Hello');
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Common Error Status Codes

| Status | Meaning | Resolution |
|--------|---------|------------|
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Internal Server Error | Retry after delay |
| 502 | Bad Gateway | Retry after delay |
| 504 | Gateway Timeout | Simplify prompt or retry |

---

## Complete Example

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

async function main() {
  // Create client
  const client = createFrasbergClient();
  
  try {
    // Generate text
    const text = await client.generateText(
      'Write a haiku about programming'
    );
    console.log('Text:', text);
    
    // Generate image
    const image = await client.generateImage(
      'A serene coding environment'
    );
    await fs.writeFile('environment.png', image);
    console.log('Image saved to environment.png');
    
    // Generate video
    const video = await client.generateVideo(
      'Code scrolling on a terminal screen'
    );
    await fs.writeFile('terminal.mp4', video);
    console.log('Video saved to terminal.mp4');
    
  } catch (error) {
    console.error('Generation failed:', error.message);
  }
}

main();
```

---

## Type Safety

The SDK is fully typed with TypeScript. Import types for better development experience:

```typescript
import { createFrasbergClient, FrasbergClient } from '@frasberg/core-sdk';

const client: FrasbergClient = createFrasbergClient();
```

---

## Related Documentation

- [Configuration Guide](../getting-started/configuration.md) - Setup environment variables
- [Error Handling Guide](../guides/error-handling.md) - Handle errors effectively
- [Best Practices](../guides/best-practices.md) - Production patterns
- [Types Reference](types.md) - TypeScript type definitions
