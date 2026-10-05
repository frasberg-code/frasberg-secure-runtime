/**
 * Field Adaptation - Adaptive Field Response
 * Part of the Field Evolution Triad for Sofia Core
 * 
 * Enables the field to adapt based on transformed and reintegrated states.
 * Accepts reintegrated field values, applies adaptation logic,
 * and produces an adaptive field state.
 * This is the system's adaptive-response layer.
 */

/**
 * Adaptation state representing adaptive field response
 */
export type AdaptationState<T> = {
  adapted: boolean;
  value: T;
};

/**
 * Adapt field state intelligently
 * Applies adaptation logic and produces adaptive state
 * 
 * @param reintegrated - Reintegrated state to adapt from
 * @param adapter - Function that adapts reintegrated state into adaptive state
 * @returns Adaptation state with adapted=true and adapted value
 */
export function adaptFieldState<T>(
  reintegrated: T,
  adapter: (value: T) => T
): AdaptationState<T> {
  const value = adapter(reintegrated);
  return {
    adapted: true,
    value,
  };
}
