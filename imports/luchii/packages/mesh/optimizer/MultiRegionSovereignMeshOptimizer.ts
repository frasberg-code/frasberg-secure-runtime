import { Logger, getLogger } from "../../core/governance/logger";

export interface RegionMeshState {
  regionId: string;
  name: string;
  totalWorkloads: number;
  sovereignZones: string[];
  avgLatencyMs: number;
  avgHealthScore: number;
  saturation: number;
}

export interface MeshOptimizationDecision {
  fromRegionId: string;
  toRegionId: string;
  workloadsToMove: number;
  reason: string;
  confidenceScore: number;
  estimatedLatencyImprovement: number;
}

export interface MeshOptimizerContext {
  corridorGraph: {
    edges: Array<{
      id: string;
      fromRegion: string;
      toRegion: string;
      maxLatencyMs: number;
      health: number;
    }>;
  };
  residencyEngine: {
    canMoveToRegion: (workloads: string[], toRegion: string) => boolean;
  };
  healthEngine: {
    score: (metrics: any) => { score: number };
  };
}

export class MultiRegionSovereignMeshOptimizer {
  private logger: Logger;

  constructor(private readonly ctx: MeshOptimizerContext) {
    this.logger = getLogger("MultiRegionSovereignMeshOptimizer");
  }

  optimize(states: RegionMeshState[]): MeshOptimizationDecision[] {
    this.logger.info("Starting mesh optimization", { regionCount: states.length });

    const decisions: MeshOptimizationDecision[] = [];

    // Find overloaded regions (high latency or high saturation)
    const overloaded = states.filter(
      (s) => s.avgLatencyMs > 400 || s.saturation > 0.8 || s.avgHealthScore < 0.4
    );

    // Find underloaded regions (low latency and low saturation)
    const underloaded = states.filter(
      (s) => s.avgLatencyMs < 250 && s.saturation < 0.5 && s.avgHealthScore > 0.7
    );

    this.logger.debug("Mesh analysis", {
      overloadedRegions: overloaded.length,
      underloadedRegions: underloaded.length,
    });

    // Try to move workloads from overloaded to underloaded regions
    for (const source of overloaded) {
      for (const target of underloaded) {
        if (source.regionId === target.regionId) continue;

        // Check if corridor exists and is healthy
        const corridor = this.findCorridor(source.regionId, target.regionId);
        if (!corridor) continue;

        // Check health threshold
        if (corridor.health < 0.5) {
          this.logger.debug("Corridor health too low", {
            corridor: corridor.id,
            health: corridor.health,
          });
          continue;
        }

        // Check residency constraints
        if (!this.canMoveWorkloads(source, target)) {
          this.logger.debug("Residency constraints prevent move", {
            from: source.regionId,
            to: target.regionId,
          });
          continue;
        }

        // Calculate workloads to move
        const workloadsToMove = this.calculateOptimalWorkloadCount(source, target);
        if (workloadsToMove <= 0) continue;

        // Estimate improvement
        const improvement = source.avgLatencyMs - corridor.maxLatencyMs;

        const decision: MeshOptimizationDecision = {
          fromRegionId: source.regionId,
          toRegionId: target.regionId,
          workloadsToMove,
          reason: this.generateReason(source, target, corridor),
          confidenceScore: this.calculateConfidenceScore(
            source,
            target,
            corridor,
            improvement
          ),
          estimatedLatencyImprovement: Math.max(0, improvement),
        };

        decisions.push(decision);
      }
    }

    // Sort by confidence and impact
    decisions.sort(
      (a, b) =>
        b.confidenceScore - a.confidenceScore ||
        b.estimatedLatencyImprovement - a.estimatedLatencyImprovement
    );

    this.logger.info("Optimization complete", { decisionsGenerated: decisions.length });
    return decisions;
  }

  private findCorridor(fromRegion: string, toRegion: string) {
    return this.ctx.corridorGraph.edges.find(
      (e) => e.fromRegion === fromRegion && e.toRegion === toRegion
    );
  }

  private canMoveWorkloads(source: RegionMeshState, target: RegionMeshState): boolean {
    // Check if target region has sovereignty constraints
    // This is simplified; real implementation would check specific workloads
    if (source.sovereignZones.length > 0 && target.sovereignZones.length === 0) {
      return false;
    }

    // Check if workloads can be moved based on residency rules
    return this.ctx.residencyEngine.canMoveToRegion([], target.regionId);
  }

  private calculateOptimalWorkloadCount(
    source: RegionMeshState,
    target: RegionMeshState
  ): number {
    const sourceUtilization = source.saturation;
    const targetUtilization = target.saturation;

    // Don't move if source is not significantly overloaded
    if (sourceUtilization < 0.7) return 0;

    // Don't move if target is not significantly underutilized
    if (targetUtilization > 0.6) return 0;

    // Move about 10-20% of workloads to balance
    const movePercentage = Math.min(
      0.2,
      (sourceUtilization - 0.5) / 2
    );
    const workloadsToMove = Math.floor(source.totalWorkloads * movePercentage);

    return Math.max(1, workloadsToMove);
  }

  private generateReason(
    source: RegionMeshState,
    target: RegionMeshState,
    corridor: any
  ): string {
    let reason = "Optimize mesh load distribution: ";

    if (source.avgLatencyMs > 400) {
      reason += `reduce source latency (${source.avgLatencyMs}ms to target ${corridor.maxLatencyMs}ms); `;
    }

    if (source.saturation > 0.8) {
      reason += `reduce source saturation (${(source.saturation * 100).toFixed(0)}%); `;
    }

    if (source.avgHealthScore < 0.4) {
      reason += `improve source health (${source.avgHealthScore.toFixed(2)}); `;
    }

    reason += `under sovereign + health constraints`;
    return reason;
  }

  private calculateConfidenceScore(
    source: RegionMeshState,
    target: RegionMeshState,
    corridor: any,
    improvement: number
  ): number {
    let score = 0;

    // Higher score if source is very overloaded
    if (source.saturation > 0.8) score += 30;
    else if (source.saturation > 0.7) score += 20;
    else score += 10;

    // Higher score if target is very underloaded
    if (target.saturation < 0.3) score += 30;
    else if (target.saturation < 0.5) score += 20;
    else score += 10;

    // Higher score if corridor is very healthy
    if (corridor.health > 0.8) score += 20;
    else if (corridor.health > 0.6) score += 10;

    // Higher score if significant improvement expected
    if (improvement > 200) score += 20;
    else if (improvement > 100) score += 10;

    // Normalize to 0-100
    return Math.min(100, score);
  }

  validateDecisions(decisions: MeshOptimizationDecision[]): Map<string, any> {
    const validation = new Map<string, any>();

    for (const decision of decisions) {
      const key = `${decision.fromRegionId}->${decision.toRegionId}`;

      const isValid =
        decision.workloadsToMove > 0 &&
        decision.confidenceScore > 0.5 &&
        decision.estimatedLatencyImprovement >= 0;

      validation.set(key, {
        valid: isValid,
        reason: isValid ? "approved" : "validation failed",
        decision,
      });
    }

    return validation;
  }
}
