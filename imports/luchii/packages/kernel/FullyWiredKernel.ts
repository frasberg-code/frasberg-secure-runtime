import { MultiRegionSovereignMeshOptimizer } from "../mesh/optimizer/MultiRegionSovereignMeshOptimizer";
import { MeshOptimizerWiring, wireMeshOptimizer } from "../mesh/optimizer/MeshOptimizerWiring";
import { ConstitutionalLoopWiring, wireConstitutionalLoop } from "./ConstitutionalLoopWiring";
import { SovereignConstitutionV5Engine, createSovereignConstitutionV5Engine } from "../sovereignty/constitution/SovereignConstitutionV5Engine";
import { Logger, getLogger } from "../../core/governance/logger";

export interface FullyWiredKernelConfig {
  kernel: any;
  optimizer: MultiRegionSovereignMeshOptimizer;
  telemetryBus: (event: any) => void;
  governance: { emit: (event: any) => void };
  memory: { write: (record: any) => void; read: (id: string) => any; query: (filter: any) => any[] };
  amendmentProposer: { proposeAmendments: (ctx: any) => any[] };
}

/**
 * Full kernel wiring: integrates Mesh Optimizer + Constitutional Loop + Constitution V5
 * This creates the complete sovereign intelligence organism
 */
export class FullyWiredKernel {
  private logger: Logger;
  private meshWiring: MeshOptimizerWiring | null = null;
  private loopWiring: ConstitutionalLoopWiring | null = null;
  private constitutionV5: SovereignConstitutionV5Engine | null = null;

  constructor(private readonly config: FullyWiredKernelConfig) {
    this.logger = getLogger("FullyWiredKernel");
  }

  /**
   * Execute complete wiring sequence
   */
  wireAll() {
    this.logger.info("🧠 Starting complete kernel wiring sequence");

    // Step 1: Wire Mesh Optimizer
    this.logger.info("Step 1/3: Wiring Mesh Optimizer...");
    this.meshWiring = new MeshOptimizerWiring({
      optimizer: this.config.optimizer,
      kernel: this.config.kernel,
      telemetryBus: this.config.telemetryBus,
      governance: this.config.governance,
    });
    wireMeshOptimizer({
      optimizer: this.config.optimizer,
      kernel: this.config.kernel,
      telemetryBus: this.config.telemetryBus,
      governance: this.config.governance,
    });
    this.logger.info("✓ Mesh Optimizer wired");

    // Step 2: Wire Constitutional Loop
    this.logger.info("Step 2/3: Wiring Constitutional Loop...");
    this.loopWiring = new ConstitutionalLoopWiring(this.config.kernel);
    wireConstitutionalLoop(this.config.kernel);
    this.logger.info("✓ Constitutional Loop wired");

    // Step 3: Create Constitution V5 Engine
    this.logger.info("Step 3/3: Initializing SovereignConstitution V5...");
    this.constitutionV5 = createSovereignConstitutionV5Engine(
      {
        memory: this.config.memory,
        governance: this.config.governance,
        amendmentProposer: this.config.amendmentProposer,
      },
      "v4"
    );
    this.logger.info("✓ Constitution V5 initialized");

    this.logger.info("🧠 Fully wired kernel complete - All systems operational");

    return this.config.kernel;
  }

  /**
   * Get the wired kernel
   */
  getKernel() {
    return this.config.kernel;
  }

  /**
   * Get Constitution V5 engine for amendment evaluation
   */
  getConstitutionV5(): SovereignConstitutionV5Engine | null {
    return this.constitutionV5;
  }

  /**
   * Evaluate and apply constitutional amendments
   */
  evaluateConstitutionalAmendments(ctx: any) {
    if (!this.constitutionV5) {
      this.logger.warn("Constitution V5 not initialized - cannot evaluate amendments");
      return [];
    }

    return this.constitutionV5.evaluateAndAmend(ctx);
  }

  /**
   * Get constitutional state and statistics
   */
  getConstitutionalState() {
    if (!this.constitutionV5) {
      return null;
    }

    return {
      state: this.constitutionV5.getState(),
      statistics: this.constitutionV5.getStatistics(),
    };
  }
}

/**
 * Factory function for complete kernel wiring
 */
export function wireFullyAutonomousKernel(config: FullyWiredKernelConfig) {
  const fullyWired = new FullyWiredKernel(config);
  return fullyWired.wireAll();
}
