/**
 * FieldBeamEngine - Anchored Execution with Retry Envelope
 * 
 * An anchored execution engine with built-in retry logic and field stabilization.
 * Part of the Codex Architecture for Sofia Core.
 */

export interface FieldBeamConfig {
  maxRetries?: number;
  retryDelay?: number;
  fieldStrength?: number;
}

export interface FieldBeamResult {
  success: boolean;
  data: any;
  attempts: number;
  fieldStrength: number;
  anchored: boolean;
  timestamp: number;
}

export class FieldBeamEngine {
  private config: Required<FieldBeamConfig>;
  private anchorPoint: any = null;
  private executionHistory: number[] = [];

  constructor(config: FieldBeamConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 100,
      fieldStrength: config.fieldStrength ?? 1.0
    };

    if (this.config.maxRetries < 0) {
      throw new Error('maxRetries must be non-negative');
    }
    if (this.config.fieldStrength < 0 || this.config.fieldStrength > 1) {
      throw new Error('fieldStrength must be between 0 and 1');
    }
  }

  /**
   * Set the anchor point for field beam operations
   */
  setAnchor(anchor: any): void {
    this.anchorPoint = anchor;
  }

  /**
   * Get the current anchor point
   */
  getAnchor(): any {
    return this.anchorPoint;
  }

  /**
   * Execute with retry envelope
   */
  async executeWithRetry(
    operation: () => Promise<any>,
    context?: any
  ): Promise<FieldBeamResult> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= this.config.maxRetries) {
      attempts++;
      
      try {
        const data = await operation();
        this.executionHistory.push(Date.now());
        
        return {
          success: true,
          data,
          attempts,
          fieldStrength: this.config.fieldStrength,
          anchored: this.anchorPoint !== null,
          timestamp: Date.now()
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't delay after last attempt
        if (attempts <= this.config.maxRetries) {
          await this.delay(this.config.retryDelay);
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      data: { error: lastError?.message || 'Unknown error' },
      attempts,
      fieldStrength: this.config.fieldStrength,
      anchored: this.anchorPoint !== null,
      timestamp: Date.now()
    };
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      config: this.config,
      anchored: this.anchorPoint !== null,
      executionCount: this.executionHistory.length,
      lastExecution: this.executionHistory[this.executionHistory.length - 1] || null
    };
  }

  /**
   * Reset the engine state
   */
  reset(): void {
    this.anchorPoint = null;
    this.executionHistory = [];
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
