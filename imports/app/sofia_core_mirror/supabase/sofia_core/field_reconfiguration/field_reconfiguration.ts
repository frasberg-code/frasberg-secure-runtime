/**
 * Field Reconfiguration - Structural Field Reconfiguration
 * Part of the Field Transformation Triad for Sofia Core
 * 
 * Reconfigures the transformed field into a new structural pattern.
 * Accepts transformed states, applies reconfiguration logic,
 * and produces a reconfigured field state.
 * This is the system's structural-patterning layer.
 */

/**
 * Reconfiguration state representing structural field reconfiguration
 */
export type ReconfigurationState<T> = {
  reconfigured: boolean;
  value: T;
};

/**
 * Reconfigure field state structurally
 * Applies reconfiguration logic and produces reconfigured state
 * 
 * @param transformed - Transformed state to reconfigure from
 * @param reconfigurer - Function that reconfigures transformed state into reconfigured state
 * @returns Reconfiguration state with reconfigured=true and reconfigured value
 */
export function reconfigureFieldState<T>(
  transformed: T,
  reconfigurer: (value: T) => T
): ReconfigurationState<T> {
  const value = reconfigurer(transformed);
  return {
    reconfigured: true,
    value,
  };
}
