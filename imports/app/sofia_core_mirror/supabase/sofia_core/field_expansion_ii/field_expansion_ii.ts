/**
 * Field Expansion-II - Second-Order Panoramic Field Expansion
 * Part of the Field Horizon-II Triad for Sofia Core
 * 
 * Expands the apex-II expression into a second-order wide-angle field state.
 * Accepts apex-II expression values, applies second-order expansion logic,
 * and produces an expanded field-II state.
 * Represents "the field opens beyond the second-order peak".
 * This is the system's second-order panoramic-opening layer.
 */

/**
 * Expansion-II state representing second-order wide-angle field
 */
export type ExpansionIIState<T> = {
  expanded: boolean;
  value: T;
};

/**
 * Expand field state from apex-II expression
 * Applies second-order expansion logic and produces expanded field-II state
 * 
 * @param apexII - Apex-II expression value to expand
 * @param expander - Function that expands apex-II into wide-angle field
 * @returns Expansion-II state with expanded=true and expanded value
 */
export function expandFieldStateII<T>(
  apexII: T,
  expander: (value: T) => T
): ExpansionIIState<T> {
  const value = expander(apexII);
  return {
    expanded: true,
    value,
  };
}
