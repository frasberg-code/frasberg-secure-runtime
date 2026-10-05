/**
 * Continuum Filter - Refined State Gating
 * Part of the Bridge Triad for Sofia Core
 * 
 * Provides refined state gating to control continuity flow
 * and ensure stable state transitions across the system.
 */

export interface ContinuumState {
  continuity: number;
  stability: number;
  gateOpen: boolean;
}

export interface GateInput {
  state: ContinuumState;
  threshold: number;
}

export interface GateResult {
  allowed: boolean;
  continuity: number;
  reason: string;
}

export interface FilterStats {
  totalGates: number;
  allowedCount: number;
  deniedCount: number;
  averageContinuity: number;
}

export const continuumFilter = {
  /**
   * Initialize a new continuum state
   */
  initialize(): ContinuumState {
    return {
      continuity: 1.0,
      stability: 1.0,
      gateOpen: true
    };
  },

  /**
   * Gate state transitions based on continuity threshold
   */
  gate(input: GateInput): GateResult {
    const { state, threshold } = input;
    
    // Check if continuity meets threshold
    const allowed = state.continuity >= threshold && state.gateOpen;
    
    let reason = '';
    if (!state.gateOpen) {
      reason = 'gate_closed';
    } else if (state.continuity < threshold) {
      reason = 'low_continuity';
    } else {
      reason = 'passed';
    }

    return {
      allowed,
      continuity: state.continuity,
      reason
    };
  },

  /**
   * Refine state by adjusting continuity and stability
   */
  refine(state: ContinuumState, adjustment: number): ContinuumState {
    const newContinuity = Math.max(0, Math.min(1, state.continuity + adjustment));
    const newStability = Math.max(0, Math.min(1, state.stability + adjustment * 0.5));

    return {
      ...state,
      continuity: newContinuity,
      stability: newStability
    };
  },

  /**
   * Open or close the gate
   */
  setGate(state: ContinuumState, open: boolean): ContinuumState {
    return {
      ...state,
      gateOpen: open
    };
  },

  /**
   * Check if state is stable
   */
  isStable(state: ContinuumState, stabilityThreshold: number = 0.8): boolean {
    return state.stability >= stabilityThreshold;
  },

  /**
   * Merge two continuum states
   */
  merge(state1: ContinuumState, state2: ContinuumState): ContinuumState {
    return {
      continuity: (state1.continuity + state2.continuity) / 2,
      stability: (state1.stability + state2.stability) / 2,
      gateOpen: state1.gateOpen && state2.gateOpen
    };
  }
};
