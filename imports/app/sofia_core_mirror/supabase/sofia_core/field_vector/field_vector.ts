/**
 * Field Vector - Magnitude and Direction Computation
 * Part of the Field Dynamics Triad for Sofia Core
 * 
 * Defines magnitude and direction for field behavior.
 * Computes vector outputs combining amplitude, direction, and momentum
 * to produce dynamic field vectors for navigational logic.
 */

/**
 * Compute vector components from magnitude and direction
 * Produces dynamic field vector with x and y components
 * 
 * @param magnitude - Vector magnitude (amplitude)
 * @param direction - Direction in radians
 * @returns Vector with x and y components
 */
export function computeVector(
  magnitude: number,
  direction: number
): { x: number; y: number } {
  return {
    x: magnitude * Math.cos(direction),
    y: magnitude * Math.sin(direction),
  };
}
