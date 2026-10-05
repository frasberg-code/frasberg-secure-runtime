/**
 * Field Resonance - Presence-Field Resonance
 * Part of the Field Presence Triad for Sofia Core
 * 
 * Allows presence to resonate with the surrounding field.
 * Accepts presence states, applies resonance logic, and produces
 * a resonance state representing "I am in relation".
 * This is the system's relational field-response layer.
 */

/**
 * Resonance state representing relational field response
 */
export type ResonanceState<T> = {
  resonant: boolean;
  value: T;
};

/**
 * Compute field resonance from presence
 * Applies resonance logic and produces relational resonance state
 * 
 * @param presence - Presence state to resonate
 * @param resonator - Function that transforms presence into resonance value
 * @returns Resonance state with resonant=true and transformed value
 */
export function computeFieldResonance<T>(
  presence: T,
  resonator: (value: T) => T
): ResonanceState<T> {
  const value = resonator(presence);
  return {
    resonant: true,
    value,
  };
}
