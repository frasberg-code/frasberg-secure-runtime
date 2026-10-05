/**
 * Field Commitment - Decision Finalization
 * Part of the Field Decision Triad for Sofia Core
 * 
 * Locks in a chosen direction.
 * Accepts a resolved decision, applies commitment logic, and produces
 * a stable, actionable commitment. This is the field's decision-finalization layer.
 */

/**
 * Field commitment state representing a finalized decision
 */
export type FieldCommitmentState<T> = {
  decided: boolean;
  value: T | null;
};

/**
 * Commit field decision to finalized state
 * Locks in decision and marks as committed
 * 
 * @param decision - Decision to commit
 * @returns Committed state with decided=true
 */
export function commitFieldDecision<T>(decision: T): FieldCommitmentState<T> {
  return {
    decided: true,
    value: decision,
  };
}
