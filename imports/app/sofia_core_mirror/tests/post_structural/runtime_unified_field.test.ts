/**
 * Tests for PostStructuralRuntime integration with UnifiedFieldIdentity
 */

import {
  PostStructuralRuntime,
  createPostStructuralRuntime,
  getPostStructuralRuntime,
  resetPostStructuralRuntime
} from '../../supabase/sofia_core/post_structural';

describe('PostStructuralRuntime - Unified Field Integration', () => {
  let runtime: PostStructuralRuntime;

  beforeEach(() => {
    resetPostStructuralRuntime();
    runtime = createPostStructuralRuntime();
  });

  afterEach(() => {
    resetPostStructuralRuntime();
  });

  describe('Unified Field Access', () => {
    test('can integrate to unified field', () => {
      const unifiedField = runtime.integrateToUnifiedField();
      
      expect(unifiedField).toBeDefined();
      expect(runtime.isUnifiedField()).toBe(true);
    });

    test('returns same unified field instance on repeated calls', () => {
      const field1 = runtime.integrateToUnifiedField();
      const field2 = runtime.integrateToUnifiedField();
      
      expect(field1).toBe(field2);
    });

    test('getUnifiedField returns null before integration', () => {
      expect(runtime.getUnifiedField()).toBeNull();
      expect(runtime.isUnifiedField()).toBe(false);
    });

    test('getUnifiedField returns instance after integration', () => {
      runtime.integrateToUnifiedField();
      
      const field = runtime.getUnifiedField();
      expect(field).not.toBeNull();
      expect(runtime.isUnifiedField()).toBe(true);
    });

    test('sets movement to unified when integrating', () => {
      runtime.integrateToUnifiedField();
      
      expect(runtime.getCurrentMovement()).toBe('unified');
    });
  });

  describe('Unified Field Operations', () => {
    test('unified field has all integration capabilities', () => {
      const unifiedField = runtime.integrateToUnifiedField();
      
      // Test core aspects
      const continuous = unifiedField.operateAsContinuousField();
      expect(continuous.unified).toBe(true);
      
      const simultaneous = unifiedField.simultaneousGesture();
      expect(simultaneous.singleGesture).toBe(true);
      
      const energy = unifiedField.modulateEnergy('opportunity');
      expect(energy.unified).toBe(true);
      
      // Test operational expressions
      const action = unifiedField.nextAction();
      expect(action.actionIsArchitecture).toBe(true);
      
      const momentum = unifiedField.generateIntrinsicMomentum();
      expect(momentum.youAreMomentum).toBe(true);
    });

    test('unified field is fully integrated', () => {
      const unifiedField = runtime.integrateToUnifiedField();
      
      expect(unifiedField.isFullyIntegrated()).toBe(true);
    });
  });

  describe('Global Runtime Integration', () => {
    test('global runtime can access unified field', () => {
      const globalRuntime = getPostStructuralRuntime();
      const unifiedField = globalRuntime.integrateToUnifiedField();
      
      expect(unifiedField).toBeDefined();
      expect(globalRuntime.isUnifiedField()).toBe(true);
    });

    test('global runtime maintains unified field across calls', () => {
      const runtime1 = getPostStructuralRuntime();
      runtime1.integrateToUnifiedField();
      
      const runtime2 = getPostStructuralRuntime();
      expect(runtime2.isUnifiedField()).toBe(true);
      
      const field = runtime2.getUnifiedField();
      expect(field).not.toBeNull();
    });

    test('reset clears unified field', () => {
      const runtime1 = getPostStructuralRuntime();
      runtime1.integrateToUnifiedField();
      expect(runtime1.isUnifiedField()).toBe(true);
      
      resetPostStructuralRuntime();
      
      const runtime2 = getPostStructuralRuntime();
      expect(runtime2.isUnifiedField()).toBe(false);
    });
  });

  describe('Movement Progression with Unified Field', () => {
    test('can transition through movements to unified', () => {
      runtime.activate();
      
      // Start at expression
      expect(runtime.getCurrentMovement()).toBe('expression');
      
      // Transition to recursion
      runtime.transition();
      expect(runtime.getCurrentMovement()).toBe('recursion');
      
      // Transition to identity
      runtime.transition();
      expect(runtime.getCurrentMovement()).toBe('identity');
      
      // Transition to unified
      runtime.transition();
      expect(runtime.getCurrentMovement()).toBe('unified');
      
      // Should stay at unified
      runtime.transition();
      expect(runtime.getCurrentMovement()).toBe('unified');
    });

    test('can directly set movement to unified', () => {
      runtime.setMovement('unified');
      expect(runtime.getCurrentMovement()).toBe('unified');
    });

    test('integration sets movement to unified', () => {
      runtime.setMovement('expression');
      expect(runtime.getCurrentMovement()).toBe('expression');
      
      runtime.integrateToUnifiedField();
      expect(runtime.getCurrentMovement()).toBe('unified');
    });
  });

  describe('Complete Runtime Flow', () => {
    test('demonstrates full progression to unified field', () => {
      // 1. Create and activate runtime
      const rt = createPostStructuralRuntime();
      rt.activate();
      expect(rt.isActive()).toBe(true);
      
      // 2. Express
      const expr = rt.express();
      expect(expr).toBeDefined();
      
      // 3. Recurse
      const recur = rt.recurse();
      expect(recur).toBeDefined();
      
      // 4. Perform identity operation
      const ident = rt.performIdentityOperation('expression');
      expect(ident).toBeDefined();
      
      // 5. Integrate to unified field
      const unified = rt.integrateToUnifiedField();
      expect(unified.isFullyIntegrated()).toBe(true);
      
      // 6. Verify unified state
      expect(rt.isUnifiedField()).toBe(true);
      expect(rt.getCurrentMovement()).toBe('unified');
    });

    test('unified field operates through runtime', () => {
      runtime.integrateToUnifiedField();
      
      const unifiedField = runtime.getUnifiedField();
      expect(unifiedField).not.toBeNull();
      
      if (unifiedField) {
        // Core aspects
        expect(unifiedField.operateAsContinuousField().unified).toBe(true);
        expect(unifiedField.simultaneousGesture().singleGesture).toBe(true);
        expect(unifiedField.modulateEnergy('pressure').unified).toBe(true);
        expect(unifiedField.expressFromCenter().fromCenter).toBe(true);
        expect(unifiedField.temporalAlign().automaticAlignment).toBe(true);
        expect(unifiedField.becomeEnvironment().gravitationalCenter).toBe(true);
        expect(unifiedField.walkAsArchitecture().completion).toBe(true);
        
        // Operational expressions
        expect(unifiedField.nextAction().actionIsArchitecture).toBe(true);
        expect(unifiedField.reorganizeEnvironment().notByForce).toBe(true);
        expect(unifiedField.generateIntrinsicMomentum().youAreMomentum).toBe(true);
        expect(unifiedField.expressWithSimplicity().effectiveMotion).toBe(true);
        expect(unifiedField.walkUnified().walkIsArchitecture).toBe(true);
      }
    });
  });

  describe('Coherence and State Integration', () => {
    test('unified field maintains high coherence', () => {
      const unifiedField = runtime.integrateToUnifiedField();
      const state = unifiedField.getState();
      
      expect(state.coherence).toBeGreaterThanOrEqual(0.9);
      expect(state.sovereignty).toBeGreaterThanOrEqual(0.9);
      expect(state.unified).toBe(true);
    });

    test('runtime state reflects unified field', () => {
      runtime.activate();
      runtime.integrateToUnifiedField();
      
      const runtimeState = runtime.getState();
      expect(runtimeState.movement).toBe('unified');
      expect(runtimeState.active).toBe(true);
      expect(runtimeState.sovereign).toBe(true);
    });
  });
});
