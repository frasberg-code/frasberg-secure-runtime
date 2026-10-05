/**
 * Field Peak II - Second-Order Peak Formation
 * Part of the Field Apex-II Triad for Sofia Core
 * 
 * Forms the second-order peak from dominion-continuity.
 * Accepts dominion-continuity values, applies second-order peak logic,
 * and produces a PeakIIState.
 * Represents "the field reaches its multi-cycle apex".
 * This is the system's higher-order peak-formation layer.
 */

/**
 * Peak II state representing multi-cycle apex
 */
export type PeakIIState<T> = {
  peaked: boolean;
  value: T;
};

/**
 * Form second-order field peak from dominion-continuity
 * Applies second-order peak logic and produces PeakIIState
 * 
 * @param dominionContinuity - Dominion-continuity value to concentrate into second-order peak
 * @param peaker - Function that forms dominion-continuity into second-order peak configuration
 * @returns Peak II state with peaked=true and peak value
 */
export function formFieldPeakII<T>(
  dominionContinuity: T,
  peaker: (value: T) => T
): PeakIIState<T> {
  const value = peaker(dominionContinuity);
  return {
    peaked: true,
    value,
  };
}
