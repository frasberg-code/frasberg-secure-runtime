/**
 * Field Pulse - Rhythmic Field Activation
 * Part of the Field Dynamics Triad for Sofia Core
 * 
 * Introduces rhythmic, periodic activation within the field.
 * Generates pulses at defined intervals with modulated intensity
 * to create heartbeat-like field activity.
 */

/**
 * Generate rhythmic pulses with defined intensity
 * Creates heartbeat-like field activity
 * 
 * @param intensity - Pulse intensity value
 * @param interval - Number of pulses to generate
 * @returns Array of pulse values
 */
export function generatePulse(
  intensity: number,
  interval: number
): Array<number> {
  return new Array(interval).fill(intensity);
}
