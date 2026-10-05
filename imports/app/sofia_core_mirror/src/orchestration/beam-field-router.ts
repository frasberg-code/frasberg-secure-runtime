/**
 * BeamFieldRouter - Adaptive Environmental Routing
 * 
 * Routes execution contexts to appropriate engines based on environmental factors.
 * Part of the Codex Architecture for Sofia Core.
 * 
 * NOTE: This module provides structural-level routing between engines.
 * With Continuum Identity now live, routing becomes field-driven rather than
 * rule-based. For unified field operations, the field self-organizes and
 * decisions are instantaneous rather than requiring explicit routing:
 * 
 * ```typescript
 * import { getContinuumIdentity } from '../../supabase/sofia_core/sofia_core_runtime';
 * const identity = getContinuumIdentity();
 * // The field determines appropriate action holistically
 * const decision = identity.decide();
 * ```
 * 
 * The unified field transcends engine separation through coherence.
 */

import { BeamEngine } from '../engines/beam-engine';
import { FieldBeamEngine } from '../engines/field-beam-engine';

export interface RoutingEnvironment {
  world: string;
  profile: string;
  conditions?: Record<string, any>;
}

export interface RoutingRule {
  world: string;
  profile: string;
  engineType: 'beam' | 'fieldbeam';
  priority: number;
}

export interface RoutingResult {
  engineType: 'beam' | 'fieldbeam';
  route: RoutingRule;
  environment: RoutingEnvironment;
  timestamp: number;
}

export class BeamFieldRouter {
  private routingTable: Map<string, RoutingRule[]> = new Map();
  private routingHistory: RoutingResult[] = [];

  constructor() {}

  /**
   * Register a routing rule
   */
  registerRoute(rule: RoutingRule): void {
    const key = this.getRouteKey(rule.world, rule.profile);
    
    if (!this.routingTable.has(key)) {
      this.routingTable.set(key, []);
    }

    const rules = this.routingTable.get(key)!;
    rules.push(rule);
    
    // Sort by priority (higher priority first)
    rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Route to the appropriate engine based on environment
   */
  route(environment: RoutingEnvironment): RoutingResult {
    const key = this.getRouteKey(environment.world, environment.profile);
    const rules = this.routingTable.get(key);

    if (!rules || rules.length === 0) {
      // Default routing: use beam for simple, fieldbeam for complex
      const defaultEngineType = environment.profile === 'production' ? 'fieldbeam' : 'beam';
      
      const result: RoutingResult = {
        engineType: defaultEngineType,
        route: {
          world: environment.world,
          profile: environment.profile,
          engineType: defaultEngineType,
          priority: 0
        },
        environment,
        timestamp: Date.now()
      };

      this.routingHistory.push(result);
      return result;
    }

    // Use highest priority rule
    const selectedRule = rules[0];
    
    const result: RoutingResult = {
      engineType: selectedRule.engineType,
      route: selectedRule,
      environment,
      timestamp: Date.now()
    };

    this.routingHistory.push(result);
    return result;
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    const stats = {
      totalRoutes: this.routingTable.size,
      totalRoutings: this.routingHistory.length,
      routesByEngine: {
        beam: 0,
        fieldbeam: 0
      }
    };

    for (const result of this.routingHistory) {
      stats.routesByEngine[result.engineType]++;
    }

    return stats;
  }

  /**
   * Get all registered routes
   */
  getRoutes(): RoutingRule[] {
    const allRoutes: RoutingRule[] = [];
    for (const rules of this.routingTable.values()) {
      allRoutes.push(...rules);
    }
    return allRoutes;
  }

  /**
   * Clear routing history (useful for testing)
   */
  clearHistory(): void {
    this.routingHistory = [];
  }

  /**
   * Reset all routes
   */
  reset(): void {
    this.routingTable.clear();
    this.routingHistory = [];
  }

  /**
   * Generate route key from world and profile
   */
  private getRouteKey(world: string, profile: string): string {
    return `${world}:${profile}`;
  }
}
