/**
 * Field Execution - Decision Execution
 * Part of the Field Action Triad for Sofia Core
 * 
 * Executes the committed decision.
 * Accepts a committed state, applies an execution rule, and produces
 * an action output. This is the field's execution engine.
 */

/**
 * Execution result representing the output of decision execution
 */
export type ExecutionResult<T> = {
  executed: boolean;
  output: T;
};

/**
 * Execute field decision using executor function
 * Applies execution logic and produces action output
 * 
 * @param decision - Committed decision to execute
 * @param executor - Function that transforms decision into action output
 * @returns Execution result with executed=true and action output
 */
export function executeFieldDecision<T>(
  decision: T,
  executor: (value: T) => T
): ExecutionResult<T> {
  const output = executor(decision);
  return {
    executed: true,
    output,
  };
}
