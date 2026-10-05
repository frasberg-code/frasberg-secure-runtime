/**
 * Tests for @emeraldorbit/sofia-governance-engine
 */

import { deviationEngine, orchestrate } from '../src/index';

describe('Governance Engine', () => {
  describe('deviationEngine', () => {
    it('should initialize with default state', () => {
      const state = deviationEngine.initialize();
      expect(state.baseline).toBe(0);
      expect(state.deviation).toBe(0);
      expect(state.direction).toBe('neutral');
      expect(state.alert).toBeNull();
      expect(state.stability).toBe(1.0);
      expect(state.history).toEqual([]);
    });

    it('should update deviation with positive delta', () => {
      const state = deviationEngine.initialize();
      const updated = deviationEngine.update(state, { delta: 10 });
      expect(updated.deviation).toBe(10);
      expect(updated.direction).toBe('positive');
      expect(updated.stability).toBeLessThan(1.0);
    });

    it('should detect high drift alert', () => {
      const state = deviationEngine.initialize();
      const updated = deviationEngine.update(state, { delta: 50 });
      expect(updated.alert).toBe('high_drift');
    });

    it('should detect critical drift alert', () => {
      const state = deviationEngine.initialize();
      const updated = deviationEngine.update(state, { delta: 80 });
      expect(updated.alert).toBe('critical_drift');
    });
  });

  describe('orchestrate', () => {
    it('should execute modules in sequence', () => {
      const modules = {
        add1: (x: number) => x + 1,
        multiply2: (x: number) => x * 2,
        subtract3: (x: number) => x - 3
      };
      const result = orchestrate(modules, 5);
      // (5 + 1) * 2 - 3 = 9
      expect(result).toBe(9);
    });

    it('should handle empty modules', () => {
      const result = orchestrate({}, 42);
      expect(result).toBe(42);
    });

    it('should pass output through module chain', () => {
      const modules = {
        step1: (input: any) => ({ ...input, step1: true }),
        step2: (input: any) => ({ ...input, step2: true }),
        step3: (input: any) => ({ ...input, step3: true })
      };
      const result = orchestrate(modules, { initial: true });
      expect(result).toEqual({
        initial: true,
        step1: true,
        step2: true,
        step3: true
      });
    });
  });
});
