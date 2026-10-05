# Quick Start: Evolution Filters & Governance CLI

Get started with the new Evolution Filters API and Governance CLI in 5 minutes.

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Setup

```bash
# Clone the repository
git clone https://github.com/FrasbergAI/luchii.git
cd luchii

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Start the API Server

```bash
# Terminal 1: Start the API
npm run dev

# You'll see:
# 🚀 Frasberg Autonomous Cloud API listening on port 3001
```

Test the API is running:
```bash
curl http://localhost:3001/health
# Response: {"status":"healthy","timestamp":"2026-07-17T..."}
```

## Use the REST API

### 1. Create an Evolution Filter

```bash
curl -X POST http://localhost:3001/api/v1/evolution/filters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Safety Requirements",
    "type": "SAFETY",
    "criteria": {
      "slaMinimum": 95,
      "latencyMaxMs": 500,
      "complianceRequired": true
    }
  }'

# Response includes: {"id": "550e8400-...", "name": "Safety Requirements", ...}
```

### 2. List All Filters

```bash
curl http://localhost:3001/api/v1/evolution/filters?page=1&limit=20

# Response: {"filters": [...], "pagination": {...}}
```

### 3. Get a Specific Filter

```bash
curl http://localhost:3001/api/v1/evolution/filters/{filterId}
```

### 4. Apply Filter to Evolution Plan

```bash
curl -X POST http://localhost:3001/api/v1/evolution/filters/{filterId}/apply \
  -H "Content-Type: application/json" \
  -d '{
    "plan": {
      "id": "plan-123",
      "name": "Evolution Plan",
      "sovereignty": {"residency": "US-EAST"},
      "safety": {"sla": 99, "latency": 250, "compliant": true},
      "performance": {"throughput": 5000, "utilization": 60},
      "mesh": {"corridorHealth": 0.95, "balanced": true}
    }
  }'

# Response: {"filterId": "...", "planId": "plan-123", "passed": true}
```

## Use the Governance CLI

In another terminal:

```bash
# Terminal 2: CLI commands
npm run cli -- gov constitution view

# Or install globally for shorter commands
npm link
frasberg gov constitution view
```

### Common CLI Commands

```bash
# View current constitution
frasberg gov constitution view --json

# Check kernel mode
frasberg gov kernel mode current

# List corridors
frasberg gov corridor list --status healthy

# Check system telemetry
frasberg gov query telemetry --dimension SLA --json

# Issue an override
frasberg gov override issue evolution_pause "Maintenance window"

# Simulate constitution change
frasberg gov simulate constitution-change amend-123
```

## Testing

```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run CLI tests only
npm run test:cli

# Run with coverage
npm test -- --coverage
```

## Common Tasks

### Create Multiple Filters

```bash
# Create a Sovereignty filter
curl -X POST http://localhost:3001/api/v1/evolution/filters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "US Residency Required",
    "type": "SOVEREIGNTY",
    "criteria": {
      "residencyConstraint": "US-EAST"
    }
  }'

# Create a Performance filter
curl -X POST http://localhost:3001/api/v1/evolution/filters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Performance",
    "type": "PERFORMANCE",
    "criteria": {
      "throughputMinRps": 1000,
      "responseTimeMaxMs": 200
    }
  }'
```

### Batch Evaluate Plan Against Multiple Filters

```bash
curl -X POST http://localhost:3001/api/v1/evolution/filters/apply-multiple/batch \
  -H "Content-Type: application/json" \
  -d '{
    "filterIds": ["filter-1", "filter-2", "filter-3"],
    "plan": {
      "id": "plan-123",
      "name": "Test Plan",
      "sovereignty": {},
      "safety": {"sla": 99, "latency": 250},
      "performance": {"throughput": 5000, "utilization": 60},
      "mesh": {"corridorHealth": 0.95}
    }
  }'
```

### View Different Output Formats

```bash
# JSON format
frasberg gov corridor list --json

# YAML format
frasberg gov corridor list --yaml

# Table format (default)
frasberg gov corridor list

# With verbose output
frasberg --verbose gov corridor list
```

## Troubleshooting

### API Port Already in Use

```bash
# Use a different port
PORT=3002 npm run dev
```

### CLI Commands Not Found

```bash
# Rebuild and reinstall
npm run build
npm link
```

### Validation Error

Check your request JSON matches the filter type schema:

```bash
# ❌ Wrong: missing required fields
{
  "name": "Bad Filter",
  "type": "SAFETY"
  # criteria missing!
}

# ✅ Correct: all required fields
{
  "name": "Good Filter",
  "type": "SAFETY",
  "criteria": {
    "slaMinimum": 95,
    "latencyMaxMs": 500
  }
}
```

## Next Steps

1. Read the full [Integration Guide](./INTEGRATION_GUIDE.md)
2. Explore the [API Documentation](./docs/api/evolution-filters.md)
3. Learn about the [Governance CLI](./docs/cli/governance.md)
4. Check out [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## Support

- API Documentation: `docs/api/evolution-filters.md`
- CLI Documentation: `docs/cli/governance.md`
- Test Examples: `tests/api/` and `tests/cli/`
- Integration Tests: `tests/api/integration.test.ts`

Happy governing! 🚀
