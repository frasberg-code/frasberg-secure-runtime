/**
 * Field Wave - Oscillatory Field Stabilization
 * Part of the Field Stabilization Triad for Sofia Core
 * 
 * Generates oscillatory field patterns.
 * Produces amplitude-based waveforms with frequency-driven
 * oscillation for dynamic field behavior.
 */

/**
 * Generate oscillatory wave pattern
 * Creates one complete sine wave cycle with the specified number of samples
 * 
 * @param amplitude - Wave amplitude (peak value)
 * @param frequency - Number of samples in one complete wave cycle
 * @returns Array of wave values forming one complete sine wave
 */
export function generateWave(
  amplitude: number,
  frequency: number
): Array<number> {
  const wave = [];
  for (let i = 0; i < frequency; i++) {
    wave.push(Math.sin((i * 2 * Math.PI) / frequency) * amplitude);
  }
  return wave;
}
