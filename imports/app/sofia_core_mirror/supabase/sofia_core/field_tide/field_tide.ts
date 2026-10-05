/**
 * Field Tide - Rhythmic Field Modulation
 * Part of the Field Stabilization Triad for Sofia Core
 * 
 * Applies rhythmic, directional modulation to the field.
 * Supports rising and falling phases for controlled,
 * incremental field adjustments.
 */

/**
 * Apply tide modulation to a field value
 * Supports rising and falling phases
 * 
 * @param value - Numeric value to modulate
 * @param phase - Direction of tide ('rise' or 'fall')
 * @returns Modulated value
 */
export function applyTide(
  value: number,
  phase: 'rise' | 'fall'
): number {
  return phase === 'rise' ? value + 1 : value - 1;
}
