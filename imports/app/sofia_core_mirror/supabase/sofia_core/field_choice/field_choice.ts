/**
 * Field Choice - Option Selection
 * Part of the Field Decision Triad for Sofia Core
 * 
 * Selects between multiple interpreted options.
 * Accepts evaluated states, applies a choice rule, and produces
 * a selected option. This is the field's selection mechanism.
 */

/**
 * Choose field option from candidates using selector function
 * Applies selection logic to determine final choice
 * 
 * @param options - Array of available options
 * @param selector - Selection function to apply
 * @returns Selected option
 */
export function chooseFieldOption<T>(
  options: Array<T>,
  selector: (candidates: Array<T>) => T
): T {
  if (options.length === 0) {
    throw new Error('No options available for choice');
  }
  return selector(options);
}
