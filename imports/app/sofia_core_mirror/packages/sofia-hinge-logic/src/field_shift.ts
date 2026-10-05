/**
 * Field Shift - Directional Field Shifting
 * Part of the Field Influence Triad for Sofia Core
 * 
 * Applies directional shifts to the modulated field.
 * Accepts modulated states, applies shift logic,
 * and produces a shifted field state representing a new configuration.
 * This is the system's capacity to move the field into a new state.
 */

/**
 * Shift state representing directional field shift
 */
export type ShiftState<T> = {
  shifted: boolean;
  value: T;
};

/**
 * Shift field state directionally
 * Applies shift logic and produces shifted state
 * 
 * @param modulated - Modulated state to shift from
 * @param shifter - Function that transforms modulated state into shifted state
 * @returns Shift state with shifted=true and transformed value
 */
export function shiftFieldState<T>(
  modulated: T,
  shifter: (value: T) => T
): ShiftState<T> {
  const value = shifter(modulated);
  return {
    shifted: true,
    value,
  };
}
