/**
 * Field Stability - Long-Arc Field Stability
 * Part of the Field Integration Triad for Sofia Core
 * 
 * Integrates multi-cycle field activity into coherent, long-arc patterns.
 * Computes field stability over extended time periods to ensure consistent
 * and reliable field behavior across multiple cycles.
 */

/**
 * Stability report containing stability status and baseline reference
 */
export type StabilityReport<T> = {
  stable: boolean;
  baseline: T;
};

/**
 * Compute field stability over multiple values
 * 
 * @param values - Array of field values to evaluate for stability
 * @param evaluator - Function that determines if values are stable
 * @param baseline - Baseline reference value for stability computation
 * @returns Stability report with boolean status and baseline
 */
export function computeFieldStability<T>(
  values: Array<T>,
  evaluator: (values: Array<T>) => boolean,
  baseline: T
): StabilityReport<T> {
  const stable = evaluator(values);
  return { stable, baseline };
}
