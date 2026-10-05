/**
 * Field Peak - Apex Peak Formation
 * Part of the Field Apex Triad for Sofia Core
 * 
 * Concentrates refined ascending states into a peak configuration.
 * Accepts refined or ascending values, applies peak-formation logic,
 * and produces a peak field state.
 * Represents "the field reaches maximum coherence and intensity".
 * This is the system's apex-formation layer.
 */

/**
 * Peak state representing maximum coherence and intensity
 */
export type PeakState<T> = {
  peaked: boolean;
  value: T;
};

/**
 * Form field peak with maximum coherence
 * Applies peak-formation logic and produces peak state
 * 
 * @param refined - Refined or ascending state to concentrate into peak
 * @param peaker - Function that concentrates refined state into peak configuration
 * @returns Peak state with peaked=true and peak value
 */
export function formFieldPeak<T>(
  refined: T,
  peaker: (value: T) => T
): PeakState<T> {
  const value = peaker(refined);
  return {
    peaked: true,
    value,
  };
}
