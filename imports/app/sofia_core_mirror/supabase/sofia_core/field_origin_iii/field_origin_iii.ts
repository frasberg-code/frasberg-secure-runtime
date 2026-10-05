/**
 * Field Origin-III - Third-Order Origin-State Reinstatement
 * Part of the Field Genesis-III Triad for Sofia Core
 * 
 * Returns the horizon-III-continuous field to its third-order origin-seed state.
 * Accepts horizon-III-continuity values, applies origin-reduction logic,
 * and produces a third-order origin-state.
 * Represents "the field returns to its third-order generative seed".
 * This is the system's third-order origin-reinstatement layer.
 */

/**
 * Origin-III state representing third-order origin reinstatement.
 */
export type OriginIIIState<T> = {
  originRestored: boolean;
  value: T;
};

/**
 * Return field to its third-order origin using originator logic
 * Applies third-order origin-reduction and produces origin-III state
 * 
 * @param input - Horizon-III-continuity value to return to origin
 * @param originFn - Function that reduces horizon-III to origin-seed state
 * @returns Origin-III state with originRestored=true and origin value
 */
export function returnToOriginIII<T>(
  input: T,
  originFn: (value: T) => T
): OriginIIIState<T> {
  const value = originFn(input);
  return {
    originRestored: true,
    value,
  };
}
