/**
 * Field Horizon Mapping - Horizon-Scale Structural Mapping
 * Part of the Field Horizon Triad for Sofia Core
 * 
 * Maps the expanded field into a coherent horizon-scale structure.
 * Accepts expanded states, applies mapping logic,
 * and produces a horizon map state.
 * Represents "the field organizes itself across the full horizon".
 * This is the system's structural-mapping layer.
 */

/**
 * Horizon map state representing structured horizon
 */
export type HorizonMapState<T> = {
  mapped: boolean;
  value: T;
};

/**
 * Map horizon state from expanded field
 * Applies mapping logic and produces horizon map state
 * 
 * @param expanded - Expanded field state to map
 * @param mapper - Function that maps expanded field into horizon structure
 * @returns Horizon map state with mapped=true and mapped value
 */
export function mapHorizonState<T>(
  expanded: T,
  mapper: (value: T) => T
): HorizonMapState<T> {
  const value = mapper(expanded);
  return {
    mapped: true,
    value,
  };
}
