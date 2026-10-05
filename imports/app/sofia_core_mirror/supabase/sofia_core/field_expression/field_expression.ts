/**
 * Field Expression - Identity-Based Expression
 * Part of the Field Identity Triad for Sofia Core
 * 
 * Expresses identity outward into behavior.
 * This is the system's "I act as myself" layer.
 */

/**
 * Represents expression state with output
 * 
 * @template T - The type of expression output
 */
export type ExpressionState<T> = {
  expressed: boolean;
  output: T;
};

/**
 * Express field identity into behavior
 * 
 * @param identity - The identity to express
 * @param expressor - Function that transforms identity into expression
 * @returns ExpressionState containing expression status and output
 */
export function expressFieldIdentity<T>(
  identity: T,
  expressor: (value: T) => T
): ExpressionState<T> {
  const output = expressor(identity);
  return {
    expressed: true,
    output,
  };
}
