/**
 * Field Horizon Mapping-II - Second-Order Horizon-Scale Structural Mapping
 * Part of the Field Horizon-II Triad for Sofia Core
 * 
 * Maps the expanded field-II state at horizon-II scale.
 * Accepts expansion-II values, applies second-order horizon mapping,
 * and produces a mapped horizon-II state.
 * Represents "the second-order field is structured at the horizon".
 * This is the system's second-order horizon mapping layer.
 */

/**
 * Horizon Mapping-II state representing second-order horizon structure
 */
export type HorizonMappingIIState<T> = {
  mapped: boolean;
  value: T;
};

/**
 * Map horizon state from expansion-II
 * Applies second-order horizon mapping and produces mapped horizon-II state
 * 
 * @param expansionII - Expansion-II value to map at horizon scale
 * @param mapper - Function that maps expansion-II into horizon-II structure
 * @returns Horizon Mapping-II state with mapped=true and mapped value
 */
export function mapHorizonStateII<T>(
  expansionII: T,
  mapper: (value: T) => T
): HorizonMappingIIState<T> {
  const value = mapper(expansionII);
  return {
    mapped: true,
    value,
  };
}
