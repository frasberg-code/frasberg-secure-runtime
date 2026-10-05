import { Logger, getLogger } from "../../core/governance/logger";

export interface SieInputSnapshot {
  safetyEnvelope: SafetyEnvelopeSnapshot;
  telemetryEvents: SovereignTelemetryEvent[];
  memorySnapshot: MemoryRecord[];
}

export interface SafetyEnvelopeSnapshot {
  slaOk: boolean;
  latencyOk: boolean;
  complianceOk: boolean;
  sovereigntyOk: boolean;
  meshOk: boolean;
  evolutionOk: boolean;
}

export interface SovereignTelemetryEvent {
  id: string;
  timestamp: string;
  type: string;
  eventType: string;
  details: Record<string, unknown>;
}

export interface MemoryRecord {
  id: string;
  timestamp: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface SieInsight {
  id: string;
  timestamp: string;
  category:
    | "SOVEREIGN_RISK"
    | "COMPLIANCE_RISK"
    | "MESH_RISK"
    | "EVOLUTION_RISK"
    | "HEALTH_RISK"
    | "OVERRIDE_PRESSURE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  details: Record<string, unknown>;
}

export interface SieRecommendation {
  id: string;
  timestamp: string;
  kind:
    | "TIGHTEN_RESIDENCY"
    | "FREEZE_CORRIDORS"
    | "LIMIT_EVOLUTION"
    | "RAISE_HEALTH_THRESHOLD"
    | "REDUCE_OVERRIDES"
    | "DOWNGRADE_MODE";
  rationale: string;
  suggestedChanges: Record<string, unknown>;
}

export interface SieOutput {
  insights: SieInsight[];
  recommendations: SieRecommendation[];
}

export class SovereignIntelligenceEngine {
  private logger: Logger;

  constructor() {
    this.logger = getLogger("SovereignIntelligenceEngine");
  }

  analyze(input: SieInputSnapshot): SieOutput {
    const insights: SieInsight[] = [];
    const recommendations: SieRecommendation[] = [];
    const now = new Date().toISOString();

    // Risk 1: Sovereign envelope degradation
    if (!input.safetyEnvelope.sovereigntyOk) {
      insights.push({
        id: `sie_sovereign_${Date.now()}`,
        timestamp: now,
        category: "SOVEREIGN_RISK",
        severity: "HIGH",
        message: "Sovereignty envelope is degraded. Residency constraints may be violated.",
        details: { sovereigntyOk: false },
      });

      recommendations.push({
        id: `rec_tighten_residency_${Date.now()}`,
        timestamp: now,
        kind: "TIGHTEN_RESIDENCY",
        rationale: "Sovereignty envelope degraded; residency rules must be tightened.",
        suggestedChanges: { residencyLocked: true },
      });
    }

    // Risk 2: Compliance violations
    if (!input.safetyEnvelope.complianceOk) {
      insights.push({
        id: `sie_compliance_${Date.now()}`,
        timestamp: now,
        category: "COMPLIANCE_RISK",
        severity: "CRITICAL",
        message: "Compliance requirements not met. Immediate intervention required.",
        details: { complianceOk: false },
      });

      recommendations.push({
        id: `rec_downgrade_mode_${Date.now()}`,
        timestamp: now,
        kind: "DOWNGRADE_MODE",
        rationale: "Compliance failure detected; system must revert to steady-state mode.",
        suggestedChanges: { targetMode: "steady_state" },
      });
    }

    // Risk 3: Override pressure
    const overrideEvents = input.memorySnapshot.filter(
      (m) => m.type === "OVERRIDE"
    );
    const criticalOverridePressure = overrideEvents.length > 30;
    const highOverridePressure = overrideEvents.length > 20;

    if (criticalOverridePressure) {
      insights.push({
        id: `sie_override_critical_${Date.now()}`,
        timestamp: now,
        category: "OVERRIDE_PRESSURE",
        severity: "CRITICAL",
        message: "Critical override pressure detected. Constitutional misalignment is severe.",
        details: { overrideCount: overrideEvents.length, threshold: 30 },
      });
    } else if (highOverridePressure) {
      insights.push({
        id: `sie_override_high_${Date.now()}`,
        timestamp: now,
        category: "OVERRIDE_PRESSURE",
        severity: "HIGH",
        message: "High override pressure detected. Constitutional enforcement is weak.",
        details: { overrideCount: overrideEvents.length, threshold: 20 },
      });

      recommendations.push({
        id: `rec_reduce_overrides_${Date.now()}`,
        timestamp: now,
        kind: "REDUCE_OVERRIDES",
        rationale: "Frequent overrides indicate constitutional misalignment.",
        suggestedChanges: { overrideMaxDurationHours: 1, overrideReviewRequired: true },
      });
    }

    // Risk 4: Mesh imbalance
    const meshEvents = input.telemetryEvents.filter((e) => e.type === "MESH");
    const meshImbalances = meshEvents
      .filter((e) => (e.details["imbalanceScore"] as number) > 0.75)
      .length;

    if (meshImbalances > 0) {
      const severity = meshImbalances > 5 ? "HIGH" : "MEDIUM";

      insights.push({
        id: `sie_mesh_${Date.now()}`,
        timestamp: now,
        category: "MESH_RISK",
        severity,
        message: `Mesh imbalance detected in ${meshImbalances} regions. Load distribution degraded.`,
        details: { imbalancedRegions: meshImbalances, totalMeshEvents: meshEvents.length },
      });

      if (severity === "HIGH") {
        recommendations.push({
          id: `rec_raise_health_${Date.now()}`,
          timestamp: now,
          kind: "RAISE_HEALTH_THRESHOLD",
          rationale: "Mesh imbalance suggests corridors need stricter health thresholds.",
          suggestedChanges: { routingHealthMinimumScore: 0.6 },
        });
      }
    }

    // Risk 5: Evolution blocks
    const evolutionEvents = input.memorySnapshot.filter(
      (m) => m.type === "EVOLUTION_OUTCOME"
    );
    const blockedEvolution = evolutionEvents.filter(
      (e) => (e.payload["blocked"] as boolean) === true
    ).length;

    if (blockedEvolution > 5) {
      insights.push({
        id: `sie_evolution_${Date.now()}`,
        timestamp: now,
        category: "EVOLUTION_RISK",
        severity: "MEDIUM",
        message: "Evolution plans are frequently blocked. System may be over-constrained.",
        details: { blockedCount: blockedEvolution, totalEvolutionAttempts: evolutionEvents.length },
      });

      recommendations.push({
        id: `rec_limit_evolution_${Date.now()}`,
        timestamp: now,
        kind: "LIMIT_EVOLUTION",
        rationale: "Evolution blocks indicate constitutional constraints are too strict.",
        suggestedChanges: { evolutionPhaseEnabled: false, evolutionReviewCycle: "weekly" },
      });
    }

    // Risk 6: Corridor health degradation
    const corridorHealthEvents = input.telemetryEvents.filter(
      (e) => e.type === "CORRIDOR_HEALTH"
    );
    const unhealthyCorridors = corridorHealthEvents.filter(
      (e) => (e.details["healthScore"] as number) < 0.3
    ).length;

    if (unhealthyCorridors > 0) {
      insights.push({
        id: `sie_corridor_health_${Date.now()}`,
        timestamp: now,
        category: "HEALTH_RISK",
        severity: unhealthyCorridors > 3 ? "HIGH" : "MEDIUM",
        message: `${unhealthyCorridors} corridor(s) have critically low health scores.`,
        details: { unhealthyCorridors, totalCorridors: corridorHealthEvents.length },
      });

      if (unhealthyCorridors > 3) {
        recommendations.push({
          id: `rec_freeze_corridors_${Date.now()}`,
          timestamp: now,
          kind: "FREEZE_CORRIDORS",
          rationale: "Multiple corridors are unhealthy; routing must be restricted.",
          suggestedChanges: { corridorsToFreeze: "all_below_0.3_health" },
        });
      }
    }

    // Risk 7: SLA violation trends
    const slaViolations = input.memorySnapshot.filter(
      (m) => m.type === "TELEMETRY" && (m.payload["dimension"] as string) === "SLA"
    ).length;

    if (!input.safetyEnvelope.slaOk && slaViolations > 10) {
      insights.push({
        id: `sie_sla_${Date.now()}`,
        timestamp: now,
        category: "HEALTH_RISK",
        severity: "HIGH",
        message: "SLA violations are increasing. System performance is degrading.",
        details: { slaViolationCount: slaViolations },
      });
    }

    // Risk 8: Latency creep
    if (!input.safetyEnvelope.latencyOk) {
      insights.push({
        id: `sie_latency_${Date.now()}`,
        timestamp: now,
        category: "HEALTH_RISK",
        severity: "MEDIUM",
        message: "Latency envelope exceeded. Response times are outside acceptable bounds.",
        details: { latencyOk: false },
      });
    }

    this.logger.info("SIE analysis complete", {
      insightCount: insights.length,
      recommendationCount: recommendations.length,
      criticalInsights: insights.filter((i) => i.severity === "CRITICAL").length,
    });

    return { insights, recommendations };
  }

  private calculateRiskScore(
    sovereigntyFails: number,
    overridePressure: number,
    meshImbalance: number,
    evolutionBlocks: number,
    healthIssues: number
  ): number {
    return (
      sovereigntyFails * 0.25 +
      overridePressure * 0.25 +
      meshImbalance * 0.2 +
      evolutionBlocks * 0.15 +
      healthIssues * 0.15
    );
  }
}
