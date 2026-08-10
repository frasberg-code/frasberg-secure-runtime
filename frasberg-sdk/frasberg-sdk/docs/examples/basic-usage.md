# Basic Usage Examples

Simple examples to get started with the Frasberg SDK.

## Installation

```bash
npm install @frasberg/core-sdk
```

## Quick Start

### Initialize Client

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

// Create client with environment variables
const client = createFrasbergClient();

// Or with explicit configuration
const client = createFrasbergClient({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.frasberg.yourdomain.com'
});
```

## Text Generation

### Simple Text Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function generateSimpleText() {
  const result = await client.generateText(
    'Explain quantum computing in simple terms.'
  );
  
  console.log(result);
}

generateSimpleText();
```

### Text Generation with Options

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function generateTextWithOptions() {
  const result = await client.generateText(
    'Write a creative story about a robot.',
    {
      maxTokens: 500,
      temperature: 0.8,
      topP: 0.9
    }
  );
  
  console.log(result);
}

generateTextWithOptions();
```

### Question Answering

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function answerQuestion(question: string) {
  const answer = await client.generateText(
    `Question: ${question}\nAnswer:`
  );
  
  return answer;
}

// Usage
const answer = await answerQuestion('What is the capital of France?');
console.log(answer);  // "Paris"
```

### Text Summarization

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function summarizeText(text: string) {
  const prompt = `
    Please summarize the following text in 2-3 sentences:
    
    ${text}
    
    Summary:
  `;
  
  const summary = await client.generateText(prompt);
  return summary;
}

// Usage
const longText = `
  Artificial intelligence (AI) is intelligence demonstrated by machines,
  as opposed to natural intelligence displayed by animals including humans.
  AI research has been defined as the field of study of intelligent agents,
  which refers to any system that perceives its environment and takes actions
  that maximize its chance of achieving its goals.
`;

const summary = await summarizeText(longText);
console.log(summary);
```

## Image Generation

### Simple Image Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

async function generateSimpleImage() {
  const imageBuffer = await client.generateImage(
    'A serene mountain landscape at sunset'
  );
  
  await fs.writeFile('landscape.png', imageBuffer);
  console.log('Image saved to landscape.png');
}

generateSimpleImage();
```

### Image with Custom Parameters

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

async function generateCustomImage() {
  const imageBuffer = await client.generateImage(
    'A futuristic city with flying cars',
    {
      width: 1024,
      height: 768,
      quality: 'high',
      style: 'photorealistic'
    }
  );
  
  await fs.writeFile('futuristic-city.png', imageBuffer);
  console.log('Image saved!');
}

generateCustomImage();
```

### Generate Multiple Images

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

async function generateMultipleImages() {
  const prompts = [
    'A red sports car',
    'A blue mountain lake',
    'A green forest path'
  ];
  
  for (let i = 0; i < prompts.length; i++) {
    const imageBuffer = await client.generateImage(prompts[i]);
    await fs.writeFile(`image-${i}.png`, imageBuffer);
    console.log(`Generated image ${i + 1}/${prompts.length}`);
  }
}

generateMultipleImages();
```

## Video Generation

### Simple Video Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

async function generateSimpleVideo() {
  const videoBuffer = await client.generateVideo(
    'A time-lapse of a sunset over the ocean'
  );
  
  await fs.writeFile('sunset.mp4', videoBuffer);
  console.log('Video saved to sunset.mp4');
}

generateSimpleVideo();
```

### Video with Custom Duration

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();

async function generateCustomVideo() {
  const videoBuffer = await client.generateVideo(
    'A rotating product showcase',
    {
      duration: 10,  // 10 seconds
      fps: 30,
      quality: 'high'
    }
  );
  
  await fs.writeFile('product-showcase.mp4', videoBuffer);
  console.log('Video saved!');
}

generateCustomVideo();
```

## Error Handling

### Basic Error Handling

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function safeGenerate() {
  try {
    const result = await client.generateText('Hello, world!');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

safeGenerate();
```

### Detailed Error Handling

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function handleErrors() {
  try {
    const result = await client.generateText('Generate text');
    return result;
  } catch (error) {
    if (error.code === 'INVALID_API_KEY') {
      console.error('Please check your API key');
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.error('Rate limit exceeded, please try again later');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('Network error, please check your connection');
    } else {
      console.error('Unknown error:', error.message);
    }
    
    throw error;
  }
}

handleErrors();
```

### Retry on Failure

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.generateText(prompt);
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw lastError!;
}

// Usage
const result = await generateWithRetry('Generate text');
```

## Configuration

### Environment Variables

```bash
# .env
FRASBERG_API_KEY=your-api-key-here
FRASBERG_API_URL=https://api.frasberg.yourdomain.com
FRASBERG_TIMEOUT=30000
```

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Client automatically uses environment variables
const client = createFrasbergClient();
```

### Custom Configuration

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient({
  apiKey: process.env.CUSTOM_API_KEY || '',
  apiUrl: 'https://custom-api.example.com',
  timeout: 60000,  // 60 seconds
  retryAttempts: 3,
  retryDelay: 1000
});
```

## Working with Promises

### Sequential Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function sequentialGeneration() {
  // Generate one after another
  const text1 = await client.generateText('First prompt');
  console.log('First:', text1);
  
  const text2 = await client.generateText('Second prompt');
  console.log('Second:', text2);
  
  const text3 = await client.generateText('Third prompt');
  console.log('Third:', text3);
}

sequentialGeneration();
```

### Parallel Generation

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function parallelGeneration() {
  // Generate all at once
  const [text1, text2, text3] = await Promise.all([
    client.generateText('First prompt'),
    client.generateText('Second prompt'),
    client.generateText('Third prompt')
  ]);
  
  console.log('First:', text1);
  console.log('Second:', text2);
  console.log('Third:', text3);
}

parallelGeneration();
```

### Promise.allSettled for Error Handling

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

async function safeParallelGeneration() {
  const prompts = [
    'Generate text 1',
    'Generate text 2',
    'Generate text 3'
  ];
  
  const results = await Promise.allSettled(
    prompts.map(prompt => client.generateText(prompt))
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Result ${index + 1}:`, result.value);
    } else {
      console.error(`Error ${index + 1}:`, result.reason);
    }
  });
}

safeParallelGeneration();
```

## TypeScript Usage

### Type-Safe Configuration

```typescript
import { createFrasbergClient, type FrasbergClientConfig } from '@frasberg/core-sdk';

const config: FrasbergClientConfig = {
  apiKey: 'your-api-key',
  apiUrl: 'https://api.frasberg.example.com',
  timeout: 30000
};

const client = createFrasbergClient(config);
```

### Type-Safe Options

```typescript
import { 
  createFrasbergClient,
  type TextGenerateOptions,
  type ImageGenerateOptions
} from '@frasberg/core-sdk';

const client = createFrasbergClient();

// Text generation with typed options
const textOptions: TextGenerateOptions = {
  maxTokens: 500,
  temperature: 0.7,
  topP: 0.9
};

const text = await client.generateText('Hello', textOptions);

// Image generation with typed options
const imageOptions: ImageGenerateOptions = {
  width: 1024,
  height: 768,
  quality: 'high'
};

const image = await client.generateImage('A cat', imageOptions);
```

### Custom Type Guards

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

interface TextResult {
  text: string;
  metadata?: {
    tokens: number;
    model: string;
  };
}

function isTextResult(value: unknown): value is TextResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    typeof (value as TextResult).text === 'string'
  );
}

const client = createFrasbergClient();

async function generateTypedText(): Promise<TextResult> {
  const result = await client.generateText('Hello');
  
  // Type guard
  if (typeof result === 'string') {
    return { text: result };
  }
  
  if (isTextResult(result)) {
    return result;
  }
  
  throw new Error('Unexpected result type');
}
```

## Complete Examples

### CLI Tool

```typescript
#!/usr/bin/env node
import { createFrasbergClient } from '@frasberg/core-sdk';
import { program } from 'commander';

const client = createFrasbergClient();

program
  .name('frasberg-cli')
  .description('CLI tool for Frasberg SDK')
  .version('1.0.0');

program
  .command('generate-text <prompt>')
  .description('Generate text from prompt')
  .action(async (prompt: string) => {
    try {
      const result = await client.generateText(prompt);
      console.log(result);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate-image <prompt> <output>')
  .description('Generate image from prompt')
  .action(async (prompt: string, output: string) => {
    try {
      const fs = await import('fs/promises');
      const image = await client.generateImage(prompt);
      await fs.writeFile(output, image);
      console.log(`Image saved to ${output}`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

### Simple Web Server

```typescript
import express from 'express';
import { createFrasbergClient } from '@frasberg/core-sdk';

const app = express();
const client = createFrasbergClient();

app.use(express.json());

app.post('/api/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await client.generateText(prompt);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Next Steps

- [Advanced Patterns](advanced-patterns.md) - Learn advanced usage patterns
- [Integration Examples](integration-examples.md) - Integrate with popular frameworks
- [Best Practices](../guides/best-practices.md) - Follow recommended practices
- [API Reference](../api/client.md) - Complete API documentation

## Related Documentation

- [Quickstart Guide](../getting-started/quickstart.md)
- [Configuration](../getting-started/configuration.md)
- [Error Handling](../guides/error-handling.md)
- [Troubleshooting](../guides/troubleshooting.md)

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
