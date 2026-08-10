# Monitoring Guide

Guidelines for monitoring the Frasberg AI SDK health, performance, and usage.

## Overview

Effective monitoring helps identify issues early, track performance, and understand usage patterns. This guide covers monitoring strategies for the SDK.

## Monitoring Categories

### 1. Package Health

#### NPM Download Stats

**Track:**
- Daily/weekly/monthly downloads
- Version distribution
- Geographic distribution

**Tools:**
```bash
# View package stats
npm view @frasberg/core-sdk

# Check specific version downloads
npm view @frasberg/core-sdk@1.2.0 downloads
```

**npm-stat (Advanced Analytics):**
```bash
npx npm-stat @frasberg/core-sdk

# Or use API
curl "https://api.npmjs.org/downloads/range/last-month/@frasberg/core-sdk"
```

**Metrics to Monitor:**
- Download trend (increasing/decreasing)
- Version adoption rate
- Downloads per version

#### GitHub Repository Metrics

**Track:**
- Stars/watchers
- Forks
- Open issues
- Open PRs
- Contributors

**GitHub Insights:**
```bash
# View traffic
gh api repos/frasberg/frasberg-ai-backend/traffic/views

# View clones
gh api repos/frasberg/frasberg-ai-backend/traffic/clones

# Popular content
gh api repos/frasberg/frasberg-ai-backend/traffic/popular/paths
```

**Metrics to Monitor:**
- Community growth
- Issue resolution time
- PR merge time
- Contributor activity

### 2. Code Quality

#### Test Coverage

**Track:**
- Overall coverage percentage
- Statement/branch/function coverage
- Coverage trends over time

**Commands:**
```bash
# Generate coverage report
npm test -- --coverage

# View coverage summary
cat coverage/coverage-summary.json
```

**Coverage Thresholds:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    }
  }
});
```

**Alert if:**
- Coverage drops below 80%
- New code has < 75% coverage
- Significant coverage regression

#### Build Status

**Track:**
- Build success rate
- Build duration
- Failed builds

**GitHub Actions:**
```bash
# List recent workflow runs
gh run list --workflow=test.yml --limit 10

# View specific run
gh run view [run-id]

# Check status
gh run list --json status,conclusion
```

**Alert if:**
- Build fails on main branch
- Build time increases significantly (>20%)
- Frequent build failures

#### Code Quality Metrics

**Track:**
- Linting errors/warnings
- Type errors
- Complexity metrics
- Code duplication

**Commands:**
```bash
# Run linter
npm run lint

# Type checking
tsc --noEmit

# Code complexity
npx complexity-report src/
```

### 3. Performance

#### Bundle Size

**Track:**
- Total bundle size
- Size by module
- Size trends

**Tools:**
```bash
# Check package size
npm pack --dry-run

# Analyze bundle
npx bundlesize

# Detailed analysis
npx source-map-explorer dist/*.js
```

**Size Budgets:**
```json
{
  "bundlesize": [
    {
      "path": "./dist/index.js",
      "maxSize": "50 kB"
    }
  ]
}
```

**Alert if:**
- Bundle size increases > 10%
- Bundle exceeds size budget
- Unexpected dependencies added

#### Runtime Performance

**Track:**
- API call latency
- Memory usage
- CPU usage
- Error rates

**Benchmarking:**
```typescript
// benchmarks/generate-text.bench.ts
import { bench, describe } from 'vitest';
import { createFrasbergClient } from '../src';

describe('generateText performance', () => {
  const client = createFrasbergClient();
  
  bench('simple prompt', async () => {
    await client.generateText('Hello world');
  });
  
  bench('complex prompt', async () => {
    await client.generateText('Long complex prompt...'.repeat(100));
  });
});
```

**Run benchmarks:**
```bash
npm run bench
```

**Alert if:**
- Latency increases > 20%
- Memory leaks detected
- Performance regression

### 4. Security

#### Vulnerability Scanning

**Track:**
- Known vulnerabilities
- Security advisories
- Dependency alerts

**npm audit:**
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# View JSON report
npm audit --json > audit-report.json
```

**Snyk (Optional):**
```bash
# Install Snyk
npm install -g snyk

# Test for vulnerabilities
snyk test

# Monitor continuously
snyk monitor
```

**Alert if:**
- Critical/high vulnerabilities found
- Security advisory published
- Vulnerable dependency detected

#### Dependabot Alerts

**Configure:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
```

**Monitor:**
- Check Dependabot PRs regularly
- Review security updates
- Merge critical patches quickly

### 5. Error Tracking

#### Error Rates

**Track (if telemetry enabled):**
- Error frequency
- Error types
- Affected versions

**Implementation:**
```typescript
// Optional telemetry
export function trackError(error: Error, context: any) {
  if (telemetryEnabled) {
    sendToAnalytics({
      type: 'error',
      message: error.message,
      stack: error.stack,
      context,
      version: packageVersion,
      timestamp: Date.now()
    });
  }
}
```

**Alert if:**
- Error rate spikes
- New error type appears
- Specific version has high error rate

#### Issue Tracking

**Monitor GitHub Issues:**
```bash
# List open bugs
gh issue list --label "bug" --state open

# Recently closed
gh issue list --label "bug" --state closed --limit 10

# High priority issues
gh issue list --label "priority:high" --state open
```

**Metrics:**
- Time to first response
- Time to resolution
- Bug severity distribution
- Regression rate

### 6. Usage Patterns

#### API Usage

**Track (if telemetry enabled):**
- Most used methods
- Parameter patterns
- Error scenarios
- Feature adoption

**Implementation:**
```typescript
export function trackUsage(method: string, params: any) {
  if (telemetryEnabled && userOptedIn) {
    sendToAnalytics({
      type: 'usage',
      method,
      params: sanitize(params),
      version: packageVersion,
      timestamp: Date.now()
    });
  }
}
```

#### Version Distribution

**Track:**
- Active versions
- Upgrade patterns
- Legacy version usage

**Query NPM API:**
```bash
# Version downloads
curl "https://api.npmjs.org/downloads/range/last-month/@frasberg/core-sdk"
```

## Monitoring Dashboard

### Recommended Metrics Dashboard

```
┌─────────────────────────────────────────────────────┐
│ Frasberg AI SDK - Health Dashboard                  │
├─────────────────────────────────────────────────────┤
│ Downloads                                           │
│ ├─ Daily: 1,234 ↑ 12%                              │
│ ├─ Weekly: 8,567 ↑ 8%                              │
│ └─ Monthly: 34,521 ↑ 15%                           │
├─────────────────────────────────────────────────────┤
│ Repository                                          │
│ ├─ Stars: 456 ↑ 12                                 │
│ ├─ Open Issues: 23 ↓ 3                             │
│ ├─ Open PRs: 5 →                                   │
│ └─ Contributors: 12 ↑ 2                            │
├─────────────────────────────────────────────────────┤
│ Quality                                             │
│ ├─ Test Coverage: 85% ✓                            │
│ ├─ Build Status: Passing ✓                         │
│ ├─ Bundle Size: 42KB ✓                             │
│ └─ Vulnerabilities: 0 ✓                            │
├─────────────────────────────────────────────────────┤
│ Performance                                         │
│ ├─ Avg Response Time: 125ms ✓                      │
│ ├─ P95 Response Time: 250ms ✓                      │
│ └─ Error Rate: 0.01% ✓                             │
└─────────────────────────────────────────────────────┘
```

### Implementation

**Option 1: GitHub Pages Dashboard**

```html
<!-- docs/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
  <title>SDK Health Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Frasberg AI SDK Health</h1>
  <canvas id="downloadsChart"></canvas>
  <canvas id="coverageChart"></canvas>
  
  <script>
    // Fetch and display metrics
    fetch('metrics.json')
      .then(r => r.json())
      .then(data => renderCharts(data));
  </script>
</body>
</html>
```

**Option 2: GitHub Actions + Issues**

```yaml
name: Weekly Health Report

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday

jobs:
  health-report:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Metrics
        run: |
          # Collect various metrics
          npm view @frasberg/core-sdk downloads > downloads.txt
          npm audit --json > audit.json
          
      - name: Create Report Issue
        uses: actions/github-script@v6
        with:
          script: |
            const report = generateHealthReport();
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Health Report - ${new Date().toISOString().split('T')[0]}`,
              body: report,
              labels: ['report', 'health']
            });
```

## Alerting

### Alert Channels

**1. GitHub Issues**
- Create issues for actionable items
- Label appropriately
- Assign to responsible team member

**2. Slack/Discord**
```bash
# Send alert to Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"⚠️ SDK test coverage dropped below 80%"}' \
  $SLACK_WEBHOOK_URL
```

**3. Email**
```bash
# Send email alert
echo "SDK bundle size exceeded budget" | \
  mail -s "SDK Alert" team@frasberg.com
```

### Alert Rules

**Critical Alerts (Immediate Action):**
- Build failures on main branch
- Critical security vulnerabilities
- Production errors > 5%
- Bundle size > 2x budget

**Warning Alerts (Action within 24 hours):**
- Test coverage drop > 5%
- High severity vulnerabilities
- Build time increase > 50%
- Error rate increase > 50%

**Info Alerts (Review next business day):**
- Download trend changes
- New dependencies added
- Documentation updates needed
- Performance regressions

## Continuous Monitoring

### GitHub Actions Workflows

**Daily Health Check:**
```yaml
name: Daily Health Check

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Tests
        run: npm test
      
      - name: Security Audit
        run: npm audit --audit-level=high
      
      - name: Check Bundle Size
        run: npm run check-size
      
      - name: Alert on Failure
        if: failure()
        run: |
          # Send alert
          curl -X POST $SLACK_WEBHOOK \
            -d '{"text":"Daily health check failed!"}'
```

### Synthetic Monitoring

**Test SDK in Real Environment:**
```typescript
// monitor/synthetic-test.ts
import { createFrasbergClient } from '@frasberg/core-sdk';

async function syntheticTest() {
  const startTime = Date.now();
  
  try {
    const client = createFrasbergClient();
    
    // Test text generation
    await client.generateText('Test prompt');
    
    // Test image generation
    await client.generateImage('Test image');
    
    const duration = Date.now() - startTime;
    
    // Report success
    reportMetric('synthetic_test_success', 1);
    reportMetric('synthetic_test_duration', duration);
  } catch (error) {
    // Report failure
    reportMetric('synthetic_test_failure', 1);
    alertTeam('Synthetic test failed', error);
  }
}

// Run every hour
setInterval(syntheticTest, 60 * 60 * 1000);
```

## Reporting

### Weekly Report Template

```markdown
# Frasberg AI SDK - Weekly Report

**Week:** [Date Range]

## Highlights
- ✨ New feature: [Feature name]
- 🐛 Fixed 5 bugs
- 📈 Downloads increased 12%

## Metrics

### Downloads
- This week: 8,567 (+8%)
- Last week: 7,935

### Quality
- Test coverage: 85% (+2%)
- Open issues: 23 (-3)
- Open PRs: 5

### Performance
- Bundle size: 42KB (no change)
- Build time: 45s (-5s)

## Issues
- 🚨 1 critical issue (fixed)
- ⚠️ 3 high priority issues (in progress)
- ℹ️ 19 normal issues

## Action Items
- [ ] Address performance regression in v1.2.3
- [ ] Update documentation for new feature
- [ ] Review and merge Dependabot PRs

## Next Week
- Release v1.3.0
- Focus on documentation
- Performance optimization
```

### Monthly Report

Include:
- Trend analysis
- Major accomplishments
- Challenges faced
- Plans for next month
- Graphs and charts

## Tools and Services

### Free Tools

- **npm stats**: Built-in download stats
- **GitHub Insights**: Repository analytics
- **npm audit**: Security scanning
- **Vitest**: Testing and coverage
- **Bundlesize**: Bundle size monitoring

### Paid Services (Optional)

- **Snyk**: Advanced security scanning
- **Sentry**: Error tracking
- **Datadog**: Application monitoring
- **New Relic**: Performance monitoring
- **LogRocket**: Session replay

## Best Practices

1. **Set Up Baselines**
   - Establish normal ranges
   - Document expected values
   - Track trends over time

2. **Automate Everything**
   - Use CI/CD for checks
   - Set up automated alerts
   - Generate reports automatically

3. **Regular Reviews**
   - Weekly metric reviews
   - Monthly deep dives
   - Quarterly strategic reviews

4. **Act on Data**
   - Investigate anomalies
   - Address issues promptly
   - Communicate findings

5. **Document Incidents**
   - Log all issues
   - Conduct post-mortems
   - Update runbooks

## Related Documentation

- [Maintenance Schedule](maintenance-schedule.md)
- [Performance Guidelines](performance.md)
- [Publishing Checklist](publishing-checklist.md)
- [Security Policy](../governance/security.md)

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
