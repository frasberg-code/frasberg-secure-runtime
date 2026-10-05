/**
 * BeamEngine - Directional Execution Engine
 * 
 * A directional execution engine that processes context with a specific capability focus.
 * Part of the Codex Architecture for Sofia Core.
 */

export interface BeamExecutionResult {
  capability: string;
  context: any;
  result: string;
  timestamp: number;
  direction: string;
}

export class BeamEngine {
  private capability: string;
  private executionCount: number = 0;

  constructor(capability: string) {
    if (!capability || typeof capability !== 'string') {
      throw new Error('BeamEngine requires a valid capability string');
    }
    this.capability = capability;
  }

  /**
   * Execute the beam with given context
   */
  async execute(context: any): Promise<BeamExecutionResult> {
    this.executionCount++;
    
    return {
      capability: this.capability,
      context,
      result: "beam-executed",
      timestamp: Date.now(),
      direction: "forward"
    };
  }

  /**
   * Get the capability this beam is configured for
   */
  getCapability(): string {
    return this.capability;
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      capability: this.capability,
      executionCount: this.executionCount
    };
  }

  /**
   * Reset execution counter (useful for testing)
   */
  reset(): void {
    this.executionCount = 0;
  }
}
