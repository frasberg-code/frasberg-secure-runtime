# Configuration

## Environment Variables

The Frasberg AI SDK requires the following environment variables:

### Required

**`FRASBERG_AI_API_KEY`**  
Your Frasberg AI API authentication key.

```bash
export FRASBERG_AI_API_KEY="your-api-key-here"
```

### Optional

**`FRASBERG_AI_API_URL`**  
Base URL for the Frasberg AI API.  
Default: `https://api.frasberg-ai.yourdomain.com`

```bash
export FRASBERG_AI_API_URL="https://api.frasberg-ai.yourdomain.com"
```

## Configuration Methods

### 1. Environment File

Create a `.env` file in your project root:

```env
FRASBERG_AI_API_KEY=your-api-key-here
FRASBERG_AI_API_URL=https://api.frasberg-ai.yourdomain.com
```

Load it using a package like `dotenv`:

```typescript
import 'dotenv/config';
import { createFrasbergClient } from '@frasberg/core-sdk';

const client = createFrasbergClient();
```

### 2. GitHub Secrets

For CI/CD workflows, store credentials in GitHub Secrets:

1. Navigate to: Repository → Settings → Secrets and variables → Actions
2. Add `FRASBERG_AI_API_KEY` as a secret
3. Reference in workflows:

```yaml
env:
  FRASBERG_AI_API_KEY: ${{ secrets.FRASBERG_AI_API_KEY }}
```

### 3. Supabase Vault

For production deployments, use Supabase Vault:

```sql
-- Store secret in Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('frasberg_ai_api_key', 'your-api-key-here');
```

Retrieve in your application:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const { data } = await supabase.rpc('get_secret', { 
  secret_name: 'frasberg_ai_api_key' 
});

process.env.FRASBERG_AI_API_KEY = data;
```

## Security Best Practices

- **Never commit API keys** to source control
- Use `.env` files only for local development
- Store production keys in GitHub Secrets or Supabase Vault
- Rotate API keys regularly
- Use separate keys for development and production

## Configuration Validation

The SDK validates configuration on initialization:

```typescript
import { createFrasbergClient } from '@frasberg/core-sdk';

try {
  const client = createFrasbergClient();
  console.log('Configuration valid');
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

## Next Steps

- [Quickstart Guide](quickstart.md) - Start using the SDK
- [Environment Setup](environment-setup.md) - Complete development environment
- [Security Policy](../governance/security.md) - Security guidelines
