/**
 * Field Continuity - Cross-Cycle Continuity Maintenance
 * Part of the Field Continuity Triad for Sofia Core
 * 
 * Maintains continuity across cycles by carrying forward the temporal thread.
 * This is the system's temporal thread — the part that remembers the line it's walking.
 */

/**
 * Represents the continuity state between previous and current cycles
 * 
 * @template T - The type of state being maintained
 */
export type ContinuityState<T> = {
  previous: T | null;
  current: T;
};

/**
 * Maintain field continuity across cycles
 * 
 * @param previous - Previous cycle state (null for first cycle)
 * @param current - Current cycle state
 * @returns ContinuityState containing both previous and current states
 */
export function maintainFieldContinuity<T>(
  previous: T | null,
  current: T
): ContinuityState<T> {
  return {
    previous,
    current,
  };
}
