/**
 * Field Origin - Origin-State Reinstatement
 * Part of the Field Genesis Triad for Sofia Core
 * 
 * Returns the horizon-continuous field to its origin-seed state.
 * Accepts horizon-continuity values, applies origin-reduction logic,
 * and produces an origin-state.
 * Represents "the field returns to its generative seed".
 * This is the system's origin-reinstatement layer.
 */

/**
 * Origin state representing return to generative seed
 */
export type OriginState<T> = {
  origin: boolean;
  value: T;
};

/**
 * Return field to origin using originator logic
 * Applies origin-reduction and produces origin state
 * 
 * @param horizon - Horizon-continuity value to return to origin
 * @param originator - Function that reduces horizon to origin-seed state
 * @returns Origin state with origin=true and origin value
 */
export function returnToOrigin<T>(
  horizon: T,
  originator: (value: T) => T
): OriginState<T> {
  const value = originator(horizon);
  return {
    origin: true,
    value,
  };
}
