/**
 * Field Intent - Proto-Intent Generation
 * Part of the Field Cognition Triad for Sofia Core
 * 
 * Generates proto-intent from evaluations.
 * Converts evaluations into directional tendencies, produces intent-like
 * signals, and prepares the system for higher-order decision layers.
 * This is the field's pre-decision layer.
 */

/**
 * Generate intent based on evaluation score
 * Produces directional intent signal from evaluation
 * 
 * @param evaluation - Evaluation score to convert to intent
 * @returns Intent signal with direction and weight
 */
export function generateIntent(
  evaluation: number
): { intent: 'advance' | 'retreat' | 'hold'; weight: number } {
  if (evaluation > 0.5) return { intent: 'advance', weight: evaluation };
  if (evaluation < -0.5) return { intent: 'retreat', weight: Math.abs(evaluation) };
  return { intent: 'hold', weight: Math.abs(evaluation) };
}
