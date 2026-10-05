/**
 * Hinge Logic - State Transitions and Pivots
 * Part of the Sofia Core hinge logic system
 * 
 * Provides pivot mechanics, state transition orchestration,
 * identity-state shift modeling, and integration with membrane
 * and governance layers.
 */

export type TransitionState<T> = {
  from: T;
  to: T;
  inTransition: boolean;
  progress: number;
};

/**
 * Hinge Logic Engine
 */
export const hingeLogic = {
  /**
   * Initialize a transition
   */
  initializeTransition<T>(from: T, to: T): TransitionState<T> {
    return {
      from,
      to,
      inTransition: true,
      progress: 0
    };
  },

  /**
   * Execute a pivot between states
   */
  pivot<T>(transition: TransitionState<T>, step: number): TransitionState<T> {
    const newProgress = Math.min(1.0, transition.progress + step);
    
    return {
      ...transition,
      progress: newProgress,
      inTransition: newProgress < 1.0
    };
  },

  /**
   * Check if transition is complete
   */
  isComplete<T>(transition: TransitionState<T>): boolean {
    return !transition.inTransition && transition.progress >= 1.0;
  },

  /**
   * Get current state during transition
   */
  getCurrentState<T>(transition: TransitionState<T>): T {
    return transition.inTransition ? transition.from : transition.to;
  }
};
