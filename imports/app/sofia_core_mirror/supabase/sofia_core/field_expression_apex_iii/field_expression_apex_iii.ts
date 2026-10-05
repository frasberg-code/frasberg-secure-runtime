/**
 * Field Expression Apex III - Third-Order Highest-Order Apex Expression
 * Part of the Field Apex-III Triad for Sofia Core
 * 
 * Expresses the third-order apex-III signal outward.
 * Accepts third-order focused states, applies apex-expression logic,
 * and produces a third-order apex expression state.
 * Represents "the third-order field expresses its highest form".
 * This is the system's third-order apex-expression layer.
 */

/**
 * Third-order apex expression state representing highest-order signal
 */
export type ApexExpressionIIIState<T> = {
  expressed: boolean;
  value: T;
};

/**
 * Express third-order apex state outward
 * Applies apex-expression logic and produces third-order apex expression state
 * 
 * @param focusIII - Third-order focused state to express as highest-order signal
 * @param expressFn - Function that expresses focused-III state as apex-III signal
 * @returns Third-order apex expression state with expressed=true and expressed value
 */
export function expressApexStateIII<T>(
  focusIII: T,
  expressFn: (value: T) => T
): ApexExpressionIIIState<T> {
  const value = expressFn(focusIII);
  return {
    expressed: true,
    value,
  };
}
