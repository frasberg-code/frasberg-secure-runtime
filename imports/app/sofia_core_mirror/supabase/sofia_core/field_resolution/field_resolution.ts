/**
 * Field Resolution - Conflict Resolution
 * Part of the Field Decision Triad for Sofia Core
 * 
 * Resolves ambiguity and conflicting tendencies.
 * Takes competing intents, applies resolution logic, and produces
 * a single resolved direction. This is the field's conflict-resolution layer.
 */

/**
 * Resolve field conflict by selecting highest-weight intent
 * Applies weight-based resolution to competing options
 * 
 * @param intents - Array of weighted intent options
 * @returns Resolved option with highest weight
 */
export function resolveFieldConflict<T>(
  intents: Array<{ option: T; weight: number }>
): T {
  if (intents.length === 0) {
    throw new Error('No intents provided for resolution');
  }
  const sorted = [...intents].sort((a, b) => b.weight - a.weight);
  return sorted[0].option;
}
