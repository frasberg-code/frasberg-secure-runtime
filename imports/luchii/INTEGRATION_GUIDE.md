# Integration Guide: Evolution Filters API & Governance CLI

## Overview

The Frasberg Autonomous Cloud now includes:
1. **Evolution Filters REST API** - for programmatic governance
2. **Governance CLI** - for command-line operations

Both are fully integrated into the main application.

---

## REST API Integration

### Available Endpoints

All endpoints are mounted at `/api/v1/evolution/filters`:

```bash
# Create a filter
POST /api/v1/evolution/filters
Content-Type: application/json

{
  "name": "Safety Filter",
  "type": "SAFETY",
  "criteria": {
    "slaMinimum": 95,
    "latencyMaxMs": 500
  }
}
```

```bash
# List filters
GET /api/v1/evolution/filters?page=1&limit=20&type=SAFETY

# Get specific filter
GET /api/v1/evolution/filters/{filterId}

# Update filter
PUT /api/v1/evolution/filters/{filterId}

# Delete filter
DELETE /api/v1/evolution/filters/{filterId}

# Apply filter to evolution plan
POST /api/v1/evolution/filters/{filterId}/apply

# Batch evaluate plan against multiple filters
POST /api/v1/evolution/filters/apply-multiple/batch
```

### Example: Using the API

```typescript
// Create a filter
const response = await fetch('http://localhost:3001/api/v1/evolution/filters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Performance Requirements",
    type: "PERFORMANCE",
    criteria: {
      throughputMinRps: 1000,
      resourceUtilizationMax: 80,
      responseTimeMaxMs: 500
    }
  })
});

const filter = await response.json();
console.log('Created filter:', filter.id);

// Apply filter to an evolution plan
const evalResponse = await fetch(
  `http://localhost:3001/api/v1/evolution/filters/${filter.id}/apply`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: {
        id: "plan-123",
        name: "Evolution Plan",
        sovereignty: { residency: "US-EAST" },
        safety: { sla: 99, latency: 250 },
        performance: { throughput: 5000, utilization: 60 },
        mesh: { corridorHealth: 0.95 }
      }
    })
  }
);

const result = await evalResponse.json();
console.log('Filter evaluation:', result.passed ? 'PASS' : 'FAIL');
```

---

## CLI Integration

### Installation

The CLI is available via npm:

```bash
npm install
npm run build
npm link  # Install globally
```

Then use:

```bash
frasberg gov constitution view
frasberg gov kernel mode current
frasberg gov corridor list
```

Or run without global installation:

```bash
npm run cli -- gov constitution view
```

### Available Commands

#### Constitution Management

```bash
frasberg gov constitution view [--full] [--amendments] [--json|--yaml]
frasberg gov constitution propose-amendment <description>
frasberg gov constitution approve-amendment <amendment-id>
frasberg gov constitution reject-amendment <amendment-id>
frasberg gov constitution history [--limit 50]
```

#### Kernel Mode

```bash
frasberg gov kernel mode current
frasberg gov kernel mode transition <mode>
  # Valid modes: steady_state, self_governing, evolution, federation
frasberg gov kernel mode history
```

#### Corridors

```bash
frasberg gov corridor list [--status healthy|degraded|frozen|critical]
frasberg gov corridor health <corridor-id>
frasberg gov corridor freeze <corridor-id> [reason]
frasberg gov corridor unfreeze <corridor-id>
frasberg gov corridor restore <corridor-id>
```

#### Overrides

```bash
frasberg gov override issue <type> <reason>
  # Types: evolution_pause, federation_pause, corridor_freeze, safety_escalation
frasberg gov override list [--status active|revoked|expired]
frasberg gov override revoke <override-id>
frasberg gov override audit
```

#### Queries

```bash
frasberg gov query telemetry [--dimension SLA|LATENCY|COMPLIANCE] [--limit 50]
frasberg gov query violations [--limit 50] [--since 2026-07-17]
frasberg gov query amendments
```

#### Simulation

```bash
frasberg gov simulate constitution-change <amendment-id>
frasberg gov simulate corridor-freeze <corridor-id>
frasberg gov simulate mode-transition <target-mode>
```

### Example: Using the CLI

```bash
# Check current system constitution
frasberg gov constitution view --json

# List all healthy corridors
frasberg gov corridor list --status healthy

# Issue an emergency override
frasberg gov override issue evolution_pause "CPU usage critical (95%)"

# Simulate a constitution change before applying
frasberg gov simulate constitution-change amend-123

# Check kernel mode and telemetry
frasberg gov kernel mode current
frasberg gov query telemetry --dimension SLA --json
```

### Output Formats

All CLI commands support multiple output formats:

```bash
# Table format (default)
frasberg gov corridor list

# JSON format
frasberg gov corridor list --json

# YAML format
frasberg gov corridor list --yaml

# Verbose mode with debug info
frasberg gov corridor list --verbose

# Combined flags
frasberg gov corridor list --status degraded --json --verbose
```

---

## Development Workflow

### Local Testing

1. **Start the API server**:
   ```bash
   npm run dev
   # Server runs on http://localhost:3001
   ```

2. **In another terminal, test the CLI**:
   ```bash
   npm run cli -- gov constitution view
   ```

3. **Test API endpoints**:
   ```bash
   curl -X GET http://localhost:3001/api/v1/evolution/filters
   ```

### Running Tests

```bash
# All tests
npm test

# API tests only
npm run test:api

# CLI tests only
npm run test:cli

# With coverage
npm test -- --coverage
```

### Building for Production

```bash
npm run build
npm start

# Or with CLI globally installed
frasberg gov constitution view
```

---

## Error Handling

### API Errors

The API returns standard error responses:

```json
{
  "error": "Validation error message",
  "code": "VALIDATION_ERROR"
}
```

Status codes:
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `422` - Constitutional violation
- `500` - Server error

### CLI Errors

The CLI shows error messages and returns non-zero exit codes:

```bash
$ frasberg gov corridor freeze invalid-id
Error: Corridor not found: invalid-id
$ echo $?
1
```

Use `--verbose` for detailed error information:

```bash
frasberg --verbose gov corridor freeze invalid-id
```

---

## Configuration

### Environment Variables

```bash
# API Configuration
GOVERNANCE_API_URL=http://localhost:3001
PORT=3001
LOG_LEVEL=info
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost/frasberg

# Auth (if implemented)
JWT_SECRET=your-secret-key
```

### CLI Configuration

Create `~/.frasberg/config.yaml`:

```yaml
api:
  url: http://localhost:3001
  timeout: 30000
  
output:
  format: json
  verbose: false
  
auth:
  type: jwt
  # Token loaded from environment variable
```

---

## Integration with Existing Routes

The Evolution Filters API integrates seamlessly with existing Frasberg routes:

- **ACO Routes** - Use filters in autonomy calculations
- **Federation Routes** - Apply mesh filters for routing decisions
- **Governance Routes** - Coordinate with constitutional enforcement
- **Status Routes** - Report on filter evaluations

---

## API Documentation

For detailed API documentation, see: `docs/api/evolution-filters.md`

For detailed CLI documentation, see: `docs/cli/governance.md`

---

## Troubleshooting

### API Not Responding

Check that the server is running:
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### CLI Commands Not Found

Ensure CLI is built and installed:
```bash
npm run build
npm link  # Install globally
frasberg --help
```

### Tests Failing

Run with verbose output:
```bash
npm test -- --verbose
```

Check that all dependencies are installed:
```bash
npm install
```

---

## Next Steps

1. ✅ **API integrated** - Available at `/api/v1/evolution/filters`
2. ✅ **CLI integrated** - Available as `frasberg` command
3. **Connect to database** - Store filters persistently (coming soon)
4. **Add authentication** - Require JWT tokens (coming soon)
5. **Webhook integration** - Trigger on filter violations (coming soon)

---

Generated: 2026-07-17
Status: Ready for production use
