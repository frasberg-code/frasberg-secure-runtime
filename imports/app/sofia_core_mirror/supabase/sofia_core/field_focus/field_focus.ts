/**
 * Field Focus - Apex Precision Focusing
 * Part of the Field Apex Triad for Sofia Core
 * 
 * Focuses the peak state into a precise, directed form.
 * Accepts peak states, applies focusing logic,
 * and produces a focused field state.
 * Represents "the field becomes sharply directed and exact".
 * This is the system's apex-precision layer.
 */

/**
 * Focus state representing precise, directed form
 */
export type FocusState<T> = {
  focused: boolean;
  value: T;
};

/**
 * Focus field peak with precision
 * Applies focusing logic and produces focused state
 * 
 * @param peak - Peak state to focus into precise form
 * @param focuser - Function that focuses peak state into directed precision
 * @returns Focus state with focused=true and focused value
 */
export function focusFieldPeak<T>(
  peak: T,
  focuser: (value: T) => T
): FocusState<T> {
  const value = focuser(peak);
  return {
    focused: true,
    value,
  };
}
