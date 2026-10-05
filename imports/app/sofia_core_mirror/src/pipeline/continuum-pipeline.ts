/**
 * ContinuumPipeline - Self-Renewing Execution Pipeline
 * 
 * A self-renewing execution pipeline that maintains continuous execution flow.
 * Part of the Codex Architecture for Sofia Core.
 */

export interface PipelineStage {
  name: string;
  handler: (data: any) => Promise<any>;
  renewalThreshold?: number;
}

export interface PipelineResult {
  success: boolean;
  data: any;
  stagesExecuted: string[];
  renewalCount: number;
  timestamp: number;
}

export class ContinuumPipeline {
  private stages: PipelineStage[] = [];
  private renewalCount: number = 0;
  private executionHistory: PipelineResult[] = [];
  private autoRenewal: boolean = true;

  constructor(autoRenewal: boolean = true) {
    this.autoRenewal = autoRenewal;
  }

  /**
   * Add a stage to the pipeline
   */
  addStage(stage: PipelineStage): void {
    this.stages.push(stage);
  }

  /**
   * Execute the pipeline
   */
  async execute(initialData: any): Promise<PipelineResult> {
    const stagesExecuted: string[] = [];
    let currentData = initialData;
    let success = true;

    try {
      for (const stage of this.stages) {
        stagesExecuted.push(stage.name);
        
        // Execute stage
        currentData = await stage.handler(currentData);

        // Check renewal threshold
        if (this.autoRenewal && stage.renewalThreshold) {
          if (this.shouldRenew(stage.renewalThreshold)) {
            await this.renew();
          }
        }
      }
    } catch (error) {
      success = false;
      currentData = { 
        error: error instanceof Error ? error.message : 'Unknown error',
        lastSuccessfulStage: stagesExecuted[stagesExecuted.length - 1]
      };
    }

    const result: PipelineResult = {
      success,
      data: currentData,
      stagesExecuted,
      renewalCount: this.renewalCount,
      timestamp: Date.now()
    };

    this.executionHistory.push(result);
    return result;
  }

  /**
   * Manually trigger pipeline renewal
   */
  async renew(): Promise<void> {
    this.renewalCount++;
    // Renewal logic - could include resource cleanup, state refresh, etc.
    await this.performRenewal();
  }

  /**
   * Check if renewal should occur based on threshold
   */
  private shouldRenew(threshold: number): boolean {
    // Renewal logic based on execution count or other metrics
    const executionsSinceRenewal = this.executionHistory.length % 10;
    return executionsSinceRenewal >= threshold;
  }

  /**
   * Perform the actual renewal process
   */
  private async performRenewal(): Promise<void> {
    // Simulate renewal process with minimal delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Get pipeline statistics
   */
  getStats() {
    const successCount = this.executionHistory.filter(r => r.success).length;
    const failureCount = this.executionHistory.filter(r => !r.success).length;

    return {
      totalStages: this.stages.length,
      totalExecutions: this.executionHistory.length,
      renewalCount: this.renewalCount,
      successCount,
      failureCount,
      successRate: this.executionHistory.length > 0 
        ? successCount / this.executionHistory.length 
        : 0,
      autoRenewal: this.autoRenewal
    };
  }

  /**
   * Get all stages
   */
  getStages(): PipelineStage[] {
    return [...this.stages];
  }

  /**
   * Set auto-renewal
   */
  setAutoRenewal(enabled: boolean): void {
    this.autoRenewal = enabled;
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Reset the pipeline
   */
  reset(): void {
    this.stages = [];
    this.renewalCount = 0;
    this.executionHistory = [];
  }
}
