/**
 * Field Expression Apex II - Highest-Order Multi-Cycle Expression
 * Part of the Field Apex-II Triad for Sofia Core
 * 
 * Expresses the focused second-order apex as the highest-order multi-cycle signal.
 * Accepts focus-II states, applies apex-II expression logic,
 * and produces an ApexIIExpressionState.
 * Represents "the field expresses its highest multi-cycle form".
 * This is the system's higher-order expression layer.
 */

/**
 * Apex II expression state representing highest-order multi-cycle signal
 */
export type ApexIIExpressionState<T> = {
  expressed: boolean;
  value: T;
};

/**
 * Express second-order apex state as highest multi-cycle signal
 * Applies apex-II expression logic and produces ApexIIExpressionState
 * 
 * @param focusedII - Focused II state to express as highest-order multi-cycle signal
 * @param expresser - Function that expresses focused-II state as apex-II signal
 * @returns Apex II expression state with expressed=true and expressed value
 */
export function expressApexIIState<T>(
  focusedII: T,
  expresser: (value: T) => T
): ApexIIExpressionState<T> {
  const value = expresser(focusedII);
  return {
    expressed: true,
    value,
  };
}
