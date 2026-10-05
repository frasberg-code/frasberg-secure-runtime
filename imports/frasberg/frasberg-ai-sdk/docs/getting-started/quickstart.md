# Quickstart Guide

Get started with the Frasberg AI SDK in minutes.

## Prerequisites

- Frasberg AI SDK installed ([Installation Guide](installation.md))
- API key configured ([Configuration Guide](configuration.md))

## Basic Usage

### Text Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function generateText() {
  const result = await client.generateText(
    'Explain quantum computing in simple terms.'
  );
  
  console.log(result);
}

generateText();
```

### Image Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

async function generateImage() {
  const imageBuffer = await client.generateImage(
    'A serene mountain landscape at sunset'
  );
  
  await fs.writeFile('output.png', imageBuffer);
  console.log('Image saved to output.png');
}

generateImage();
```

### Video Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

async function generateVideo() {
  const videoBuffer = await client.generateVideo(
    'A time-lapse of a blooming flower'
  );
  
  await fs.writeFile('output.mp4', videoBuffer);
  console.log('Video saved to output.mp4');
}

generateVideo();
```

## Complete Example

Here's a complete Node.js script demonstrating all three generation types:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

async function main() {
  const client = createFrasbergClient();

  // Generate text
  console.log('Generating text...');
  const text = await client.generateText(
    'Write a haiku about coding'
  );
  console.log('Text:', text);

  // Generate image
  console.log('Generating image...');
  const image = await client.generateImage(
    'A minimalist workspace with a laptop'
  );
  await fs.writeFile('workspace.png', image);
  console.log('Image saved');

  // Generate video
  console.log('Generating video...');
  const video = await client.generateVideo(
    'A rotating 3D cube'
  );
  await fs.writeFile('cube.mp4', video);
  console.log('Video saved');
}

main().catch(console.error);
```

## Error Handling

Always wrap SDK calls in try-catch blocks:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function safeGeneration() {
  try {
    const result = await client.generateText('Hello, world!');
    console.log(result);
  } catch (error) {
    console.error('Generation failed:', error.message);
  }
}
```

## Next Steps

- [Text Generation Guide](../guides/text-generation.md) - Advanced text features
- [Image Generation Guide](../guides/image-generation.md) - Image options
- [Video Generation Guide](../guides/video-generation.md) - Video parameters
- [Error Handling](../guides/error-handling.md) - Comprehensive error handling
- [Best Practices](../guides/best-practices.md) - Production-ready patterns
