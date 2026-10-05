import { fieldIntegration } from '../supabase/sofia_core/sofia_core_runtime';

describe('Runtime Integration - Field Integration Triad', () => {
  test('fieldIntegration exports all three functions', () => {
    expect(fieldIntegration).toBeDefined();
    expect(fieldIntegration.synthesizeFieldCycles).toBeDefined();
    expect(fieldIntegration.harmonizeFieldState).toBeDefined();
    expect(fieldIntegration.computeFieldStability).toBeDefined();
  });

  test('synthesizeFieldCycles works through runtime export', () => {
    const synth = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const result = fieldIntegration.synthesizeFieldCycles([1, 2, 3, 4], synth);
    expect(result).toBe(10);
  });

  test('harmonizeFieldState works through runtime export', () => {
    const harmonizer = (arr: string[]) => arr.join('|');
    const result = fieldIntegration.harmonizeFieldState(['X', 'Y', 'Z'], harmonizer);
    expect(result).toBe('X|Y|Z');
  });

  test('computeFieldStability works through runtime export', () => {
    const evaluator = (arr: number[]) => arr.every((x) => x >= 0);
    const result = fieldIntegration.computeFieldStability([1, 2, 3], evaluator, 0);
    expect(result.stable).toBe(true);
    expect(result.baseline).toBe(0);
  });

  test('all three functions work together in sequence', () => {
    // Synthesize multiple cycles into a single value
    const cycles = [10, 20, 30];
    const synthesizer = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0);
    const synthesized = fieldIntegration.synthesizeFieldCycles(cycles, synthesizer);
    expect(synthesized).toBe(60);

    // Harmonize states into a normalized form
    const states = [synthesized, 40, 80];
    const harmonizer = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const harmonized = fieldIntegration.harmonizeFieldState(states, harmonizer);
    expect(harmonized).toBe(60);

    // Compute stability of the harmonized values
    const values = [harmonized, 60, 60];
    const evaluator = (arr: number[]) => {
      const allEqual = arr.every((val) => val === arr[0]);
      return allEqual;
    };
    const stability = fieldIntegration.computeFieldStability(values, evaluator, harmonized);
    expect(stability.stable).toBe(true);
    expect(stability.baseline).toBe(60);
  });
});
