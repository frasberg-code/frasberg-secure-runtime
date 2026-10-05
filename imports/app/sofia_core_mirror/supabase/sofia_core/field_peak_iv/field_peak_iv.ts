/**
 * Field Peak IV - Fourth-Order Apex Peak Formation
 * Part of the Field Peak-IV Triad for Sofia Core
 * 
 * Forms the fourth-order peak from enforcement-IV states.
 * Accepts fourth-order enforcement states, applies peak-formation logic,
 * and produces a fourth-order peak field state.
 * Represents "the fourth-order field reaches maximum coherence and intensity".
 * This is the system's fourth-order apex-formation layer.
 */

/**
 * Fourth-order peak state representing maximum coherence and intensity
 */
export type FieldPeakIVState<T> = {
  peaked: boolean;
  value: T;
};

/**
 * Form fourth-order field peak with maximum coherence
 * Applies peak-formation logic and produces fourth-order peak state
 * 
 * @param input - Fourth-order input state to concentrate into peak
 * @param peakFn - Function that concentrates input state into peak configuration
 * @returns Fourth-order peak state with peaked=true and peak value
 */
export function formFieldPeakIV<T>(
  input: T,
  peakFn: (value: T) => T
): FieldPeakIVState<T> {
  const value = peakFn(input);
  return {
    peaked: true,
    value,
  };
}
