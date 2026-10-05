/**
 * Context Weaver - Contextual Thread Integration
 * Part of the Expressive Synthesis Triad for Sofia Core
 * 
 * Interlaces contextual threads into a unified expression object,
 * ensuring continuity and coherence across modules.
 */

/**
 * Weave contextual threads into unified expression
 * Merges context threads with base to create cohesive state
 * 
 * @param base - Base context object
 * @param threads - Additional contextual threads to weave in
 * @returns Unified context with merged threads
 */
export function weaveContext(
  base: Record<string, unknown>,
  threads: Record<string, unknown>
): Record<string, unknown> {
  // Merge contextual threads into a unified expression
  return { ...base, ...threads };
}
