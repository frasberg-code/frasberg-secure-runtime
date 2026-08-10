# Environment Setup

Complete guide for setting up your development environment for the Frasberg AI SDK.

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/emeraldorbit/frasberg-ai-backend.git
cd frasberg-ai-backend/frasberg-ai-sdk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the SDK root:

```env
FRASBERG_AI_API_KEY=your-development-api-key
FRASBERG_AI_API_URL=https://api.frasberg-ai.yourdomain.com
```

**Important:** Never commit the `.env` file to source control.

### 4. Build the SDK

```bash
npm run build
```

### 5. Run Tests

```bash
npm test
```

## GitHub Secrets Setup

For CI/CD pipelines and GitHub Actions:

### Adding Secrets

1. Navigate to your repository on GitHub
2. Go to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Description |
|-------------|-------------|
| `FRASBERG_AI_API_KEY` | Your Frasberg AI API key |
| `FRASBERG_AI_API_URL` | API base URL (optional) |

### Using in Workflows

Reference secrets in your GitHub Actions workflows:

```yaml
name: Test SDK

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        env:
          FRASBERG_AI_API_KEY: ${{ secrets.FRASBERG_AI_API_KEY }}
        run: npm test
```

## Supabase Vault Configuration

For production deployments with Supabase:

### 1. Enable Vault Extension

```sql
CREATE EXTENSION IF NOT EXISTS vault;
```

### 2. Store API Keys

```sql
-- Insert secret
INSERT INTO vault.secrets (name, secret)
VALUES ('frasberg_ai_api_key', 'your-production-api-key');

-- Verify storage
SELECT name, created_at 
FROM vault.secrets 
WHERE name = 'frasberg_ai_api_key';
```

### 3. Create Retrieval Function

```sql
CREATE OR REPLACE FUNCTION get_frasberg_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = 'frasberg_ai_api_key';
  
  RETURN secret_value;
END;
$$;
```

### 4. Use in Application

```typescript
import { createClient } from '@supabase/supabase-js';
import { createFrasbergClient } from '@frasberg/core-sdk';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function initFrasbergClient() {
  const { data: apiKey } = await supabase
    .rpc('get_frasberg_api_key');
  
  process.env.FRASBERG_AI_API_KEY = apiKey;
  return createFrasbergClient();
}
```

## Development Workflow

### Recommended Tools

- **Node Version Manager (nvm)** - Manage Node.js versions
- **Visual Studio Code** - IDE with TypeScript support
- **Git** - Version control
- **GitHub CLI** - Command-line GitHub operations

### VS Code Extensions

Install these extensions for optimal development:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- GitLens

### Environment Validation Script

Create a validation script to verify your setup:

```typescript
// scripts/validate-env.ts
import { createFrasbergClient } from '../src';

async function validateEnvironment() {
  console.log('Validating environment...');
  
  // Check required variables
  if (!process.env.FRASBERG_AI_API_KEY) {
    throw new Error('FRASBERG_AI_API_KEY is not set');
  }
  
  // Test client creation
  try {
    const client = createFrasbergClient();
    console.log('✓ Client created successfully');
  } catch (error) {
    console.error('✗ Client creation failed:', error.message);
    process.exit(1);
  }
  
  console.log('✓ Environment is valid');
}

validateEnvironment();
```

Run with:

```bash
npx tsx scripts/validate-env.ts
```

## Troubleshooting

### Common Issues

**Missing API Key**
```
Error: FRASBERG_AI_API_KEY is missing
```
Solution: Ensure your `.env` file exists and contains the API key.

**Build Failures**
```
Error: Cannot find module 'typescript'
```
Solution: Run `npm install` to install all dependencies.

**Type Errors**
```
TS2304: Cannot find name 'Buffer'
```
Solution: Ensure `@types/node` is installed.

## Next Steps

- [Local Workflow](../development/local-workflow.md) - Development patterns
- [Testing Guide](../development/testing.md) - Write and run tests
- [Contributing](../development/contributing.md) - Contribution guidelines
