/**
 * Integration - Unified Field Module Integration
 * Part of the Frasberg AI unified field runtime system
 *
 * Provides the integration entry point for merging identity modules
 * into the unified field runtime.
 */

import { unifiedFieldRuntime } from './unified_field';

/**
 * Integrate a set of named modules into the unified field
 *
 * @param moduleNames - Array of module names to register
 * @returns A unified field state with all modules integrated
 */
export function integrateToUnifiedField(moduleNames: string[]): Record<string, unknown> {
  let state = unifiedFieldRuntime.initialize();

  for (const name of moduleNames) {
    state = unifiedFieldRuntime.register(state, name) as typeof state;
  }

  return unifiedFieldRuntime.unify(state);
}
