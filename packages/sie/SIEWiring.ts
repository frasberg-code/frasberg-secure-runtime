import { SovereignIntelligenceEngine, SieInputSnapshot, SieOutput } from "./SovereignIntelligenceEngine";
import { Logger, getLogger } from "../../core/governance/logger";

export interface SieWiringContext {
  sie: SovereignIntelligenceEngine;
  kernel: {
    safetySnapshotProvider: () => unknown;
    recentTelemetry?: unknown[];
    sie?: SovereignIntelligenceEngine;
    runSIE?: () => SieOutput;
  };
  memory: {
    snapshot: () => unknown[];
  };
  telemetryBus: (event: unknown) => void;
  governance: {
    emit: (event: unknown) => void;
  };
}

export class SIEWiring {
  private logger: Logger;

  constructor(private readonly ctx: SieWiringContext) {
    this.logger = getLogger("SIEWiring");
  }

  wire() {
    this.logger.info("Wiring Sovereign Intelligence Engine into kernel");

    // Attach SIE to kernel
    this.ctx.kernel.sie = this.ctx.sie;

    // Create the SIE analysis function
    this.ctx.kernel.runSIE = () => {
      this.logger.debug("Running SIE analysis cycle");

      const snapshot: SieInputSnapshot = {
        safetyEnvelope: (this.ctx.kernel.safetySnapshotProvider() as any) || {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: (this.ctx.kernel.recentTelemetry as any) || [],
        memorySnapshot: this.ctx.memory.snapshot() as any,
      };

      const output = this.ctx.sie.analyze(snapshot);

      // Emit insights as telemetry events
      for (const insight of output.insights) {
        try {
          this.ctx.telemetryBus({
            id: insight.id,
            timestamp: insight.timestamp,
            type: "AUDIT",
            eventType: "SIE_INSIGHT",
            details: insight,
          });
        } catch (error) {
          this.logger.error("Failed to emit insight", error as Error);
        }
      }

      // Emit recommendations to governance
      for (const rec of output.recommendations) {
        try {
          this.ctx.governance.emit({
            type: "constitutional_recommendation",
            details: rec,
          });
        } catch (error) {
          this.logger.error("Failed to emit recommendation", error as Error);
        }
      }

      this.logger.info("SIE cycle complete", {
        insightsGenerated: output.insights.length,
        recommendationsGenerated: output.recommendations.length,
        criticalInsights: output.insights.filter((i) => i.severity === "CRITICAL").length,
      });

      return output;
    };

    this.logger.info("SIE wiring complete");
    return this.ctx.kernel;
  }
}

export function wireSIE(ctx: SieWiringContext) {
  const wiring = new SIEWiring(ctx);
  return wiring.wire();
}
