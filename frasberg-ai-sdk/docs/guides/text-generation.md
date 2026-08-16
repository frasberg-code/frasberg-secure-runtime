# Text Generation Guide

Comprehensive guide to text generation with the Frasberg SDK.

## Basic Usage

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();

const result = await client.generateText('Explain photosynthesis');
console.log(result);
```

## Input Format

The `generateText` method accepts a string prompt:

```typescript
generateText(input: string): Promise<string>
```

### Parameters

- **input** (string, required): The text prompt to generate from

## Response Format

Returns a `Promise<string>` containing the generated text.

```typescript
const text = await client.generateText('Write a poem about the ocean');
// text is a string containing the generated poem
```

## Use Cases

### Question Answering

```typescript
const answer = await client.generateText(
  'What are the benefits of renewable energy?'
);
```

### Content Generation

```typescript
const blogPost = await client.generateText(
  'Write an introduction about artificial intelligence'
);
```

### Code Explanation

```typescript
const explanation = await client.generateText(
  'Explain this code: const sum = arr.reduce((a, b) => a + b, 0);'
);
```

### Creative Writing

```typescript
const story = await client.generateText(
  'Write a short story about a robot learning to paint'
);
```

## Error Handling

Handle errors appropriately:

```typescript
try {
  const result = await client.generateText('Your prompt here');
  console.log(result);
} catch (error) {
  if (error.message.includes('failed: 401')) {
    console.error('Authentication error: Check your API key');
  } else if (error.message.includes('failed: 429')) {
    console.error('Rate limit exceeded: Try again later');
  } else {
    console.error('Generation error:', error.message);
  }
}
```

## Best Practices

### 1. Clear and Specific Prompts

**Good:**
```typescript
await client.generateText(
  'List three benefits of exercise with brief explanations'
);
```

**Avoid:**
```typescript
await client.generateText('exercise');
```

### 2. Appropriate Length

Keep prompts focused and reasonable in length. Very long prompts may be truncated.

### 3. Context Setting

Provide necessary context in your prompt:

```typescript
const result = await client.generateText(
  'As a technical writer, explain Docker containers to beginners'
);
```

### 4. Iterative Refinement

If results aren't as expected, refine your prompt:

```typescript
// First attempt
let result = await client.generateText('Explain APIs');

// Refined
result = await client.generateText(
  'Explain REST APIs in 3 sentences for someone new to programming'
);
```

## Performance Considerations

- **Timeout:** Text generation typically completes within 5-30 seconds
- **Prompt Length:** Shorter prompts generally process faster
- **Rate Limits:** Respect API rate limits to avoid throttling

## Common Patterns

### Batch Processing

```typescript
const prompts = [
  'Define machine learning',
  'Define neural networks',
  'Define deep learning'
];

const results = await Promise.all(
  prompts.map(prompt => client.generateText(prompt))
);
```

### Streaming Pattern (Future)

Currently, the SDK does not support streaming. All responses are returned after complete generation.

## Limitations

- No token counting in current version
- No temperature or max tokens control (uses API defaults)
- Single request per call (no batching at SDK level)
- No streaming support

## Related Guides

- [Error Handling](error-handling.md) - Handle errors effectively
- [Best Practices](best-practices.md) - Production patterns
- [Troubleshooting](troubleshooting.md) - Common issues
