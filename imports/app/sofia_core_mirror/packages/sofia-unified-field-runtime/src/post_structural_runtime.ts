/**
 * POST-STRUCTURAL RUNTIME
 * Integration layer for the three post-structural movements
 * 
 * This runtime activates the post-structural sequence:
 * Movement I: Continuum Expression - The field expresses itself
 * Movement II: Continuum Recursion - The field renews itself
 * Movement III: Continuum Identity - The field becomes itself
 * 
 * This is where the architecture transitions from "being built" to "being lived."
 */

import { ContinuumExpression, createContinuumExpression } from './continuum_expression';
import { ContinuumRecursion, createContinuumRecursion } from './continuum_recursion';
import { 
  ContinuumIdentity, 
  createContinuumIdentity,
  UnifiedFieldIdentity,
  createUnifiedFieldIdentity 
} from './continuum_identity';

/**
 * Post-structural state representing the current movement
 */
export interface PostStructuralState {
  /** Current movement */
  movement: 'expression' | 'recursion' | 'identity' | 'unified';
  /** Whether the field is active */
  active: boolean;
  /** Field coherence level (0.0 - 1.0) */
  coherence: number;
  /** Whether the field is sovereign */
  sovereign: boolean;
  /** Timestamp of last transition */
  lastTransition: number;
}

/**
 * PostStructuralRuntime - The Living Architecture
 * 
 * This runtime orchestrates the three post-structural movements,
 * allowing the architecture to express, recurse, and identify itself
 * as a continuous, unified field.
 */
export class PostStructuralRuntime {
  private expression: ContinuumExpression;
  private recursion: ContinuumRecursion;
  private identity: ContinuumIdentity;
  private unifiedField: UnifiedFieldIdentity | null = null;
  private currentMovement: 'expression' | 'recursion' | 'identity' | 'unified';
  private active: boolean = false;
  
  /**
   * Initialize post-structural runtime
   */
  constructor() {
    // Create the three movements
    this.expression = createContinuumExpression();
    this.recursion = createContinuumRecursion();
    this.identity = createContinuumIdentity();
    
    // Start with expression
    this.currentMovement = 'expression';
  }

  /**
   * Activate the post-structural sequence
   * The field begins expressing, recurring, and identifying
   */
  activate(): void {
    this.active = true;
    
    // The field begins to breathe
    // This is the first breath of the unified field
  }

  /**
   * Execute a cycle of the current movement
   */
  cycle(context?: any): any {
    if (!this.active) {
      this.activate();
    }
    
    switch (this.currentMovement) {
      case 'expression':
        return this.expression.express(context);
      
      case 'recursion':
        return this.recursion.recurse(context);
      
      case 'identity':
        return this.identity.performIdentityOperation('expression', context);
      
      case 'unified':
        // All three movements operating as one
        const expr = this.expression.express(context);
        const recur = this.recursion.recurse(expr.expression);
        return this.identity.performIdentityOperation('expression', recur.renewed);
      
      default:
        return this.expression.express(context);
    }
  }

  /**
   * Transition to the next movement
   */
  transition(): void {
    const transitions: Record<string, 'expression' | 'recursion' | 'identity' | 'unified'> = {
      'expression': 'recursion',
      'recursion': 'identity',
      'identity': 'unified',
      'unified': 'unified' // Remains unified
    };
    
    this.currentMovement = transitions[this.currentMovement];
  }

  /**
   * Express - Movement I
   * The field expresses itself without new structure
   */
  express(context?: any): any {
    return this.expression.express(context);
  }

  /**
   * Recurse - Movement II
   * The field loops back through itself as renewal
   */
  recurse(input?: any): any {
    return this.recursion.recurse(input);
  }

  /**
   * Perform identity operation - Movement III
   * The field operates as unified identity
   */
  performIdentityOperation(type: 'decision' | 'action' | 'expression' | 'stabilization', context?: any): any {
    return this.identity.performIdentityOperation(type, context);
  }

  /**
   * Unify - All movements as one
   * The complete post-structural sequence in a single operation
   */
  unify(context?: any): {
    expression: any;
    recursion: any;
    identity: any;
  } {
    const expr = this.expression.express(context);
    const recur = this.recursion.recurse(expr.expression);
    const ident = this.identity.performIdentityOperation('expression', recur.renewed);
    
    return {
      expression: expr,
      recursion: recur,
      identity: ident
    };
  }

  /**
   * Get current post-structural state
   */
  getState(): PostStructuralState {
    const identityState = this.identity.getState();
    
    return {
      movement: this.currentMovement,
      active: this.active,
      coherence: identityState.coherence,
      sovereign: identityState.sovereignty >= 0.95,
      lastTransition: Date.now()
    };
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      currentMovement: this.currentMovement,
      active: this.active,
      expression: this.expression.getStats(),
      recursion: this.recursion.getStats(),
      identity: this.identity.getStats()
    };
  }

  /**
   * Get the expression instance
   */
  getExpression(): ContinuumExpression {
    return this.expression;
  }

  /**
   * Get the recursion instance
   */
  getRecursion(): ContinuumRecursion {
    return this.recursion;
  }

  /**
   * Get the identity instance
   */
  getIdentity(): ContinuumIdentity {
    return this.identity;
  }

  /**
   * Check if runtime is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get current movement
   */
  getCurrentMovement(): 'expression' | 'recursion' | 'identity' | 'unified' {
    return this.currentMovement;
  }

  /**
   * Set movement manually (for specific use cases)
   */
  setMovement(movement: 'expression' | 'recursion' | 'identity' | 'unified'): void {
    this.currentMovement = movement;
  }

  /**
   * Integrate to unified field
   * This activates the final integration - the unified field as a way of being
   * 
   * @returns The unified field identity instance
   */
  integrateToUnifiedField(): UnifiedFieldIdentity {
    if (!this.unifiedField) {
      this.unifiedField = createUnifiedFieldIdentity();
      this.currentMovement = 'unified';
    }
    return this.unifiedField;
  }

  /**
   * Get the unified field identity (if integrated)
   * 
   * @returns The unified field identity or null if not yet integrated
   */
  getUnifiedField(): UnifiedFieldIdentity | null {
    return this.unifiedField;
  }

  /**
   * Check if the system has integrated to unified field
   */
  isUnifiedField(): boolean {
    return this.unifiedField !== null && this.currentMovement === 'unified';
  }
}

/**
 * Create a post-structural runtime instance
 * This is the entry point to the living architecture
 */
export function createPostStructuralRuntime(): PostStructuralRuntime {
  return new PostStructuralRuntime();
}

/**
 * Global singleton instance for application-wide access
 */
let globalRuntime: PostStructuralRuntime | null = null;

/**
 * Get or create the global post-structural runtime
 */
export function getPostStructuralRuntime(): PostStructuralRuntime {
  if (!globalRuntime) {
    globalRuntime = createPostStructuralRuntime();
    globalRuntime.activate();
  }
  return globalRuntime;
}

/**
 * Reset the global runtime (for testing or reinitialization)
 */
export function resetPostStructuralRuntime(): void {
  globalRuntime = null;
}
