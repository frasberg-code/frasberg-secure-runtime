import { Logger, getLogger } from "../../core/governance/logger";

export interface ConstitutionalLoopKernel {
  cycle: (workload: any) => Promise<any>;
  modeManager?: {
    getMode: () => string;
  };
  runSIE?: () => any;
  dashboard?: () => any;
  dashboardSnapshot?: any;
  collectRegionStates?: () => any[];
  optimizeMesh?: (states: any[]) => any[];
}

export class ConstitutionalLoopWiring {
  private logger: Logger;
  private originalCycle: ((workload: any) => Promise<any>) | null = null;

  constructor(private readonly kernel: ConstitutionalLoopKernel) {
    this.logger = getLogger("ConstitutionalLoopWiring");
  }

  wire() {
    this.logger.info("Wiring Constitutional Loop into kernel cycle");

    // Store original cycle
    this.originalCycle = this.kernel.cycle.bind(this.kernel);

    // Replace cycle with enhanced version
    this.kernel.cycle = async (workload: any) => {
      const cycleStartTime = Date.now();
      this.logger.debug("Starting constitutional cycle", { workloadId: workload?.id });

      try {
        // 1. Run original kernel cycle (Predict → Infer → Decide → Govern)
        const coreResult = await this.originalCycle!(workload);
        this.logger.debug("Core cycle complete");

        // 2. Run SIE intelligence (Analyze constitutional stress)
        const sieOutput = this.kernel.runSIE?.();
        if (sieOutput) {
          this.logger.debug("SIE analysis complete", {
            insightCount: sieOutput.insights?.length || 0,
            criticalCount: sieOutput.critical?.length || 0,
          });
        }

        // 3. Update dashboard snapshot (Real-time visibility)
        const dashboardSnapshot = this.kernel.dashboard?.();
        if (dashboardSnapshot) {
          this.kernel.dashboardSnapshot = dashboardSnapshot;
          this.logger.debug("Dashboard snapshot updated");
        }

        // 4. Run mesh optimizer if in evolution or self_governing mode
        let meshOptimizationResult = null;
        const currentMode = this.kernel.modeManager?.getMode?.() ?? "default";

        if (["evolution", "self_governing"].includes(currentMode)) {
          const regionStates = this.kernel.collectRegionStates?.() ?? [];
          if (regionStates.length > 0) {
            meshOptimizationResult = this.kernel.optimizeMesh?.(regionStates);
            this.logger.debug("Mesh optimization complete", {
              mode: currentMode,
              regionCount: regionStates.length,
              decisionsGenerated: meshOptimizationResult?.length || 0,
            });
          }
        }

        const cycleEndTime = Date.now();
        const cycleDuration = cycleEndTime - cycleStartTime;

        // Build complete cycle result
        const completeResult = {
          ...coreResult,
          constitutional: {
            sie: sieOutput,
            dashboard: dashboardSnapshot,
            meshOptimization: meshOptimizationResult,
            cycleDuration,
            mode: currentMode,
            timestamp: new Date().toISOString(),
          },
        };

        this.logger.info("Constitutional cycle complete", {
          duration: `${cycleDuration}ms`,
          mode: currentMode,
        });

        return completeResult;
      } catch (error) {
        this.logger.error("Constitutional cycle failed", error);
        throw error;
      }
    };

    this.logger.info("Constitutional Loop wiring complete");
    return this.kernel;
  }
}

export function wireConstitutionalLoop(kernel: ConstitutionalLoopKernel) {
  const wiring = new ConstitutionalLoopWiring(kernel);
  return wiring.wire();
}
