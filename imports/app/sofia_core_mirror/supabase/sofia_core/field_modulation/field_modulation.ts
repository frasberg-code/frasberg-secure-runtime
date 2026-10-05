/**
 * Field Modulation - Influence-Based Field Modulation
 * Part of the Field Influence Triad for Sofia Core
 * 
 * Modulates the field in response to influence.
 * Accepts influence states, applies modulation rules,
 * and produces a modulated field state.
 * This is the system's adaptive shaping layer.
 */

/**
 * Modulation state representing adaptive field modulation
 */
export type ModulationState<T> = {
  modulated: boolean;
  value: T;
};

/**
 * Modulate field from influence
 * Applies modulation rules and produces modulated state
 * 
 * @param influence - Influence state to modulate from
 * @param modulator - Function that transforms influence into modulation
 * @returns Modulation state with modulated=true and transformed value
 */
export function modulateFieldFromInfluence<T>(
  influence: T,
  modulator: (value: T) => T
): ModulationState<T> {
  const value = modulator(influence);
  return {
    modulated: true,
    value,
  };
}
