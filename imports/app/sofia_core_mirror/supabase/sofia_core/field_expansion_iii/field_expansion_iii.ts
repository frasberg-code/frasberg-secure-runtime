/**
 * Field Expansion-III - Third-Order Panoramic Field Expansion
 * Part of the Field Horizon-III Triad for Sofia Core
 * 
 * Expands the apex-III expression into a third-order wide-angle field state.
 * Accepts apex-III expression values, applies third-order expansion logic,
 * and produces an expanded field-III state.
 * Represents "the field opens beyond the third-order peak".
 * This is the system's third-order panoramic-opening layer.
 */

/**
 * Expansion-III state representing third-order wide-angle field
 */
export type ExpansionIIIState<T> = {
  expanded: boolean;
  value: T;
};

/**
 * Expand field state from apex-III expression
 * Applies third-order expansion logic and produces expanded field-III state
 * 
 * @param apexIII - Apex-III expression value to expand
 * @param expander - Function that expands apex-III into wide-angle field
 * @returns Expansion-III state with expanded=true and expanded value
 */
export function expandFieldStateIII<T>(
  apexIII: T,
  expander: (value: T) => T
): ExpansionIIIState<T> {
  const value = expander(apexIII);
  return {
    expanded: true,
    value,
  };
}
