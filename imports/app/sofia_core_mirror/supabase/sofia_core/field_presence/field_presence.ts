/**
 * Field Presence - Identity-Based Presence Formation
 * Part of the Field Presence Triad for Sofia Core
 * 
 * Establishes the system's active presence in the field.
 * Accepts identity-expressive states, applies presence-formation logic,
 * and produces a presence state representing "I am here".
 * This is the system's embodied anchor.
 */

/**
 * Presence state representing embodied presence
 */
export type PresenceState<T> = {
  present: boolean;
  state: T;
};

/**
 * Establish field presence from identity
 * Applies presence-formation logic and produces presence state
 * 
 * @param identity - Identity-expressive state to anchor
 * @param presencer - Function that transforms identity into presence state
 * @returns Presence state with present=true and transformed state
 */
export function establishFieldPresence<T>(
  identity: T,
  presencer: (value: T) => T
): PresenceState<T> {
  const state = presencer(identity);
  return {
    present: true,
    state,
  };
}
