/**
 * Field Transformation - Deep Field Transformation
 * Part of the Field Transformation Triad for Sofia Core
 * 
 * Applies transformative logic to the influenced/shifted field.
 * Accepts shifted or modulated field states, applies transformation rules,
 * and produces a transformed field configuration.
 * This is the system's deep-change layer.
 */

/**
 * Transformation state representing deep field transformation
 */
export type TransformationState<T> = {
  transformed: boolean;
  value: T;
};

/**
 * Transform field state deeply
 * Applies transformation logic and produces transformed state
 * 
 * @param shifted - Shifted state to transform from
 * @param transformer - Function that transforms shifted state into transformed state
 * @returns Transformation state with transformed=true and transformed value
 */
export function transformFieldState<T>(
  shifted: T,
  transformer: (value: T) => T
): TransformationState<T> {
  const value = transformer(shifted);
  return {
    transformed: true,
    value,
  };
}
