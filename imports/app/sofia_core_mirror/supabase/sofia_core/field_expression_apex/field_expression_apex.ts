/**
 * Field Expression Apex - Highest-Order Apex Expression
 * Part of the Field Apex Triad for Sofia Core
 * 
 * Expresses the focused apex state outward as its highest-order signal.
 * Accepts focused states, applies apex-expression logic,
 * and produces an apex expression state.
 * Represents "the field expresses its highest form".
 * This is the system's apex-expression layer.
 */

/**
 * Apex expression state representing highest-order signal
 */
export type ApexExpressionState<T> = {
  expressed: boolean;
  value: T;
};

/**
 * Express apex state outward
 * Applies apex-expression logic and produces apex expression state
 * 
 * @param focused - Focused state to express as highest-order signal
 * @param expresser - Function that expresses focused state as apex signal
 * @returns Apex expression state with expressed=true and expressed value
 */
export function expressApexState<T>(
  focused: T,
  expresser: (value: T) => T
): ApexExpressionState<T> {
  const value = expresser(focused);
  return {
    expressed: true,
    value,
  };
}
