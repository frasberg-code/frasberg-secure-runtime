import {
  ConstitutionalDashboardState,
  DashboardSafetyEnvelopeView,
  DashboardModeView,
  DashboardSovereignStatsView,
  DashboardCorridorHealthView,
  DashboardMetricsView,
  KernelMode,
} from "./ConstitutionalDashboardTypes";
import { SieInsight, SieRecommendation } from "../sie/SovereignIntelligenceEngine";
import { Logger, getLogger } from "../../core/governance/logger";

export interface DashboardServiceContext {
  kernel: {
    safetySnapshotProvider: () => any;
    modeManager: {
      getMode: () => KernelMode;
      allowedTransitions: (mode: KernelMode) => KernelMode[];
      lastTransitionTime: string;
    };
    runSIE?: () => { insights: SieInsight[]; recommendations: SieRecommendation[] };
    recentTelemetry?: any[];
  };
  memory: {
    query: (type: string) => any[];
    recent: (type: string, limit: number) => any[];
  };
}

export class ConstitutionalDashboardService {
  private logger: Logger;
  private lastUpdate: number = 0;
  private cachedState: ConstitutionalDashboardState | null = null;
  private readonly CACHE_TTL_MS = 5000;

  constructor(private readonly ctx: DashboardServiceContext) {
    this.logger = getLogger("ConstitutionalDashboardService");
  }

  getState(): ConstitutionalDashboardState {
    const now = Date.now();

    // Return cached state if still valid
    if (this.cachedState && now - this.lastUpdate < this.CACHE_TTL_MS) {
      return this.cachedState;
    }

    const state = this.generateState();
    this.cachedState = state;
    this.lastUpdate = now;

    return state;
  }

  private generateState(): ConstitutionalDashboardState {
    const timestamp = new Date().toISOString();

    // Get safety envelope
    const safetyEnvelope = this.generateSafetyEnvelope();

    // Get kernel mode
    const mode = this.generateModeView();

    // Get sovereign stats
    const sovereignStats = this.generateSovereignStats();

    // Get corridor health
    const corridorHealth = this.generateCorridorHealth();

    // Get metrics
    const metrics = this.generateMetrics();

    // Get SIE insights and recommendations
    const sieOutput = this.ctx.kernel.runSIE?.() ?? { insights: [], recommendations: [] };

    // Calculate system score
    const systemScore = this.calculateSystemScore(
      safetyEnvelope,
      sovereignStats,
      corridorHealth,
      metrics
    );

    const state: ConstitutionalDashboardState = {
      timestamp,
      safetyEnvelope,
      mode,
      sovereignStats,
      corridorHealth,
      metrics,
      insights: sieOutput.insights,
      recommendations: sieOutput.recommendations,
      systemScore,
    };

    this.logger.debug("Generated dashboard state", { systemScore });
    return state;
  }

  private generateSafetyEnvelope(): DashboardSafetyEnvelopeView {
    const envelope = this.ctx.kernel.safetySnapshotProvider();

    const view: DashboardSafetyEnvelopeView = {
      slaOk: envelope?.slaOk ?? true,
      latencyOk: envelope?.latencyOk ?? true,
      complianceOk: envelope?.complianceOk ?? true,
      sovereigntyOk: envelope?.sovereigntyOk ?? true,
      meshOk: envelope?.meshOk ?? true,
      evolutionOk: envelope?.evolutionOk ?? true,
      overallHealthy:
        (envelope?.slaOk ?? true) &&
        (envelope?.latencyOk ?? true) &&
        (envelope?.complianceOk ?? true) &&
        (envelope?.sovereigntyOk ?? true) &&
        (envelope?.meshOk ?? true) &&
        (envelope?.evolutionOk ?? true),
    };

    return view;
  }

  private generateModeView(): DashboardModeView {
    const currentMode = this.ctx.kernel.modeManager.getMode();
    const allowedTransitions = this.ctx.kernel.modeManager.allowedTransitions(currentMode);
    const lastTransitionTime = this.ctx.kernel.modeManager.lastTransitionTime;

    return {
      currentMode,
      allowedTransitions,
      lastTransitionTime,
    };
  }

  private generateSovereignStats(): DashboardSovereignStatsView {
    const residencyViolations = this.ctx.memory.query("SOVEREIGN_VIOLATION").length;
    const corridorViolations = this.ctx.memory
      .query("SOVEREIGN_VIOLATION")
      .filter((v) => v.payload["type"] === "corridor").length;
    const overridesActive = this.ctx.memory.query("OVERRIDE").length;

    const evolutionEvents = this.ctx.memory.query("EVOLUTION_OUTCOME");
    const evolutionBlocksRecent = evolutionEvents.filter(
      (e) => e.payload["blocked"] === true
    ).length;

    const meshEvents = this.ctx.memory.query("TELEMETRY").filter(
      (e) => e.payload["type"] === "MESH"
    );
    const meshImbalancedRegions = meshEvents.filter(
      (e) => (e.payload["imbalanceScore"] as number) > 0.75
    ).length;

    return {
      residencyViolations,
      corridorViolations,
      overridesActive,
      evolutionBlocksRecent,
      meshImbalancedRegions,
    };
  }

  private generateCorridorHealth(): DashboardCorridorHealthView[] {
    const telemetryEvents = this.ctx.memory.recent("TELEMETRY", 500);

    const corridorMap = new Map<string, any>();

    for (const event of telemetryEvents) {
      if (event.payload["corridorId"]) {
        const corridorId = event.payload["corridorId"] as string;
        if (!corridorMap.has(corridorId)) {
          corridorMap.set(corridorId, {
            corridorId,
            name: event.payload["corridorName"] || corridorId,
            healthScore: event.payload["healthScore"] ?? 0.8,
            latencyP95Ms: event.payload["latencyP95Ms"] ?? 0,
            saturation: event.payload["saturation"] ?? 0,
          });
        }
      }
    }

    const corridors = Array.from(corridorMap.values()).map((c) => ({
      ...c,
      status: this.determineCorridorStatus(
        c.healthScore,
        c.latencyP95Ms,
        c.saturation
      ),
    }));

    return corridors;
  }

  private determineCorridorStatus(
    healthScore: number,
    latency: number,
    saturation: number
  ): "healthy" | "degraded" | "critical" | "frozen" {
    if (healthScore < 0.3 || saturation > 0.9) {
      return "frozen";
    }
    if (healthScore < 0.5 || saturation > 0.7) {
      return "critical";
    }
    if (healthScore < 0.7 || saturation > 0.5) {
      return "degraded";
    }
    return "healthy";
  }

  private generateMetrics(): DashboardMetricsView {
    const telemetryEvents = this.ctx.kernel.recentTelemetry || [];

    // Extract or calculate metrics
    let uptimePercent = 99.9;
    let avgLatencyMs = 150;
    let p99LatencyMs = 500;
    let throughputRps = 10000;
    let errorRatePercent = 0.1;

    // If telemetry events available, calculate from them
    if (telemetryEvents.length > 0) {
      const latencies = telemetryEvents
        .filter((e: any) => e.details?.latencyMs)
        .map((e: any) => e.details.latencyMs);

      if (latencies.length > 0) {
        avgLatencyMs = latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length;
        latencies.sort((a: number, b: number) => a - b);
        p99LatencyMs = latencies[Math.floor(latencies.length * 0.99)];
      }

      const errors = telemetryEvents.filter((e: any) => e.details?.error).length;
      errorRatePercent = (errors / telemetryEvents.length) * 100;
    }

    return {
      uptimePercent,
      avgLatencyMs,
      p99LatencyMs,
      throughputRps,
      errorRatePercent,
    };
  }

  private calculateSystemScore(
    safety: DashboardSafetyEnvelopeView,
    stats: DashboardSovereignStatsView,
    corridors: DashboardCorridorHealthView[],
    metrics: DashboardMetricsView
  ): number {
    let score = 100;

    // Deduct for safety issues
    if (!safety.slaOk) score -= 15;
    if (!safety.latencyOk) score -= 10;
    if (!safety.complianceOk) score -= 25;
    if (!safety.sovereigntyOk) score -= 20;
    if (!safety.meshOk) score -= 15;
    if (!safety.evolutionOk) score -= 10;

    // Deduct for violations
    score -= Math.min(stats.residencyViolations * 2, 20);
    score -= Math.min(stats.overridesActive * 1, 15);

    // Deduct for corridor issues
    const unhealthyCorridors = corridors.filter((c) => c.status !== "healthy").length;
    score -= Math.min(unhealthyCorridors * 3, 25);

    // Deduct for metric issues
    if (metrics.errorRatePercent > 1) {
      score -= Math.min(metrics.errorRatePercent * 2, 15);
    }
    if (metrics.uptimePercent < 99) {
      score -= Math.min((100 - metrics.uptimePercent) * 2, 20);
    }

    return Math.max(0, Math.min(100, score));
  }

  invalidateCache(): void {
    this.cachedState = null;
    this.lastUpdate = 0;
    this.logger.debug("Dashboard cache invalidated");
  }
}
