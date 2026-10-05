/**
 * Field Continuum Flow IV - Fourth-Order Continuum Flow
 * Part of the Field Continuum-IV Triad for Sofia Core
 * 
 * Flows the fourth-order continuum state.
 * Accepts initiated-IV values, applies flow logic,
 * and produces a continuum-flow-IV state.
 * Represents "the field flows through the fourth-order continuum".
 * This is the system's fourth-order continuum flow layer.
 */

/**
 * Field continuum flow IV state representing fourth-order continuum flow
 */
export type FieldContinuumFlowIVState<T> = {
  flowing: boolean;
  value: T;
};

/**
 * Flow fourth-order continuum state by applying flow logic
 * Applies flow function and produces continuum-flow-IV state
 * 
 * @param initiatedIV - Initiated-IV value to flow
 * @param flowFn - Function that applies fourth-order flow logic
 * @returns Field continuum flow IV state with flowing=true and flowing value
 */
export function flowContinuumStateIV<T>(
  initiatedIV: T,
  flowFn: (value: T) => T
): FieldContinuumFlowIVState<T> {
  const value = flowFn(initiatedIV);
  return {
    flowing: true,
    value,
  };
}
