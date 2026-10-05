/**
 * Resonance Conductor - Unified Resonance Computation
 * Part of the Integrative Resonance Triad for Sofia Core
 * 
 * Unifies outputs from multiple engines into a single resonant expression.
 * Coordinates and harmonizes signals from heterogeneous inputs.
 */

/**
 * Conduct resonance across multiple signals
 * Unifies multiple engine outputs into a harmonized composite
 * 
 * @param signals - Array of signals to conduct into resonance
 * @param strategy - Resonance strategy ('average', 'first', or 'last')
 * @returns Harmonized composite signal or null if no valid signals
 */
export function conductResonance(
  signals: Array<unknown>,
  strategy: 'average' | 'first' | 'last'
): unknown {
  if (signals.length === 0) return null;

  switch (strategy) {
    case 'first':
      return signals[0];
    case 'last':
      return signals[signals.length - 1];
    case 'average':
    default:
      const numeric = signals.filter((x): x is number => typeof x === 'number');
      if (numeric.length === 0) return null;
      return numeric.reduce((a, b) => a + b, 0) / numeric.length;
  }
}
