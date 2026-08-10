# Security Policy

Security guidelines, vulnerability reporting, and secure coding practices for the Frasberg SDK.

## Reporting Security Vulnerabilities

### Do Not Create Public Issues

**NEVER** report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### Reporting Process

1. **Email Security Team**
   
   Send details to: **security@emeraldorbit.com**

2. **Include Following Information**

   ```
   Subject: [SECURITY] Frasberg SDK - [Brief Description]

   **Vulnerability Type:**
   [e.g., Authentication bypass, SQL injection, XSS, etc.]

   **Affected Versions:**
   [e.g., 1.0.0 - 1.2.0]

   **Description:**
   [Detailed description of the vulnerability]

   **Steps to Reproduce:**
   1. Step 1
   2. Step 2
   3. Step 3

   **Proof of Concept:**
   [Code or commands demonstrating the vulnerability]

   **Impact:**
   [What an attacker could achieve]

   **Suggested Fix:**
   [If you have suggestions]

   **Your Contact Information:**
   Name: [Your name]
   Email: [Your email]
   GitHub: [Your GitHub username]
   ```

3. **Response Timeline**

   - **Initial Response**: Within 48 hours
   - **Triage**: Within 5 business days
   - **Fix Timeline**: Depends on severity (see below)
   - **Disclosure**: Coordinated with reporter

### Severity Levels

#### Critical (CVSS 9.0-10.0)

- **Response Time**: Immediate
- **Fix Timeline**: 24-48 hours
- **Example**: Remote code execution, authentication bypass

#### High (CVSS 7.0-8.9)

- **Response Time**: Within 24 hours
- **Fix Timeline**: 3-7 days
- **Example**: Privilege escalation, sensitive data exposure

#### Medium (CVSS 4.0-6.9)

- **Response Time**: Within 3 days
- **Fix Timeline**: 14-30 days
- **Example**: Cross-site scripting (XSS), CSRF

#### Low (CVSS 0.1-3.9)

- **Response Time**: Within 7 days
- **Fix Timeline**: 30-90 days
- **Example**: Information disclosure, minor security improvements

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0.0 | ❌ No              |

## Security Best Practices

### For SDK Users

#### 1. Secure API Key Management

**✅ Good:**

```typescript
// Use environment variables
const client = createFrasbergClient({
  apiKey: process.env.FRASBERG_API_KEY
});
```

**❌ Bad:**

```typescript
// Never hardcode API keys
const client = createFrasbergClient({
  apiKey: 'sk-1234567890abcdef' // DON'T DO THIS!
});
```

#### 2. Environment Configuration

**Create `.env` file:**

```bash
FRASBERG_API_KEY=your-secure-key-here
FRASBERG_API_URL=https://api.frasberg.yourdomain.com
```

**Add to `.gitignore`:**

```bash
# Environment files
.env
.env.local
.env.*.local
```

#### 3. Input Validation

```typescript
// Validate user input
function validatePrompt(prompt: string): void {
  if (!prompt || prompt.length === 0) {
    throw new Error('Prompt cannot be empty');
  }
  
  if (prompt.length > 10000) {
    throw new Error('Prompt exceeds maximum length');
  }
  
  // Sanitize if needed
  const sanitized = prompt.trim();
  return sanitized;
}

const userInput = req.body.prompt;
const validated = validatePrompt(userInput);
const result = await client.generateText(validated);
```

#### 4. Error Handling

**✅ Good:**

```typescript
try {
  const result = await client.generateText(prompt);
  return result;
} catch (error) {
  // Log error without exposing sensitive details
  logger.error('Generation failed', { 
    errorType: error.constructor.name 
  });
  
  // Return generic error to user
  throw new Error('Text generation failed');
}
```

**❌ Bad:**

```typescript
try {
  const result = await client.generateText(prompt);
  return result;
} catch (error) {
  // DON'T expose internal errors to users
  return error.message; // May contain sensitive info
}
```

#### 5. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/generate', limiter);
```

#### 6. HTTPS Only

```typescript
// Ensure API URL uses HTTPS
const apiUrl = process.env.FRASBERG_API_URL;

if (!apiUrl.startsWith('https://')) {
  throw new Error('API URL must use HTTPS');
}
```

#### 7. Dependency Security

```bash
# Regularly audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### For SDK Contributors

#### 1. Secure Coding Practices

**Avoid Injection Vulnerabilities:**

```typescript
// ✅ Good - Use parameterized queries/requests
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({ prompt })
});

// ❌ Bad - Never concatenate user input into URLs
const response = await fetch(`${apiUrl}?prompt=${prompt}`);
```

**Validate All Inputs:**

```typescript
export function validateConfig(config: Config): void {
  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new Error('Invalid API key');
  }
  
  if (!config.apiUrl || !isValidUrl(config.apiUrl)) {
    throw new Error('Invalid API URL');
  }
  
  if (config.timeout && (config.timeout < 0 || config.timeout > 300000)) {
    throw new Error('Invalid timeout value');
  }
}
```

**Sanitize Output:**

```typescript
export function sanitizeResponse(data: unknown): string {
  if (typeof data !== 'string') {
    throw new Error('Invalid response type');
  }
  
  // Remove potential XSS vectors if returning to web clients
  return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
```

#### 2. Secrets Management

**Never commit secrets:**

```bash
# Check before committing
git diff --cached | grep -i "api[_-]key\|secret\|password"
```

**Use environment variables:**

```typescript
// tests/setup.ts
if (process.env.CI) {
  // Use secrets from CI environment
  process.env.FRASBERG_API_KEY = process.env.CI_API_KEY;
} else {
  // Load from .env for local development
  dotenv.config({ path: '.env.test' });
}
```

#### 3. Secure Dependencies

**Review dependencies:**

```bash
# Check dependency licenses
npm install -g license-checker
license-checker --summary

# Check for known vulnerabilities
npm audit

# Check for outdated packages
npm outdated
```

**Pin dependencies:**

```json
{
  "dependencies": {
    "typescript": "5.3.3"  // Exact version, not ^5.3.3
  }
}
```

#### 4. Code Review Security Checklist

- [ ] No hardcoded credentials
- [ ] Input validation implemented
- [ ] Output sanitization applied
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS enforced for external calls
- [ ] Dependencies reviewed and up to date
- [ ] Rate limiting considered
- [ ] Audit logging in place

## Security Headers

When using the SDK in web applications:

```typescript
// Express.js example
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

## Vulnerability Disclosure

### Our Commitment

We are committed to:
- Acknowledging receipt of vulnerability reports promptly
- Working with security researchers to understand and address issues
- Keeping reporters informed throughout the process
- Recognizing researchers who report vulnerabilities responsibly

### Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Initial response and triage
3. **Day 3-7**: Verification and impact assessment
4. **Day 7-90**: Develop and test fix
5. **Day 90+**: Release fix and coordinate disclosure

### Public Disclosure

- **Coordinated**: Work with reporter on disclosure timing
- **Embargo**: Typically 90 days from report
- **Early Disclosure**: If actively exploited or public knowledge
- **Credit**: Reporter credited unless they prefer anonymity

## Security Advisories

View published security advisories:
- [GitHub Security Advisories](https://github.com/emeraldorbit/frasberg-backend/security/advisories)
- [CHANGELOG.md](../../CHANGELOG.md) (security fixes noted)

## Security Updates

### Notification Channels

- **GitHub Watch**: Watch the repository for security updates
- **NPM**: Advisories published via NPM
- **Email**: Subscribe to security mailing list (contact security team)

### Update Process

When a security update is released:

```bash
# Check current version
npm list @frasberg/core-sdk

# Update to latest
npm update @frasberg/core-sdk

# Or specify version
npm install @frasberg/core-sdk@latest

# Verify update
npm list @frasberg/core-sdk
```

## Security Audit History

| Date       | Auditor      | Findings | Status   |
|------------|--------------|----------|----------|
| 2024-01-15 | Internal     | 0 High   | Resolved |
| -          | -            | -        | -        |

## Compliance

### Standards

The Frasberg SDK aims to comply with:
- **OWASP Top 10** - Web application security risks
- **CWE Top 25** - Most dangerous software weaknesses
- **NIST** - Security and privacy controls

### Certifications

- Security audit: Pending
- Penetration testing: Pending

## Bug Bounty Program

Currently, we do not have a public bug bounty program. However, we greatly appreciate responsible disclosure and will:
- Acknowledge your contribution
- Keep you informed of progress
- Credit you in security advisories (if desired)

## Security Contact

**Email:** security@emeraldorbit.com  
**PGP Key:** Available upon request  
**Response Time:** 48 hours

## Related Documentation

- [Best Practices](../guides/best-practices.md)
- [Error Handling](../guides/error-handling.md)
- [Configuration](../getting-started/configuration.md)
- [Contributing Guide](../development/contributing.md)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
