# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within the Frasberg AI SDK, please send an email to security@emeraldestates.com. All security vulnerabilities will be promptly addressed.

**Please do not open public issues for security vulnerabilities.**

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (if available)

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Status Update**: Within 7 days of report
- **Fix Timeline**: Depending on severity (Critical: 7 days, High: 14 days, Medium/Low: 30 days)

## Security Best Practices

When using the Frasberg AI SDK:

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive configuration
3. **Rotate API keys regularly** (recommended: every 90 days)
4. **Use GitHub Secrets or Supabase Vault** for API key storage
5. **Enable HTTPS** for all API communications
6. **Validate all inputs** before sending to the SDK
7. **Keep the SDK updated** to the latest version
8. **Monitor API usage** for unusual patterns
9. **Implement rate limiting** in your application
10. **Use least privilege access** for API keys

## Disclosure Policy

When we receive a security report, we will:

1. Confirm the vulnerability and determine its impact
2. Work on a fix and prepare a release
3. Notify users of the vulnerability and the need to update
4. Release the security patch
5. Publicly disclose the vulnerability details after users have had time to update

## Contact

For any security-related questions or concerns, contact:
- Email: security@emeraldestates.com
- Security Team: @emeraldorbit
