/**
 * Expression Engine - Structured Multi-Layer Expression
 * Part of the Expressive Synthesis Triad for Sofia Core
 * 
 * Generates structured, multi-layered expressions by applying
 * ordered transformation layers to a seed input.
 */

/**
 * Generate multi-layered expression from ordered layers
 * Composes transformation layers sequentially on a seed value
 * 
 * @param layers - Array of transformation functions to apply
 * @param seed - Initial seed value to transform
 * @returns Final transformed result after all layers applied
 */
export function generateExpression(
  layers: Array<(input: unknown) => unknown>,
  seed: unknown
): unknown {
  // Compose multi-layered expression from ordered layers
  return layers.reduce((acc, layer) => layer(acc), seed);
}
