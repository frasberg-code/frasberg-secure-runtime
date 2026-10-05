/**
 * Field Projection - Presence-Based Outward Projection
 * Part of the Field Presence Triad for Sofia Core
 * 
 * Projects presence outward into the environment.
 * Accepts resonance states, applies projection logic, and produces
 * a projected presence signal. This is the system's outward presence-expression.
 * 
 * Note: This is distinct from the earlier action-projection module (field_projection)
 * — this one is identity-presence-based.
 */

/**
 * Presence projection representing outward presence signal
 */
export type PresenceProjection<T> = {
  projected: boolean;
  signal: T;
};

/**
 * Project field presence into environment
 * Applies projection logic and produces outward presence signal
 * 
 * @param resonance - Resonance state to project
 * @param projector - Function that transforms resonance into projection signal
 * @returns Presence projection with projected=true and signal
 */
export function projectFieldPresence<T>(
  resonance: T,
  projector: (value: T) => T
): PresenceProjection<T> {
  const signal = projector(resonance);
  return {
    projected: true,
    signal,
  };
}
