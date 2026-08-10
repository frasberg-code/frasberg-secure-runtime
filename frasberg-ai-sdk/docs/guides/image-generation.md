# Image Generation Guide

Comprehensive guide to image generation with the Frasberg AI SDK.

## Basic Usage

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

const imageBuffer = await client.generateImage(
  'A serene mountain landscape at sunset'
);

await fs.writeFile('landscape.png', imageBuffer);
```

## Input Format

The `generateImage` method accepts a string prompt:

```typescript
generateImage(prompt: string): Promise<Buffer>
```

### Parameters

- **prompt** (string, required): Description of the image to generate

## Response Format

Returns a `Promise<Buffer>` containing the raw image data in PNG format.

```typescript
const buffer = await client.generateImage('A red apple on a table');
// buffer is a Node.js Buffer containing PNG data
```

## Saving Images

### To File System

```typescript
import fs from 'fs/promises';

const imageBuffer = await client.generateImage('A sunset over the ocean');
await fs.writeFile('sunset.png', imageBuffer);
```

### To Base64

```typescript
const imageBuffer = await client.generateImage('A mountain view');
const base64 = imageBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;
```

### With Express.js

```typescript
app.get('/generate-image', async (req, res) => {
  const prompt = req.query.prompt;
  const imageBuffer = await client.generateImage(prompt);
  
  res.set('Content-Type', 'image/png');
  res.send(imageBuffer);
});
```

## Use Cases

### Artistic Creation

```typescript
const art = await client.generateImage(
  'Abstract watercolor painting of a cityscape'
);
```

### Product Visualization

```typescript
const product = await client.generateImage(
  'Modern minimalist desk lamp, product photography'
);
```

### Concept Art

```typescript
const concept = await client.generateImage(
  'Futuristic sci-fi spaceship interior, wide angle'
);
```

### Illustration

```typescript
const illustration = await client.generateImage(
  'Cartoon style illustration of children playing in a park'
);
```

## Error Handling

```typescript
try {
  const image = await client.generateImage('Your prompt');
  await fs.writeFile('output.png', image);
} catch (error) {
  if (error.message.includes('failed: 401')) {
    console.error('Authentication failed');
  } else if (error.message.includes('failed: 429')) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Image generation failed:', error.message);
  }
}
```

## Best Practices

### 1. Descriptive Prompts

**Good:**
```typescript
await client.generateImage(
  'A golden retriever puppy sitting in green grass, sunny day, natural lighting'
);
```

**Avoid:**
```typescript
await client.generateImage('dog');
```

### 2. Style Specification

Include style keywords for better control:

```typescript
const photo = await client.generateImage(
  'Portrait of a woman, photorealistic, studio lighting'
);

const painting = await client.generateImage(
  'Portrait of a woman, oil painting, impressionist style'
);
```

### 3. Composition Guidance

```typescript
const image = await client.generateImage(
  'Mountain landscape, wide angle shot, rule of thirds composition'
);
```

### 4. Detail Level

Be specific about desired details:

```typescript
const detailed = await client.generateImage(
  'Victorian mansion exterior, ornate details, ivy-covered walls, sunset'
);
```

## Performance Considerations

- **Timeout:** Image generation typically takes 30-90 seconds
- **File Size:** Generated images are typically 1-5 MB
- **Format:** All images are returned as PNG
- **Resolution:** Default resolution determined by API (not configurable in v1.0)

## Common Patterns

### Batch Generation

```typescript
const prompts = [
  'A forest in autumn',
  'A forest in winter',
  'A forest in spring',
  'A forest in summer'
];

const images = await Promise.all(
  prompts.map(prompt => client.generateImage(prompt))
);

// Save all images
for (let i = 0; i < images.length; i++) {
  await fs.writeFile(`forest-${i}.png`, images[i]);
}
```

### With Progress Tracking

```typescript
async function generateWithProgress(prompts: string[]) {
  console.log(`Generating ${prompts.length} images...`);
  
  for (let i = 0; i < prompts.length; i++) {
    console.log(`[${i + 1}/${prompts.length}] ${prompts[i]}`);
    const image = await client.generateImage(prompts[i]);
    await fs.writeFile(`image-${i}.png`, image);
  }
  
  console.log('All images generated!');
}
```

## Limitations

- No size/resolution control in current version
- No style presets
- No negative prompts
- No image-to-image generation
- Single format (PNG) only

## Related Guides

- [Error Handling](error-handling.md) - Handle errors effectively
- [Best Practices](best-practices.md) - Production patterns
- [Troubleshooting](troubleshooting.md) - Common issues
