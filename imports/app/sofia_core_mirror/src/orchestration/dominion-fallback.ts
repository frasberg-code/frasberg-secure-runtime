/**
 * DominionFallback - Authoritative Fallback Logic
 * 
 * @deprecated This is legacy pre-continuum scaffolding.
 * 
 * With Movement III (Continuum Identity) now live, this sequential fallback mechanism
 * contradicts the unified field architecture where:
 * - Operations are instantaneous and holistic, not sequential
 * - The field self-stabilizes through ContinuumIdentity.stabilize()
 * - Errors dissolve within the unified identity-field rather than being handled sequentially
 * 
 * **Migration Path:**
 * Replace with `ContinuumIdentity` operations from the post_structural runtime:
 * ```typescript
 * import { getPostStructuralRuntime } from '../supabase/sofia_core/post_structural';
 * const runtime = getPostStructuralRuntime();
 * const identity = runtime.getIdentity();
 * // Use identity.stabilize() or identity.handlePressure() instead of fallback chains
 * ```
 * 
 * Provides authoritative fallback mechanisms when primary execution fails.
 * Part of the Codex Architecture for Sofia Core.
 */

export interface FallbackStrategy {
  name: string;
  priority: number;
  handler: (context: any, error: Error) => Promise<any>;
}

export interface FallbackResult {
  success: boolean;
  strategyUsed: string | null;
  result: any;
  attemptedStrategies: string[];
  timestamp: number;
}

export class DominionFallback {
  private strategies: FallbackStrategy[] = [];
  private fallbackHistory: FallbackResult[] = [];
  private authorityLevel: number = 1.0;

  constructor(authorityLevel: number = 1.0) {
    if (authorityLevel < 0 || authorityLevel > 1) {
      throw new Error('authorityLevel must be between 0 and 1');
    }
    this.authorityLevel = authorityLevel;
  }

  /**
   * Register a fallback strategy
   */
  registerStrategy(strategy: FallbackStrategy): void {
    this.strategies.push(strategy);
    
    // Sort by priority (higher priority first)
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute fallback chain
   */
  async executeFallback(
    context: any,
    primaryError: Error
  ): Promise<FallbackResult> {
    const attemptedStrategies: string[] = [];

    // Try each strategy in priority order
    for (const strategy of this.strategies) {
      attemptedStrategies.push(strategy.name);

      try {
        const result = await strategy.handler(context, primaryError);
        
        const fallbackResult: FallbackResult = {
          success: true,
          strategyUsed: strategy.name,
          result,
          attemptedStrategies,
          timestamp: Date.now()
        };

        this.fallbackHistory.push(fallbackResult);
        return fallbackResult;
      } catch (error) {
        // Strategy failed, try next one
        continue;
      }
    }

    // All strategies exhausted
    const fallbackResult: FallbackResult = {
      success: false,
      strategyUsed: null,
      result: { 
        error: 'All fallback strategies exhausted',
        originalError: primaryError.message 
      },
      attemptedStrategies,
      timestamp: Date.now()
    };

    this.fallbackHistory.push(fallbackResult);
    return fallbackResult;
  }

  /**
   * Get the authority level
   */
  getAuthorityLevel(): number {
    return this.authorityLevel;
  }

  /**
   * Set the authority level
   */
  setAuthorityLevel(level: number): void {
    if (level < 0 || level > 1) {
      throw new Error('authorityLevel must be between 0 and 1');
    }
    this.authorityLevel = level;
  }

  /**
   * Get fallback statistics
   */
  getStats() {
    const successCount = this.fallbackHistory.filter(r => r.success).length;
    const failureCount = this.fallbackHistory.filter(r => !r.success).length;

    const strategyUsage: Record<string, number> = {};
    for (const result of this.fallbackHistory) {
      if (result.strategyUsed) {
        strategyUsage[result.strategyUsed] = (strategyUsage[result.strategyUsed] || 0) + 1;
      }
    }

    return {
      authorityLevel: this.authorityLevel,
      totalStrategies: this.strategies.length,
      totalFallbacks: this.fallbackHistory.length,
      successCount,
      failureCount,
      successRate: this.fallbackHistory.length > 0 
        ? successCount / this.fallbackHistory.length 
        : 0,
      strategyUsage
    };
  }

  /**
   * Get registered strategies
   */
  getStrategies(): FallbackStrategy[] {
    return [...this.strategies];
  }

  /**
   * Clear fallback history
   */
  clearHistory(): void {
    this.fallbackHistory = [];
  }

  /**
   * Reset the fallback system
   */
  reset(): void {
    this.strategies = [];
    this.fallbackHistory = [];
  }
}
