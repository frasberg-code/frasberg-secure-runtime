import { CLICommand, CLIContext } from "./GovernanceCLI";
import { OutputFormatter, printOutput } from "./OutputFormatter";
import { Logger, getLogger } from "../governance/logger";

const logger = getLogger("InsightCommands");

// SIE Insight Commands
export class ListInsightsCommand implements CLICommand {
  name = "insights list";
  description = "Show recent SIE insights";

  help(): string {
    return `
Usage: frasberg insights list [options]

Options:
  --critical       Show critical insights only
  --category <cat> Filter by category (SOVEREIGN_RISK, COMPLIANCE_RISK, MESH_RISK, etc.)
  --severity <sev> Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
  --limit <n>      Limit results (default: 20)
  --json           Output in JSON format
  --yaml           Output in YAML format
  --help, -h       Show this help
    `;
  }

  async execute(args: string[], context: CLIContext): Promise<void> {
    const showCritical = args.includes("--critical");
    const categoryIndex = args.indexOf("--category");
    const category = categoryIndex >= 0 ? args[categoryIndex + 1] : undefined;
    const severityIndex = args.indexOf("--severity");
    const severity = severityIndex >= 0 ? args[severityIndex + 1] : undefined;
    const limitIndex = args.indexOf("--limit");
    const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : 20;

    // Mock SIE insights
    let insights = [
      {
        id: "sie_override_1234567890",
        timestamp: new Date().toISOString(),
        category: "OVERRIDE_PRESSURE",
        severity: "HIGH",
        message: "High override pressure detected. Constitutional enforcement is weak.",
        details: { overrideCount: 25 },
      },
      {
        id: "sie_mesh_1234567891",
        timestamp: new Date().toISOString(),
        category: "MESH_RISK",
        severity: "MEDIUM",
        message: "Mesh imbalance detected in 3 regions. Load distribution degraded.",
        details: { imbalancedRegions: 3 },
      },
    ];

    if (showCritical) {
      insights = insights.filter((i) => i.severity === "CRITICAL");
    }

    if (category) {
      insights = insights.filter((i) => i.category === category);
    }

    if (severity) {
      insights = insights.filter((i) => i.severity === severity);
    }

    insights = insights.slice(0, limit);

    if (context.format === "table") {
      const table = OutputFormatter.formatTable(
        ["ID", "Category", "Severity", "Message"],
        insights.map((i) => [
          i.id.substring(0, 20),
          i.category,
          i.severity,
          i.message.substring(0, 40),
        ])
      );
      console.log(table);
    } else {
      printOutput(insights, context.format);
    }
  }
}

export class ShowCriticalInsightsCommand implements CLICommand {
  name = "insights critical";
  description = "Show critical SIE insights only";

  help(): string {
    return `
Usage: frasberg insights critical [options]

Options:
  --json           Output in JSON format
  --yaml           Output in YAML format
  --help, -h       Show this help
    `;
  }

  async execute(args: string[], context: CLIContext): Promise<void> {
    // Mock critical insights
    const criticalInsights = [
      {
        id: "sie_compliance_1234567890",
        timestamp: new Date().toISOString(),
        category: "COMPLIANCE_RISK",
        severity: "CRITICAL",
        message: "Compliance requirements not met. Immediate intervention required.",
        details: { complianceOk: false },
      },
    ];

    console.log(`\n⚠️  ${criticalInsights.length} CRITICAL INSIGHT(S) DETECTED\n`);

    if (context.format === "table") {
      criticalInsights.forEach((insight, idx) => {
        console.log(`${idx + 1}. ${insight.message}`);
        console.log(`   Category: ${insight.category}`);
        console.log(`   ID: ${insight.id}\n`);
      });
    } else {
      printOutput(criticalInsights, context.format);
    }
  }
}

export class ListRecommendationsCommand implements CLICommand {
  name = "recommendations list";
  description = "Show recent SIE recommendations";

  help(): string {
    return `
Usage: frasberg recommendations list [options]

Options:
  --kind <kind>    Filter by kind (TIGHTEN_RESIDENCY, FREEZE_CORRIDORS, etc.)
  --limit <n>      Limit results (default: 20)
  --json           Output in JSON format
  --yaml           Output in YAML format
  --help, -h       Show this help
    `;
  }

  async execute(args: string[], context: CLIContext): Promise<void> {
    const kindIndex = args.indexOf("--kind");
    const kind = kindIndex >= 0 ? args[kindIndex + 1] : undefined;
    const limitIndex = args.indexOf("--limit");
    const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1], 10) : 20;

    // Mock recommendations
    let recommendations = [
      {
        id: "rec_reduce_overrides_1234567890",
        timestamp: new Date().toISOString(),
        kind: "REDUCE_OVERRIDES",
        rationale: "Frequent overrides indicate constitutional misalignment.",
        suggestedChanges: { overrideMaxDurationHours: 1 },
      },
      {
        id: "rec_raise_health_1234567891",
        timestamp: new Date().toISOString(),
        kind: "RAISE_HEALTH_THRESHOLD",
        rationale: "Mesh imbalance suggests corridors need stricter health thresholds.",
        suggestedChanges: { routingHealthMinimumScore: 0.6 },
      },
    ];

    if (kind) {
      recommendations = recommendations.filter((r) => r.kind === kind);
    }

    recommendations = recommendations.slice(0, limit);

    if (context.format === "table") {
      const table = OutputFormatter.formatTable(
        ["ID", "Kind", "Rationale"],
        recommendations.map((r) => [r.id.substring(0, 20), r.kind, r.rationale.substring(0, 40)])
      );
      console.log(table);
    } else {
      printOutput(recommendations, context.format);
    }
  }
}

// Dashboard Commands
export class ViewDashboardCommand implements CLICommand {
  name = "dashboard view";
  description = "Show dashboard summary";

  help(): string {
    return `
Usage: frasberg dashboard view [options]

Options:
  --json           Output in JSON format
  --yaml           Output in YAML format
  --help, -h       Show this help
    `;
  }

  async execute(args: string[], context: CLIContext): Promise<void> {
    // Mock dashboard
    const dashboard = {
      timestamp: new Date().toISOString(),
      systemScore: 85,
      status: "healthy",
      safetyEnvelope: {
        slaOk: true,
        latencyOk: true,
        complianceOk: true,
        sovereigntyOk: true,
        meshOk: true,
        evolutionOk: true,
      },
      mode: "steady_state",
      sovereignStats: {
        residencyViolations: 0,
        corridorViolations: 0,
        overridesActive: 2,
        evolutionBlocksRecent: 0,
        meshImbalancedRegions: 0,
      },
      metrics: {
        uptimePercent: 99.9,
        avgLatencyMs: 145,
        p99LatencyMs: 480,
        throughputRps: 12500,
        errorRatePercent: 0.05,
      },
    };

    if (context.format === "table") {
      console.log(`
System Score: ${dashboard.systemScore}/100 [${dashboard.status.toUpperCase()}]

Safety Envelope:
  SLA: ${dashboard.safetyEnvelope.slaOk ? "✓" : "✗"}  Latency: ${dashboard.safetyEnvelope.latencyOk ? "✓" : "✗"}  Compliance: ${dashboard.safetyEnvelope.complianceOk ? "✓" : "✗"}
  Sovereignty: ${dashboard.safetyEnvelope.sovereigntyOk ? "✓" : "✗"}  Mesh: ${dashboard.safetyEnvelope.meshOk ? "✓" : "✗"}  Evolution: ${dashboard.safetyEnvelope.evolutionOk ? "✓" : "✗"}

Kernel Mode: ${dashboard.mode}

Sovereign Stats:
  Residency Violations: ${dashboard.sovereignStats.residencyViolations}
  Overrides Active: ${dashboard.sovereignStats.overridesActive}
  Mesh Imbalanced Regions: ${dashboard.sovereignStats.meshImbalancedRegions}

Performance:
  Uptime: ${dashboard.metrics.uptimePercent}%
  Avg Latency: ${dashboard.metrics.avgLatencyMs}ms
  P99 Latency: ${dashboard.metrics.p99LatencyMs}ms
  Throughput: ${dashboard.metrics.throughputRps} RPS
  Error Rate: ${dashboard.metrics.errorRatePercent}%
      `);
    } else {
      printOutput(dashboard, context.format);
    }
  }
}

export class ShowSystemScoreCommand implements CLICommand {
  name = "dashboard score";
  description = "Show system health score";

  help(): string {
    return `
Usage: frasberg dashboard score

Shows the overall system health score (0-100).
    `;
  }

  async execute(args: string[], context: CLIContext): Promise<void> {
    const score = 85;
    const status =
      score >= 80 ? "healthy" : score >= 60 ? "degraded" : "critical";

    console.log(`
System Score: ${score}/100 [${status.toUpperCase()}]

Status Breakdown:
  ${score >= 80 ? "✓ Healthy" : score >= 60 ? "⚠ Degraded" : "✗ Critical"}
    `);
  }
}

export class ShowCorridorHealthCommand implements CLICommand {
  name = "dashboard health";
  description = "Show corridor health information";

  help(): string {
    return `
Usage: frasberg dashboard health [options]

Options:
  --json           Output in JSON format
  --yaml           Output in YAML format
  --help, -h       Show this help
    `;
  }

  async execute(args: string[], context: CLIContext): Promise<void> {
    // Mock corridor health
    const corridors = [
      {
        corridorId: "us-east::us-west",
        name: "US East to US West",
        healthScore: 0.95,
        latencyP95Ms: 150,
        status: "healthy",
        saturation: 0.45,
      },
      {
        corridorId: "eu-central::apac",
        name: "EU Central to APAC",
        healthScore: 0.72,
        latencyP95Ms: 350,
        status: "degraded",
        saturation: 0.65,
      },
    ];

    if (context.format === "table") {
      const table = OutputFormatter.formatTable(
        ["Corridor", "Health", "Latency", "Status", "Saturation"],
        corridors.map((c) => [
          c.name,
          c.healthScore.toFixed(2),
          `${c.latencyP95Ms}ms`,
          c.status,
          `${(c.saturation * 100).toFixed(0)}%`,
        ])
      );
      console.log(table);
    } else {
      printOutput(corridors, context.format);
    }
  }
}
