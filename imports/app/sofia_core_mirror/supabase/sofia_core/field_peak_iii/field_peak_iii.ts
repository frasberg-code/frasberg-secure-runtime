/**
 * Field Peak III - Third-Order Apex Peak Formation
 * Part of the Field Apex-III Triad for Sofia Core
 * 
 * Forms the third-order peak from dominion-III states.
 * Accepts third-order dominion states, applies peak-formation logic,
 * and produces a third-order peak field state.
 * Represents "the third-order field reaches maximum coherence and intensity".
 * This is the system's third-order apex-formation layer.
 */

/**
 * Third-order peak state representing maximum coherence and intensity
 */
export type FieldPeakIIIState<T> = {
  peaked: boolean;
  value: T;
};

/**
 * Form third-order field peak with maximum coherence
 * Applies peak-formation logic and produces third-order peak state
 * 
 * @param dominionIII - Third-order dominion state to concentrate into peak
 * @param peakFn - Function that concentrates dominion-III state into peak configuration
 * @returns Third-order peak state with peaked=true and peak value
 */
export function formFieldPeakIII<T>(
  dominionIII: T,
  peakFn: (value: T) => T
): FieldPeakIIIState<T> {
  const value = peakFn(dominionIII);
  return {
    peaked: true,
    value,
  };
}
