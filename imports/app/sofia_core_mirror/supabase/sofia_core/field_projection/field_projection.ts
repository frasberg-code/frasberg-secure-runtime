/**
 * Field Projection - Action Projection
 * Part of the Field Action Triad for Sofia Core
 * 
 * Projects the executed action into the environment.
 * Takes an action output, applies projection logic, and produces
 * an externalized effect. This is the field's outward expression layer.
 */

/**
 * Projection event representing the externalized effect
 */
export type ProjectionEvent<T> = {
  projected: boolean;
  payload: T;
};

/**
 * Project field action into environment
 * Applies projection logic and produces externalized effect
 * 
 * @param action - Action output to project
 * @param projector - Function that transforms action into externalized payload
 * @returns Projection event with projected=true and payload
 */
export function projectFieldAction<T>(
  action: T,
  projector: (value: T) => T
): ProjectionEvent<T> {
  const payload = projector(action);
  return {
    projected: true,
    payload,
  };
}
