# Performance Guidelines

Best practices and guidelines for optimizing Frasberg SDK performance.

## Overview

Performance is critical for a good developer experience. This guide covers performance considerations, optimization techniques, and benchmarking strategies.

## Performance Targets

### Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Client initialization | < 10ms | < 50ms |
| Text generation (API call) | < 2s | < 5s |
| Image generation (API call) | < 5s | < 15s |
| Video generation (API call) | < 30s | < 60s |
| Configuration loading | < 5ms | < 20ms |

### Resource Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Bundle size (minified) | < 40KB | < 50KB |
| Bundle size (gzipped) | < 15KB | < 20KB |
| Memory usage (idle) | < 5MB | < 10MB |
| Memory usage (active) | < 20MB | < 50MB |
| Dependencies | < 5 | < 10 |

### Quality Targets

| Metric | Target |
|--------|--------|
| Test execution time | < 30s |
| Build time | < 60s |
| Type checking | < 10s |

## Client Performance

### Fast Initialization

**✅ Good: Lazy initialization**
```typescript
export function createFrasbergClient(config?: Partial<Config>): FrasbergClient {
  // Fast: Only validate config, don't make API calls
  const finalConfig = {
    ...loadEnvConfig(),
    ...config
  };
  
  validateConfig(finalConfig);
  
  return new FrasbergClient(finalConfig);
}
```

**❌ Bad: Eager initialization**
```typescript
export function createFrasbergClient(config?: Partial<Config>): FrasbergClient {
  const finalConfig = { ...loadEnvConfig(), ...config };
  validateConfig(finalConfig);
  
  // BAD: Don't make API calls during initialization
  await testConnection();  // Blocks initialization
  await warmupCache();     // Unnecessary delay
  
  return new FrasbergClient(finalConfig);
}
```

### Efficient Configuration

**✅ Good: Cache environment variables**
```typescript
let cachedConfig: Config | null = null;

export function loadEnvConfig(): Config {
  // Cache configuration
  if (cachedConfig) {
    return cachedConfig;
  }
  
  cachedConfig = {
    apiKey: process.env.FRASBERG_API_KEY || '',
    apiUrl: process.env.FRASBERG_API_URL || DEFAULT_API_URL,
    timeout: parseInt(process.env.FRASBERG_TIMEOUT || '30000', 10)
  };
  
  return cachedConfig;
}
```

**❌ Bad: Read environment repeatedly**
```typescript
export function loadEnvConfig(): Config {
  // Inefficient: Re-reads environment every time
  return {
    apiKey: process.env.FRASBERG_API_KEY || '',
    apiUrl: process.env.FRASBERG_API_URL || DEFAULT_API_URL,
    timeout: parseInt(process.env.FRASBERG_AI_TIMEOUT || '30000', 10)
  };
}
```

## API Call Performance

### Connection Reuse

**✅ Good: Reuse connections**
```typescript
export class FrasbergClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  
  constructor(config: Config) {
    this.baseUrl = config.apiUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'User-Agent': `frasberg-ai-sdk/${version}`
    };
  }
  
  async generateText(prompt: string): Promise<string> {
    // Reuse configured headers and base URL
    const response = await fetch(`${this.baseUrl}/text`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ prompt })
    });
    
    return await response.json();
  }
}
```

### Request Optimization

**✅ Good: Minimize payload**
```typescript
async function generateText(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  // Only send non-default options
  const payload: any = { prompt };
  
  if (options?.maxTokens !== undefined) {
    payload.maxTokens = options.maxTokens;
  }
  
  if (options?.temperature !== undefined) {
    payload.temperature = options.temperature;
  }
  
  return await apiCall('/text', payload);
}
```

**❌ Bad: Large payloads**
```typescript
async function generateText(
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  // Inefficient: Sends all options even if undefined
  const payload = {
    prompt,
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
    topP: options?.topP,
    frequencyPenalty: options?.frequencyPenalty,
    presencePenalty: options?.presencePenalty,
    stopSequences: options?.stopSequences,
    // ... many more fields
  };
  
  return await apiCall('/text', payload);
}
```

### Timeout Configuration

**✅ Good: Appropriate timeouts**
```typescript
const DEFAULT_TIMEOUTS = {
  text: 30000,      // 30s for text
  image: 60000,     // 60s for image
  video: 300000     // 5 min for video
};

async function apiCall(
  endpoint: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## Memory Management

### Avoid Memory Leaks

**✅ Good: Clean up resources**
```typescript
export class FrasbergClient {
  private eventListeners: Map<string, Function[]> = new Map();
  
  on(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }
  
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  
  destroy(): void {
    // Clean up to prevent memory leaks
    this.eventListeners.clear();
  }
}
```

**❌ Bad: No cleanup**
```typescript
export class FrasbergClient {
  private eventListeners: Map<string, Function[]> = new Map();
  
  on(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }
  
  // Missing: No way to remove listeners or cleanup
}
```

### Efficient Data Structures

**✅ Good: Use appropriate data structures**
```typescript
// Use Map for key-value lookups
const cache = new Map<string, Result>();

// Use Set for unique values
const processedIds = new Set<string>();

// Use WeakMap for object associations (auto garbage collected)
const metadata = new WeakMap<object, Metadata>();
```

**❌ Bad: Inefficient structures**
```typescript
// Arrays are slow for lookups
const cache: Array<{ key: string; value: Result }> = [];

function getCached(key: string): Result | undefined {
  // O(n) lookup
  return cache.find(item => item.key === key)?.value;
}
```

## Bundle Size Optimization

### Tree Shaking

**✅ Good: Named exports**
```typescript
// utils.ts - Each function can be tree-shaken
export function validateUrl(url: string): boolean { ... }
export function sanitizeInput(input: string): string { ... }
export function formatError(error: Error): string { ... }

// Users import only what they need
import { validateUrl } from './utils';
```

**❌ Bad: Default export with everything**
```typescript
// utils.ts - Entire object included in bundle
export default {
  validateUrl: (url: string) => { ... },
  sanitizeInput: (input: string) => { ... },
  formatError: (error: Error) => { ... },
  // ... many more functions
};

// Users get everything even if they need one function
import utils from './utils';
utils.validateUrl(url);
```

### Minimize Dependencies

**✅ Good: Zero dependencies for simple tasks**
```typescript
// Implement simple functionality yourself
export function debounce<T extends Function>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as any;
}
```

**❌ Bad: Heavy dependencies**
```typescript
// Don't import large libraries for simple tasks
import _ from 'lodash';  // Adds ~70KB

export function debounce<T extends Function>(func: T, wait: number): T {
  return _.debounce(func, wait) as T;
}
```

### Code Splitting

```typescript
// Dynamic imports for optional features
export async function generateWithAdvancedOptions(
  prompt: string,
  options: AdvancedOptions
): Promise<string> {
  // Only load advanced processor when needed
  const { AdvancedProcessor } = await import('./advanced-processor');
  const processor = new AdvancedProcessor(options);
  return processor.generate(prompt);
}
```

## Benchmarking

### Setup Benchmarks

```typescript
// benchmarks/client.bench.ts
import { bench, describe } from 'vitest';
import { createFrasbergClient } from '../src';

describe('Client Performance', () => {
  bench('createFrasbergClient', () => {
    createFrasbergClient();
  });
  
  bench('createFrasbergClient with config', () => {
    createFrasbergClient({
      apiKey: 'test-key',
      apiUrl: 'https://test.api.com'
    });
  });
});

describe('API Calls', () => {
  const client = createFrasbergClient();
  
  bench('generateText (mocked)', async () => {
    // Mock fetch for consistent benchmarks
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'test' })
    });
    
    await client.generateText('test prompt');
  });
});
```

### Run Benchmarks

```bash
# Run all benchmarks
npm run bench

# Run specific benchmark
npm run bench -- benchmarks/client.bench.ts

# With comparison
npm run bench -- --compare
```

### Benchmark CI

```yaml
# .github/workflows/benchmark.yml
name: Benchmark

on:
  pull_request:
    branches: [main, dev]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run benchmarks
        run: npm run bench
      
      - name: Compare with base
        run: |
          git fetch origin main
          git checkout origin/main
          npm ci
          npm run bench > baseline.txt
          
          git checkout -
          npm run bench > current.txt
          
          # Compare results
          node scripts/compare-benchmarks.js
```

## Performance Monitoring

### Track Metrics

```typescript
// src/telemetry.ts (optional, with user consent)
export function trackPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  if (telemetryEnabled && userOptedIn) {
    sendMetric({
      type: 'performance',
      operation,
      duration,
      metadata,
      version: packageVersion,
      timestamp: Date.now()
    });
  }
}

// Usage
export async function generateText(prompt: string): Promise<string> {
  const startTime = performance.now();
  
  try {
    const result = await apiCall('/text', { prompt });
    const duration = performance.now() - startTime;
    
    trackPerformance('generateText', duration, {
      promptLength: prompt.length
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackPerformance('generateText.error', duration);
    throw error;
  }
}
```

### Performance Budget

```json
{
  "performance": {
    "budgets": [
      {
        "operation": "createClient",
        "maxDuration": 50,
        "unit": "ms"
      },
      {
        "operation": "generateText",
        "maxDuration": 5000,
        "unit": "ms"
      }
    ]
  }
}
```

## Best Practices

### 1. Measure First

- Benchmark before optimizing
- Profile to find bottlenecks
- Use real-world scenarios

### 2. Optimize Hot Paths

- Focus on frequently called code
- Optimize critical user flows
- Don't optimize prematurely

### 3. Balance Tradeoffs

- Performance vs. readability
- Bundle size vs. functionality
- Latency vs. throughput

### 4. Monitor in Production

- Track real user metrics
- Set up performance budgets
- Alert on regressions

### 5. Document Decisions

- Explain optimization choices
- Note performance implications
- Track historical performance

## Performance Checklist

- [ ] Bundle size under budget
- [ ] All benchmarks passing
- [ ] No memory leaks
- [ ] Efficient algorithms used
- [ ] Minimal dependencies
- [ ] Tree-shaking enabled
- [ ] Response times acceptable
- [ ] Resource usage reasonable
- [ ] Performance tests in CI
- [ ] Monitoring in place

## Tools

### Profiling
- Chrome DevTools
- Node.js profiler
- clinic.js

### Benchmarking
- Vitest bench
- Benchmark.js
- hyperfine

### Bundle Analysis
- webpack-bundle-analyzer
- source-map-explorer
- bundlesize

### Monitoring
- New Relic
- Datadog
- Custom telemetry

## Related Documentation

- [Testing Guide](../development/testing.md)
- [Best Practices](../guides/best-practices.md)
- [Monitoring Guide](monitoring.md)
- [Maintenance Schedule](maintenance-schedule.md)

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
