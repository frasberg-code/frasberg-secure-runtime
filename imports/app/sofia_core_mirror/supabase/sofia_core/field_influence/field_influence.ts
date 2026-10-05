/**
 * Field Influence - Presence-Based Field Influence
 * Part of the Field Influence Triad for Sofia Core
 * 
 * Applies influence from presence into the surrounding field.
 * Accepts presence-projection or resonance states, applies influence logic,
 * and produces an influence state representing "I affect the field".
 * This is the system's active shaping layer.
 */

/**
 * Influence state representing active field influence
 */
export type InfluenceState<T> = {
  influencing: boolean;
  value: T;
};

/**
 * Apply field influence from presence
 * Applies influence logic and produces influence state
 * 
 * @param presence - Presence or resonance state to apply influence from
 * @param influencer - Function that transforms presence into influence
 * @returns Influence state with influencing=true and transformed value
 */
export function applyFieldInfluence<T>(
  presence: T,
  influencer: (value: T) => T
): InfluenceState<T> {
  const value = influencer(presence);
  return {
    influencing: true,
    value,
  };
}
