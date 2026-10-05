/**
 * Field Generation - Generative Field Creation
 * Part of the Field Genesis Triad for Sofia Core
 * 
 * Generates new field structures from the origin-state.
 * Accepts origin states, applies generative logic,
 * and produces a generated field state.
 * Represents "the field begins a new cycle of formation".
 * This is the system's generative-creation layer.
 */

/**
 * Generation state representing new field formation
 */
export type GenerationState<T> = {
  generated: boolean;
  value: T;
};

/**
 * Generate new field state from origin using generator logic
 * Applies generative logic and produces generated state
 * 
 * @param origin - Origin state to generate new structures from
 * @param generator - Function that generates new field structures
 * @returns Generation state with generated=true and generated value
 */
export function generateFieldState<T>(
  origin: T,
  generator: (value: T) => T
): GenerationState<T> {
  const value = generator(origin);
  return {
    generated: true,
    value,
  };
}
