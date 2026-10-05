# Frasberg Governance CLI

Complete command-line interface for sovereign authorities to interact with the constitutional control plane.

## Installation

```bash
npm install -g frasberg-governance-cli
```

Or use directly:

```bash
npx frasberg-governance-cli [command]
```

## Usage

```bash
frasberg [global-options] <command> [command-options]
```

### Global Options

- `--verbose, -v` - Show verbose output including debug information
- `--json` - Output in JSON format
- `--yaml` - Output in YAML format
- `--help, -h` - Show help message

## Constitutional Management

### View Current Constitution

```bash
frasberg gov constitution view [options]
```

Options:
- `--full` - Show full constitution details
- `--amendments` - Show pending amendments

Example:
```bash
frasberg gov constitution view --full --json
```

### Propose Constitutional Amendment

```bash
frasberg gov constitution propose-amendment <description> [options]
```

### Approve Amendment

```bash
frasberg gov constitution approve-amendment <amendment-id>
```

### Reject Amendment

```bash
frasberg gov constitution reject-amendment <amendment-id>
```

### View Amendment History

```bash
frasberg gov constitution history [options]
```

Options:
- `--limit <n>` - Limit results (default: 50)
- `--since <date>` - Show amendments since date (ISO-8601)

## Kernel Mode Management

### Get Current Mode

```bash
frasberg gov kernel mode current
```

Output:
```json
{
  "current": "steady_state",
  "availableModes": ["steady_state", "self_governing", "evolution", "federation"],
  "lastTransition": "2026-07-17T10:00:00Z"
}
```

### Transition to New Mode

```bash
frasberg gov kernel mode transition <mode>
```

Valid modes:
- `steady_state` - Normal operation
- `self_governing` - Autonomous governance enabled
- `evolution` - Evolution mode enabled
- `federation` - Federation mode enabled

Example:
```bash
frasberg gov kernel mode transition evolution
```

### View Mode History

```bash
frasberg gov kernel mode history [options]
```

## Corridor Management

### List All Corridors

```bash
frasberg gov corridor list [options]
```

Options:
- `--status <status>` - Filter by status (healthy, degraded, frozen, critical)

Output:
```
┌────────────────┬──────────────────────────┬──────────┬────────┬────────┐
│ ID             │ Name                     │ Status   │ Health │ Frozen │
├────────────────┼──────────────────────────┼──────────┼────────┼────────┤
│ corridor-1     │ US-EAST to EU-CENTRAL    │ healthy  │ 0.98   │ false  │
│ corridor-2     │ EU-CENTRAL to APAC       │ degraded │ 0.72   │ false  │
└────────────────┴──────────────────────────┴──────────┴────────┴────────┘
```

### Get Corridor Health

```bash
frasberg gov corridor health <corridor-id>
```

### Freeze Corridor

```bash
frasberg gov corridor freeze <corridor-id> [reason]
```

Example:
```bash
frasberg gov corridor freeze corridor-1 "Maintenance window"
```

### Unfreeze Corridor

```bash
frasberg gov corridor unfreeze <corridor-id>
```

### Restore Corridor

```bash
frasberg gov corridor restore <corridor-id>
```

## Override Management

### Issue Sovereign Override

```bash
frasberg gov override issue <type> <reason>
```

Override Types:
- `evolution_pause` - Pause evolution operations
- `federation_pause` - Pause federation operations
- `corridor_freeze` - Freeze all corridors
- `safety_escalation` - Escalate safety mode

Example:
```bash
frasberg gov override issue evolution_pause "Safety threshold exceeded"
```

### List Active Overrides

```bash
frasberg gov override list [options]
```

Options:
- `--status <status>` - Filter (active, revoked, expired)

### Revoke Override

```bash
frasberg gov override revoke <override-id>
```

### View Override Audit Trail

```bash
frasberg gov override audit [options]
```

## Simulation & Query

### Query System Telemetry

```bash
frasberg gov query telemetry [options]
```

Options:
- `--dimension <dim>` - Filter by dimension (SLA, LATENCY, COMPLIANCE, SOVEREIGNTY, MESH)
- `--limit <n>` - Limit results

Example:
```bash
frasberg gov query telemetry --dimension SLA --json
```

### Query Sovereignty Violations

```bash
frasberg gov query violations [options]
```

Options:
- `--limit <n>` - Limit results (default: 50)
- `--since <date>` - Since date (ISO-8601)

### View Proposed Amendments

```bash
frasberg gov query amendments [options]
```

### Simulate Constitution Change

```bash
frasberg gov simulate constitution-change <amendment-id>
```

Returns:
```json
{
  "amendmentId": "amend-123",
  "simulation": {
    "status": "safe",
    "impacts": {
      "operationsAffected": 2,
      "performanceChange": -0.5
    },
    "recommendation": "Safe to apply"
  }
}
```

### Simulate Corridor Freeze

```bash
frasberg gov simulate corridor-freeze <corridor-id>
```

### Simulate Mode Transition

```bash
frasberg gov simulate mode-transition <target-mode>
```

## Output Formats

### Table Format (Default)

```bash
frasberg gov corridor list
```

### JSON Format

```bash
frasberg gov corridor list --json
```

### YAML Format

```bash
frasberg gov corridor list --yaml
```

## Configuration

Set environment variables:

```bash
export GOVERNANCE_API_URL=https://governance-api.example.com
export FRASBERG_CLI_VERBOSE=true
```

Or create `~/.frasberg/config.yaml`:

```yaml
api:
  url: https://governance-api.example.com
  timeout: 30000
output:
  format: json
  verbose: true
auth:
  type: jwt
  token: eyJhbGc...
```

## Examples

### Check System Health

```bash
frasberg gov query telemetry --json | jq '.SLA'
```

### Propose and Simulate Amendment

```bash
# Simulate change
frasberg gov simulate constitution-change amend-123

# If safe, approve it
frasberg gov constitution approve-amendment amend-123
```

### Emergency Override

```bash
frasberg gov override issue evolution_pause "Critical alert: CPU usage at 95%"
```

### Monitor Corridors

```bash
frasberg gov corridor list --status degraded --json
```

### Kernel Mode Transition

```bash
# Transition to evolution mode
frasberg gov kernel mode transition evolution

# Check new mode
frasberg gov kernel mode current
```

## Authentication

The CLI supports multiple authentication methods:

### Token-based (Default)

```bash
export FRASBERG_TOKEN=your-jwt-token
frasberg gov constitution view
```

### OAuth2

```bash
frasberg gov auth login
```

### API Key

```bash
export FRASBERG_API_KEY=your-api-key
frasberg gov constitution view
```

## Troubleshooting

### Enable Debug Mode

```bash
frasberg --verbose gov constitution view
```

### Check Configuration

```bash
frasberg config show
```

### Reset Configuration

```bash
frasberg config reset
```

## Contributing

To add new commands, implement the `CLICommand` interface:

```typescript
export class MyCommand implements CLICommand {
  name = "my command name";
  description = "Command description";

  help(): string {
    return "Usage help text";
  }

  async execute(args: string[], context: CLIContext): Promise<void> {
    // Implementation
  }
}
```

Register in `src/cli/governance/index.ts`:

```typescript
cli.registerCommand("my command name", new MyCommand());
```

## License

Proprietary - Frasberg AI
