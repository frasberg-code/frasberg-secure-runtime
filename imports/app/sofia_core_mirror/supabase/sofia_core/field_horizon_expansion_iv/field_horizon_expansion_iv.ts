/**
 * Field Horizon Expansion-IV - Fourth-Order Horizon Expansion
 * Part of the Field Horizon-IV Triad for Sofia Core
 * 
 * Expands the mapped horizon-IV into a wider panoramic state.
 * Accepts mapped-IV values, applies fourth-order expansion logic,
 * and produces an expanded horizon-IV state.
 * Represents "the fourth-order horizon expands beyond its initial mapping".
 * This is the system's fourth-order horizon expansion layer.
 */

/**
 * Horizon Expansion-IV state representing fourth-order expanded horizon
 */
export type HorizonExpansionIVState<T> = {
  expanded: boolean;
  value: T;
};

/**
 * Expand horizon state from mapped-IV
 * Applies fourth-order expansion logic and produces expanded horizon-IV state
 * 
 * @param mappedIV - Mapped-IV value to expand
 * @param expander - Function that expands mapped-IV into wider horizon
 * @returns Horizon Expansion-IV state with expanded=true and expanded value
 */
export function expandHorizonStateIV<T>(
  mappedIV: T,
  expander: (value: T) => T
): HorizonExpansionIVState<T> {
  const value = expander(mappedIV);
  return {
    expanded: true,
    value,
  };
}
