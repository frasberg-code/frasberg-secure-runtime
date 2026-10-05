/**
 * Field Persistence - Persistence Across Disruptions
 * Part of the Field Continuity Triad for Sofia Core
 * 
 * Ensures persistence across disruptions by validating and stabilizing state.
 * This is the system's resilience layer — the part that keeps the line intact even when conditions shift.
 */

/**
 * Represents the persistence state with validation result and value
 * 
 * @template T - The type of value being persisted
 */
export type PersistenceState<T> = {
  persistent: boolean;
  value: T;
};

/**
 * Ensure field persistence across disruptions
 * 
 * @param value - Value to ensure persistence for
 * @param validator - Function that validates whether the value is persistent
 * @returns PersistenceState containing validation result and value
 */
export function ensureFieldPersistence<T>(
  value: T,
  validator: (value: T) => boolean
): PersistenceState<T> {
  const persistent = validator(value);
  return {
    persistent,
    value,
  };
}
