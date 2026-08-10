# Troubleshooting

Common issues and solutions for the Frasberg AI SDK.

## Installation Issues

### Cannot Find Module '@frasberg/core-sdk'

**Error:**
```
Error: Cannot find module '@frasberg/core-sdk'
```

**Solutions:**

1. Verify installation:
   ```bash
   npm list @frasberg/core-sdk
   ```

2. Reinstall the package:
   ```bash
   npm install @frasberg/core-sdk
   ```

3. Clear npm cache:
   ```bash
   npm cache clean --force
   npm install
   ```

4. Check `.npmrc` for GitHub Packages authentication:
   ```
   @frasberg:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

### TypeScript Cannot Find Type Definitions

**Error:**
```
Could not find a declaration file for module '@frasberg/core-sdk'
```

**Solutions:**

1. Ensure TypeScript is installed:
   ```bash
   npm install --save-dev typescript @types/node
   ```

2. Check `tsconfig.json` includes node types:
   ```json
   {
     "compilerOptions": {
       "types": ["node"]
     }
   }
   ```

3. Rebuild the SDK:
   ```bash
   cd node_modules/@frasberg/core-sdk
   npm run build
   ```

## Configuration Issues

### Missing API Key Error

**Error:**
```
Error: FRASBERG_AI_API_KEY is missing
```

**Solutions:**

1. Set environment variable:
   ```bash
   export FRASBERG_AI_API_KEY="your-api-key"
   ```

2. Create `.env` file:
   ```env
   FRASBERG_AI_API_KEY=your-api-key
   ```

3. Load environment variables:
   ```typescript
   import 'dotenv/config';
   import { createFrasbergClient } from '@frasberg/core-sdk';
   ```

4. For GitHub Actions, add secret:
   - Go to: Settings → Secrets → Actions
   - Add `FRASBERG_AI_API_KEY`

### Invalid API Key

**Error:**
```
Error: Text generation failed: 401
```

**Solutions:**

1. Verify API key is correct and not expired
2. Check for extra spaces or newlines in the key
3. Ensure key has proper permissions
4. Try regenerating the API key
5. Verify the key format matches expected pattern

## Runtime Errors

### Network Timeout

**Error:**
```
Error: fetch failed
Error: network timeout
```

**Solutions:**

1. Check internet connectivity:
   ```bash
   curl https://api.frasberg-ai.yourdomain.com
   ```

2. Verify API URL is correct:
   ```bash
   echo $FRASBERG_AI_API_URL
   ```

3. Check firewall settings
4. Implement retry logic:
   ```typescript
   async function generateWithRetry(prompt: string, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await client.generateText(prompt);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
       }
     }
   }
   ```

### Rate Limit Exceeded

**Error:**
```
Error: Image generation failed: 429
```

**Solutions:**

1. Implement exponential backoff:
   ```typescript
   async function handleRateLimit() {
     try {
       return await client.generateImage(prompt);
     } catch (error) {
       if (error.message.includes('429')) {
         await new Promise(r => setTimeout(r, 5000));
         return await client.generateImage(prompt);
       }
       throw error;
     }
   }
   ```

2. Reduce request frequency
3. Implement request queuing
4. Contact support to increase rate limits

### Server Error (500, 502)

**Error:**
```
Error: Video generation failed: 500
Error: Video generation failed: 502
```

**Solutions:**

1. Wait and retry after a few seconds
2. Implement automatic retry:
   ```typescript
   async function generateWithServerErrorRetry(prompt: string) {
     const maxRetries = 3;
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await client.generateVideo(prompt);
       } catch (error) {
         const isServerError = error.message.includes('500') || 
                               error.message.includes('502');
         if (isServerError && i < maxRetries - 1) {
           await new Promise(r => setTimeout(r, 2000));
           continue;
         }
         throw error;
       }
     }
   }
   ```

3. Check API status page
4. Report persistent issues to support

### Gateway Timeout (504)

**Error:**
```
Error: Video generation failed: 504
```

**Solutions:**

1. Simplify your prompt
2. Break complex requests into smaller parts
3. Implement longer timeouts for video generation
4. Try generating at off-peak times

## Build Issues

### TypeScript Compilation Errors

**Error:**
```
TS2307: Cannot find module '@frasberg/core-sdk' or its corresponding type declarations
```

**Solutions:**

1. Install dependencies:
   ```bash
   npm install
   ```

2. Rebuild SDK:
   ```bash
   npm run build
   ```

3. Check `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

### Build Output Missing

**Error:**
```
Error: Cannot find module './dist/index.js'
```

**Solutions:**

1. Build the project:
   ```bash
   npm run build
   ```

2. Check `dist/` directory exists:
   ```bash
   ls -la dist/
   ```

3. Verify `package.json` build script:
   ```json
   {
     "scripts": {
       "build": "tsc -p tsconfig.json"
     }
   }
   ```

## Testing Issues

### Tests Hanging

**Issue:** Tests run indefinitely without completing

**Solutions:**

1. Ensure proper cleanup:
   ```typescript
   afterAll(() => {
     // Cleanup code
   });
   ```

2. Add timeouts to tests:
   ```typescript
   test('generates text', async () => {
     // test code
   }, 30000); // 30 second timeout
   ```

3. Mock external calls in unit tests:
   ```typescript
   jest.mock('@frasberg/core-sdk', () => ({
     createFrasbergClient: () => ({
       generateText: async () => 'mock result'
     })
   }));
   ```

### Tests Failing in CI

**Issue:** Tests pass locally but fail in CI

**Solutions:**

1. Check environment variables in CI:
   ```yaml
   env:
     FRASBERG_AI_API_KEY: ${{ secrets.FRASBERG_AI_API_KEY }}
   ```

2. Verify secrets are configured in GitHub

3. Check network access from CI environment

4. Use longer timeouts for CI:
   ```typescript
   test('generates video', async () => {
     // test code
   }, process.env.CI ? 120000 : 60000);
   ```

## Performance Issues

### Slow Response Times

**Issue:** Requests taking longer than expected

**Solutions:**

1. Check network latency:
   ```bash
   ping api.frasberg-ai.yourdomain.com
   ```

2. Verify API endpoint URL

3. Simplify prompts for faster processing

4. Use parallel processing:
   ```typescript
   const results = await Promise.all([
     client.generateText(prompt1),
     client.generateText(prompt2)
   ]);
   ```

### Memory Usage Issues

**Issue:** High memory consumption

**Solutions:**

1. Process large batches sequentially:
   ```typescript
   for (const prompt of prompts) {
     const result = await client.generateImage(prompt);
     await processResult(result);
     // Result can be garbage collected before next iteration
   }
   ```

2. Implement streaming for large files

3. Monitor memory usage:
   ```typescript
   console.log('Memory:', process.memoryUsage());
   ```

## Getting Help

If you can't resolve your issue:

1. **Check Documentation:**
   - [API Reference](../api/client.md)
   - [Error Handling Guide](error-handling.md)
   - [Best Practices](best-practices.md)

2. **Search Existing Issues:**
   - Visit: https://github.com/emeraldorbit/frasberg-ai-backend/issues

3. **Create New Issue:**
   - Use bug report template
   - Include error messages
   - Provide minimal reproduction
   - Specify SDK version: `npm list @frasberg/core-sdk`

4. **Security Issues:**
   - Email: security@emeraldorbit.com
   - See: [Security Policy](../governance/security.md)

## Diagnostic Commands

Run these to gather information for support:

```bash
# SDK version
npm list @frasberg/core-sdk

# Node version
node --version

# TypeScript version
npx tsc --version

# Check environment
echo $FRASBERG_AI_API_KEY | head -c 20  # Shows first 20 chars only

# Test network connectivity
curl -I https://api.frasberg-ai.yourdomain.com

# Check build output
ls -la node_modules/@frasberg/core-sdk/dist/
```

## Related Guides

- [Error Handling](error-handling.md) - Error handling patterns
- [Best Practices](best-practices.md) - Production patterns
- [Configuration](../getting-started/configuration.md) - Setup guide
