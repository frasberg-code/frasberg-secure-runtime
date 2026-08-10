# Integration Examples

Examples of integrating Frasberg SDK with popular frameworks and platforms.

## Express.js

### Basic Integration

```typescript
import express from 'express';
import { createFrasbergClient } from '@frasberg/core-sdk';

const app = express();
const client = createFrasbergClient();

app.use(express.json());

// Text generation endpoint
app.post('/api/generate-text', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await client.generateText(prompt, options);
    res.json({ result });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const imageBuffer = await client.generateImage(prompt, options);
    
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### With Middleware

```typescript
import express from 'express';
import { createFrasbergClient } from '@frasberg/core-sdk';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const client = createFrasbergClient();

// Security
app.use(helmet());

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Routes
app.post('/api/generate-text', async (req, res, next) => {
  try {
    const result = await client.generateText(req.body.prompt);
    res.json({ result });
  } catch (error) {
    next(error);
  }
});

app.listen(3000);
```

## Next.js

### API Route

```typescript
// pages/api/generate-text.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await client.generateText(prompt);
    res.status(200).json({ result });
  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### App Router (Next.js 13+)

```typescript
// app/api/generate-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    const result = await client.generateText(prompt);
    
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### React Component with API Route

```typescript
// components/TextGenerator.tsx
'use client';

import { useState } from 'react';

export default function TextGenerator() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate text');
      }
      
      const data = await response.json();
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        className="w-full p-2 border rounded"
        rows={4}
      />
      
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
```

## NestJS

### Service

```typescript
// frasberg.service.ts
import { Injectable } from '@nestjs/common';
import { createFrasbergClient } from '@frasberg/core-sdk';

@Injectable()
export class FrasbergService {
  private client: ReturnType<typeof createFrasbergClient>;
  
  constructor() {
    this.client = createFrasbergClient();
  }
  
  async generateText(prompt: string, options?: any): Promise<string> {
    return await this.client.generateText(prompt, options);
  }
  
  async generateImage(prompt: string, options?: any): Promise<Buffer> {
    return await this.client.generateImage(prompt, options);
  }
  
  async generateVideo(prompt: string, options?: any): Promise<Buffer> {
    return await this.client.generateVideo(prompt, options);
  }
}
```

### Controller

```typescript
// frasberg.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { FrasbergService } from './frasberg.service';

@Controller('api/frasberg')
export class FrasbergController {
  constructor(private readonly frasbergService: FrasbergService) {}
  
  @Post('generate-text')
  async generateText(@Body() body: { prompt: string; options?: any }) {
    try {
      const { prompt, options } = body;
      
      if (!prompt) {
        throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.frasbergService.generateText(prompt, options);
      return { result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Post('generate-image')
  async generateImage(
    @Body() body: { prompt: string; options?: any },
    @Res() res: Response
  ) {
    try {
      const { prompt, options } = body;
      
      if (!prompt) {
        throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
      }
      
      const imageBuffer = await this.frasbergService.generateImage(prompt, options);
      
      res.set('Content-Type', 'image/png');
      res.send(imageBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
```

### Module

```typescript
// frasberg.module.ts
import { Module } from '@nestjs/common';
import { FrasbergService } from './frasberg.service';
import { FrasbergController } from './frasberg.controller';

@Module({
  providers: [FrasbergService],
  controllers: [FrasbergController],
  exports: [FrasbergService]
})
export class FrasbergModule {}
```

## Fastify

### Basic Integration

```typescript
import Fastify from 'fastify';
import { createFrasbergClient } from '@frasberg/core-sdk';

const fastify = Fastify({ logger: true });
const client = createFrasbergClient();

// Schema validation
const generateTextSchema = {
  body: {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: { type: 'string' },
      options: { type: 'object' }
    }
  }
};

fastify.post('/api/generate-text', {
  schema: generateTextSchema
}, async (request, reply) => {
  try {
    const { prompt, options } = request.body as any;
    const result = await client.generateText(prompt, options);
    
    return { result };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening on ${address}`);
});
```

## AWS Lambda

### Handler Function

```typescript
// handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

export const generateText = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { prompt } = body;
    
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }
    
    const result = await client.generateText(prompt);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ result })
    };
  } catch (error: any) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### With Serverless Framework

```yaml
# serverless.yml
service: frasberg-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    FRASBERG_API_KEY: ${env:FRASBERG_API_KEY}
    FRASBERG_API_URL: ${env:FRASBERG_API_URL}

functions:
  generateText:
    handler: handler.generateText
    events:
      - http:
          path: /generate-text
          method: post
          cors: true
```

## Cloudflare Workers

### Worker Script

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

export interface Env {
  FRASBERG_API_KEY: string;
  FRASBERG_API_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    try {
      const { prompt } = await request.json() as any;
      
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'Prompt is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Create client with environment variables
      const client = createFrasbergClient({
        apiKey: env.FRASBERG_API_KEY,
        apiUrl: env.FRASBERG_API_URL
      });
      
      const result = await client.generateText(prompt);
      
      return new Response(
        JSON.stringify({ result }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
```

## GraphQL

### With Apollo Server

```typescript
import { ApolloServer, gql } from 'apollo-server-express';
import { createFrasbergClient } from '@frasberg/core-sdk';
import express from 'express';

const client = createFrasbergClient();

// Schema
const typeDefs = gql`
  type Query {
    hello: String
  }
  
  type Mutation {
    generateText(prompt: String!): GenerationResult!
    generateImage(prompt: String!): ImageResult!
  }
  
  type GenerationResult {
    result: String!
  }
  
  type ImageResult {
    imageUrl: String!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello from Frasberg SDK!'
  },
  Mutation: {
    generateText: async (_: any, { prompt }: { prompt: string }) => {
      const result = await client.generateText(prompt);
      return { result };
    },
    generateImage: async (_: any, { prompt }: { prompt: string }) => {
      const imageBuffer = await client.generateImage(prompt);
      
      // In real implementation, upload to storage and return URL
      const imageUrl = await uploadToS3(imageBuffer);
      return { imageUrl };
    }
  }
};

async function uploadToS3(buffer: Buffer): Promise<string> {
  // Implementation for uploading to S3
  return 'https://s3.example.com/image.png';
}

// Server
const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    // Add context if needed
  })
});

await server.start();
server.applyMiddleware({ app });

app.listen(4000, () => {
  console.log(`Server ready at http://localhost:4000${server.graphqlPath}`);
});
```

## React Hooks

### Custom Hook

```typescript
// hooks/useFrasbergClient.ts
import { useState, useCallback } from 'react';

interface UseFrasbergClientResult {
  generateText: (prompt: string) => Promise<void>;
  result: string | null;
  loading: boolean;
  error: string | null;
}

export function useFrasbergClient(): UseFrasbergClientResult {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateText = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate text');
      }
      
      const data = await response.json();
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { generateText, result, loading, error };
}

// Usage in component
import { useFrasbergClient } from './hooks/useFrasbergClient';

export default function MyComponent() {
  const { generateText, result, loading, error } = useFrasbergClient();
  
  return (
    <div>
      <button onClick={() => generateText('Hello')}>
        Generate
      </button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {result && <p>Result: {result}</p>}
    </div>
  );
}
```

## CLI Integration

### Commander.js

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { createFrasbergClient } from '@frasberg/core-sdk';
import fs from 'fs/promises';

const client = createFrasbergClient();
const program = new Command();

program
  .name('frasberg-cli')
  .description('CLI for Frasberg SDK')
  .version('1.0.0');

program
  .command('text <prompt>')
  .description('Generate text')
  .option('-o, --output <file>', 'Save to file')
  .action(async (prompt, options) => {
    try {
      console.log('Generating...');
      const result = await client.generateText(prompt);
      
      if (options.output) {
        await fs.writeFile(options.output, result);
        console.log(`Saved to ${options.output}`);
      } else {
        console.log(result);
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('image <prompt> <output>')
  .description('Generate image')
  .action(async (prompt, output) => {
    try {
      console.log('Generating image...');
      const imageBuffer = await client.generateImage(prompt);
      await fs.writeFile(output, imageBuffer);
      console.log(`Image saved to ${output}`);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

## Testing Integration

### Jest/Vitest

```typescript
// __tests__/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createFrasbergClient } from '@frasberg/core-sdk';

describe('Integration Tests', () => {
  let app: express.Application;
  let server: any;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    const client = createFrasbergClient();
    
    app.post('/api/generate-text', async (req, res) => {
      try {
        const result = await client.generateText(req.body.prompt);
        res.json({ result });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
    
    server = app.listen(0);  // Random port
  });
  
  afterAll(() => {
    server.close();
  });
  
  it('should generate text', async () => {
    const response = await request(app)
      .post('/api/generate-text')
      .send({ prompt: 'Hello' })
      .expect(200);
    
    expect(response.body).toHaveProperty('result');
    expect(typeof response.body.result).toBe('string');
  });
  
  it('should return 400 for missing prompt', async () => {
    const response = await request(app)
      .post('/api/generate-text')
      .send({})
      .expect(500);
    
    expect(response.body).toHaveProperty('error');
  });
});
```

## Related Documentation

- [Basic Usage](basic-usage.md) - Simple examples
- [Advanced Patterns](advanced-patterns.md) - Advanced techniques
- [API Reference](../api/client.md) - Complete API docs
- [Configuration](../getting-started/configuration.md) - Setup guide

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
