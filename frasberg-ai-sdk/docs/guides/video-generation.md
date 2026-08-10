# Video Generation Guide

Comprehensive guide to video generation with the Frasberg AI SDK.

## Basic Usage

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

const videoBuffer = await client.generateVideo(
  'A time-lapse of clouds moving across the sky'
);

await fs.writeFile('clouds.mp4', videoBuffer);
```

## Input Format

The `generateVideo` method accepts a string prompt:

```typescript
generateVideo(prompt: string): Promise<Buffer>
```

### Parameters

- **prompt** (string, required): Description of the video to generate

## Response Format

Returns a `Promise<Buffer>` containing the raw video data in MP4 format.

```typescript
const buffer = await client.generateVideo('Waves crashing on a beach');
// buffer is a Node.js Buffer containing MP4 data
```

## Saving Videos

### To File System

```typescript
import fs from 'fs/promises';

const videoBuffer = await client.generateVideo('A rotating Earth from space');
await fs.writeFile('earth-rotation.mp4', videoBuffer);
```

### With Express.js

```typescript
app.get('/generate-video', async (req, res) => {
  const prompt = req.query.prompt;
  const videoBuffer = await client.generateVideo(prompt);
  
  res.set('Content-Type', 'video/mp4');
  res.send(videoBuffer);
});
```

## Use Cases

### Motion Graphics

```typescript
const motion = await client.generateVideo(
  'Abstract geometric shapes morphing and rotating'
);
```

### Nature Scenes

```typescript
const nature = await client.generateVideo(
  'A waterfall cascading over rocks in slow motion'
);
```

### Product Animation

```typescript
const product = await client.generateVideo(
  '360-degree rotation of a modern smartphone'
);
```

### Concept Visualization

```typescript
const concept = await client.generateVideo(
  'Flying through a futuristic city at night'
);
```

## Error Handling

```typescript
try {
  const video = await client.generateVideo('Your prompt');
  await fs.writeFile('output.mp4', video);
} catch (error) {
  if (error.message.includes('failed: 401')) {
    console.error('Authentication failed');
  } else if (error.message.includes('failed: 429')) {
    console.error('Rate limit exceeded');
  } else if (error.message.includes('failed: 504')) {
    console.error('Generation timeout - prompt may be too complex');
  } else {
    console.error('Video generation failed:', error.message);
  }
}
```

## Best Practices

### 1. Motion Description

Be clear about the motion you want:

**Good:**
```typescript
await client.generateVideo(
  'Camera slowly zooming into a blooming flower, 5 seconds'
);
```

**Avoid:**
```typescript
await client.generateVideo('flower');
```

### 2. Scene Setting

Provide context for the scene:

```typescript
const video = await client.generateVideo(
  'Sunrise over a mountain range, golden hour lighting, time-lapse effect'
);
```

### 3. Camera Movement

Specify camera movements when relevant:

```typescript
const video = await client.generateVideo(
  'Drone shot flying over a forest canopy, smooth forward motion'
);
```

### 4. Duration Hints

While not enforced, you can suggest duration:

```typescript
const video = await client.generateVideo(
  'Slow pan across a city skyline, 10 second duration'
);
```

## Performance Considerations

- **Timeout:** Video generation typically takes 2-5 minutes
- **File Size:** Videos are typically 5-50 MB depending on content
- **Format:** All videos are returned as MP4
- **Duration:** Default duration determined by API (typically 3-10 seconds)
- **Resolution:** Default resolution determined by API

## Common Patterns

### Sequential Generation

```typescript
const prompts = [
  'Scene 1: Opening shot of a mountain',
  'Scene 2: Close-up of wildlife',
  'Scene 3: Sunset over the valley'
];

for (let i = 0; i < prompts.length; i++) {
  console.log(`Generating scene ${i + 1}...`);
  const video = await client.generateVideo(prompts[i]);
  await fs.writeFile(`scene-${i + 1}.mp4`, video);
}
```

### With Progress Tracking

```typescript
async function generateVideoBatch(prompts: string[]) {
  console.log(`Generating ${prompts.length} videos...`);
  
  for (let i = 0; i < prompts.length; i++) {
    const startTime = Date.now();
    console.log(`[${i + 1}/${prompts.length}] ${prompts[i]}`);
    
    const video = await client.generateVideo(prompts[i]);
    await fs.writeFile(`video-${i}.mp4`, video);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`  Completed in ${duration.toFixed(1)}s`);
  }
  
  console.log('All videos generated!');
}
```

### Error Recovery with Retry

```typescript
async function generateVideoWithRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<Buffer> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await client.generateVideo(prompt);
    } catch (error) {
      if (i === maxRetries) throw error;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Should not reach here');
}
```

## Limitations

- No duration control in current version
- No resolution control
- No frame rate control
- No format options (MP4 only)
- No video-to-video generation
- Longer generation times compared to text/images

## Related Guides

- [Error Handling](error-handling.md) - Handle errors effectively
- [Best Practices](best-practices.md) - Production patterns
- [Troubleshooting](troubleshooting.md) - Common issues
- [Performance Guidelines](../operations/performance.md) - Optimization tips
