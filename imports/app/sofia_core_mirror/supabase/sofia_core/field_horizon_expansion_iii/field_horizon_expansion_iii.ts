/**
 * Field Horizon Expansion-III - Third-Order Horizon Expansion
 * Part of the Field Horizon-III Triad for Sofia Core
 * 
 * Expands the mapped horizon-III into a wider panoramic state.
 * Accepts mapped-III values, applies third-order expansion logic,
 * and produces an expanded horizon-III state.
 * Represents "the third-order horizon expands beyond its initial mapping".
 * This is the system's third-order horizon expansion layer.
 */

/**
 * Horizon Expansion-III state representing third-order expanded horizon
 */
export type HorizonExpansionIIIState<T> = {
  expanded: boolean;
  value: T;
};

/**
 * Expand horizon state from mapped-III
 * Applies third-order expansion logic and produces expanded horizon-III state
 * 
 * @param mappedIII - Mapped-III value to expand
 * @param expander - Function that expands mapped-III into wider horizon
 * @returns Horizon Expansion-III state with expanded=true and expanded value
 */
export function expandHorizonStateIII<T>(
  mappedIII: T,
  expander: (value: T) => T
): HorizonExpansionIIIState<T> {
  const value = expander(mappedIII);
  return {
    expanded: true,
    value,
  };
}
