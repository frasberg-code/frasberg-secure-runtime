import { MultiRegionSovereignMeshOptimizer, MeshOptimizationDecision, RegionMeshState } from "./MultiRegionSovereignMeshOptimizer";
import { Logger, getLogger } from "../../core/governance/logger";

export interface MeshOptimizerWiringContext {
  optimizer: MultiRegionSovereignMeshOptimizer;
  kernel: {
    optimizeMesh?: (states: RegionMeshState[]) => MeshOptimizationDecision[];
    collectRegionStates?: () => RegionMeshState[];
  };
  telemetryBus: (event: any) => void;
  governance: {
    emit: (event: any) => void;
  };
}

export class MeshOptimizerWiring {
  private logger: Logger;

  constructor(private readonly ctx: MeshOptimizerWiringContext) {
    this.logger = getLogger("MeshOptimizerWiring");
  }

  wire() {
    this.logger.info("Wiring Mesh Optimizer into kernel");

    // Attach optimizer method to kernel
    this.ctx.kernel.optimizeMesh = (regionStates: RegionMeshState[]) => {
      this.logger.info("Running mesh optimization", { regionCount: regionStates.length });

      const decisions = this.ctx.optimizer.optimize(regionStates);

      // Emit telemetry for each optimization decision
      for (const decision of decisions) {
        this.ctx.telemetryBus({
          id: `mesh_opt_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "MESH",
          eventType: "OPTIMIZATION_DECISION",
          details: {
            fromRegion: decision.fromRegionId,
            toRegion: decision.toRegionId,
            workloadsToMove: decision.workloadsToMove,
            reason: decision.reason,
            confidence: decision.confidenceScore,
            improvement: decision.estimatedLatencyImprovement,
          },
        });

        // Emit governance event for mesh rebalance proposal
        this.ctx.governance.emit({
          type: "mesh_rebalance_proposed",
          details: decision,
        });
      }

      this.logger.info("Mesh optimization complete", { decisionsGenerated: decisions.length });

      return decisions;
    };

    this.logger.info("Mesh Optimizer wiring complete");
    return this.ctx.kernel;
  }
}

export function wireMeshOptimizer(ctx: MeshOptimizerWiringContext) {
  const wiring = new MeshOptimizerWiring(ctx);
  return wiring.wire();
}
