/**
 * Field Flow - Directional Field Movement
 * Part of the Field Dynamics Triad for Sofia Core
 * 
 * Introduces directional movement across the stabilized field.
 * Applies flow in forward, backward, or lateral directions
 * to produce a shifted field state.
 */

/**
 * Apply directional flow to a field state
 * Produces a shifted field state based on direction
 * 
 * @param state - Numeric state to apply flow to
 * @param direction - Flow direction ('forward', 'backward', or 'lateral')
 * @returns Shifted field state
 */
export function applyFlow(
  state: number,
  direction: 'forward' | 'backward' | 'lateral'
): number {
  switch (direction) {
    case 'forward':
      return state + 1;
    case 'backward':
      return state - 1;
    case 'lateral':
    default:
      return state;
  }
}
