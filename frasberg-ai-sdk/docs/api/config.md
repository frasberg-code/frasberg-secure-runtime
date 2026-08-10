# Configuration API Reference

API reference for the Frasberg AI SDK configuration system.

## loadFrasbergConfig

Loads and validates the Frasberg AI SDK configuration.

### Signature

```typescript
function loadFrasbergConfig(): FrasbergSystemConfig
```

### Returns

`FrasbergSystemConfig` - The validated configuration object

### Example

```typescript
import { loadFrasbergConfig } from '@frasberg/core-sdk';

const config = loadFrasbergConfig();
console.log('Configuration loaded:', config);
```

### Behavior

The `loadFrasbergConfig` function:
1. Reads configuration from the environment
2. Validates required fields
3. Returns a configuration object

### Usage in Client

This function is called internally by `createFrasbergClient()`:

```typescript
// Inside createFrasbergClient()
const config = loadFrasbergConfig();
```

You typically don't need to call this directly unless you want to validate configuration before creating a client.

---

## FrasbergSystemConfig

Type representing the SDK configuration.

### Type Definition

```typescript
interface FrasbergSystemConfig {
  // Configuration structure
  // (Specific fields depend on implementation)
}
```

### Fields

The configuration object contains system-level settings for the SDK. Currently, the SDK uses environment variables directly, so this interface serves as a placeholder for future configuration expansions.

---

## Environment Variables

Configuration is loaded from environment variables:

### Required Variables

**`FRASBERG_AI_API_KEY`**

Your Frasberg AI API authentication key.

```bash
export FRASBERG_AI_API_KEY="your-api-key-here"
```

**Throws:** Error if not set

### Optional Variables

**`FRASBERG_AI_API_URL`**

Base URL for the Frasberg AI API.

```bash
export FRASBERG_AI_API_URL="https://api.frasberg-ai.yourdomain.com"
```

**Default:** `https://api.frasberg-ai.yourdomain.com`

---

## Configuration Validation

The SDK validates configuration on initialization:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

try {
  const client = createFrasbergClient();
  console.log('Configuration is valid');
} catch (error) {
  console.error('Configuration error:', error.message);
  // Output: "FRASBERG_AI_API_KEY is missing"
}
```

---

## Configuration Methods

### 1. Environment Variables (Recommended)

```bash
export FRASBERG_AI_API_KEY="your-key"
export FRASBERG_AI_API_URL="https://api.frasberg-ai.com"
```

### 2. .env File (Local Development)

Create `.env` file:

```env
FRASBERG_AI_API_KEY=your-key
FRASBERG_AI_API_URL=https://api.frasberg-ai.com
```

Load with dotenv:

```typescript
import 'dotenv/config';
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
```

### 3. GitHub Secrets (CI/CD)

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      FRASBERG_AI_API_KEY: ${{ secrets.FRASBERG_AI_API_KEY }}
    steps:
      - uses: actions/checkout@v3
      - run: npm test
```

### 4. Supabase Vault (Production)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

async function getApiKey() {
  const { data } = await supabase.rpc('get_secret', {
    secret_name: 'frasberg_ai_api_key'
  });
  
  process.env.FRASBERG_AI_API_KEY = data;
}

await getApiKey();
const client = createFrasbergClient();
```

---

## Security Best Practices

### ✅ DO

- Load API keys from environment variables
- Use GitHub Secrets for CI/CD
- Use Supabase Vault for production
- Validate configuration at startup
- Keep different keys for dev/prod

### ❌ DON'T

- Hardcode API keys in source code
- Commit `.env` files to git
- Log API keys
- Share API keys in plain text
- Use production keys in development

---

## Configuration Validation Examples

### Startup Validation

```typescript
#!/usr/bin/env node

import { createFrasbergClient } from '@frasberg/core-sdk';

function validateEnvironment() {
  const required = ['FRASBERG_AI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }
  
  try {
    createFrasbergClient();
    console.log('✓ Configuration valid');
  } catch (error) {
    console.error('✗ Configuration error:', error.message);
    process.exit(1);
  }
}

validateEnvironment();
```

### Runtime Validation

```typescript
function ensureConfigured() {
  if (!process.env.FRASBERG_AI_API_KEY) {
    throw new Error(
      'FRASBERG_AI_API_KEY must be set. ' +
      'See: https://docs.frasberg-ai.com/configuration'
    );
  }
}

ensureConfigured();
const client = createFrasbergClient();
```

---

## Configuration for Testing

### Mock Configuration

```typescript
// test-setup.ts
process.env.FRASBERG_AI_API_KEY = 'test-key';
process.env.FRASBERG_AI_API_URL = 'https://test-api.frasberg-ai.com';
```

### Per-Test Configuration

```typescript
describe('SDK Tests', () => {
  const originalKey = process.env.FRASBERG_AI_API_KEY;
  
  beforeEach(() => {
    process.env.FRASBERG_AI_API_KEY = 'test-key';
  });
  
  afterEach(() => {
    process.env.FRASBERG_AI_API_KEY = originalKey;
  });
  
  it('creates client', () => {
    const client = createFrasbergClient();
    expect(client).toBeDefined();
  });
});
```

---

## Troubleshooting

### Missing API Key

**Error:** `FRASBERG_AI_API_KEY is missing`

**Solution:**
```bash
export FRASBERG_AI_API_KEY="your-key"
```

### Invalid Configuration

**Error:** `Configuration validation failed`

**Solution:** Check all required fields are set and valid

### Environment Not Loading

**Solution:** Ensure dotenv is imported before SDK:
```typescript
import 'dotenv/config'; // Must be first
import { createFrasbergClient } from '@frasberg/core-sdk';
```

---

## Related Documentation

- [Configuration Guide](../getting-started/configuration.md) - Complete setup guide
- [Environment Setup](../getting-started/environment-setup.md) - Development environment
- [Security Policy](../governance/security.md) - Security guidelines
- [Client API](client.md) - Client methods reference
