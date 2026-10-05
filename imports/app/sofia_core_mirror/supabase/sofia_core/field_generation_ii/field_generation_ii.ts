/**
 * Field Generation-II - Second-Order Generative Field Creation
 * Part of the Field Genesis-II Triad for Sofia Core
 * 
 * Generates new field structures from the origin-II-state.
 * Accepts origin-II states, applies generative logic,
 * and produces a second-order generated field state.
 * Represents "the field begins a new cycle of second-order formation".
 * This is the system's second-order generative-creation layer.
 */

/**
 * Generation-II state representing second-order generative output.
 */
export type GenerationIIState<T> = {
  generated: boolean;
  value: T;
};

/**
 * Generate new second-order field state from origin-II using generator logic
 * Applies second-order generative logic and produces generated state
 * 
 * @param originII - Origin-II state to generate new structures from
 * @param generator - Function that generates new second-order field structures
 * @returns Generation-II state with generated=true and generated value
 */
export function generateFieldStateII<T>(
  originII: T,
  generator: (value: T) => T
): GenerationIIState<T> {
  const value = generator(originII);
  return {
    generated: true,
    value,
  };
}
