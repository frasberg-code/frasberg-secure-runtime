/**
 * Field Feedback - Action Feedback Capture
 * Part of the Field Action Triad for Sofia Core
 * 
 * Captures the environment's response to the action.
 * Accepts projected effects, converts them into feedback signals,
 * and returns data for the next cognition cycle. This is the field's
 * action-feedback loop.
 */

/**
 * Feedback signal representing environment response
 */
export type FeedbackSignal<T> = {
  received: boolean;
  signal: T;
};

/**
 * Capture field feedback from environment
 * Translates environment response into feedback signal
 * 
 * @param effect - Projected effect to capture feedback from
 * @param translator - Function that transforms effect into feedback signal
 * @returns Feedback signal with received=true and translated signal
 */
export function captureFieldFeedback<T>(
  effect: T,
  translator: (value: T) => T
): FeedbackSignal<T> {
  const signal = translator(effect);
  return {
    received: true,
    signal,
  };
}
