import { fieldDynamics } from '../supabase/sofia_core/sofia_core_runtime';

describe('Runtime Integration - Field Dynamics Triad', () => {
  test('fieldDynamics exports all three functions', () => {
    expect(fieldDynamics).toBeDefined();
    expect(fieldDynamics.applyFlow).toBeDefined();
    expect(fieldDynamics.generatePulse).toBeDefined();
    expect(fieldDynamics.computeVector).toBeDefined();
  });

  test('applyFlow works through runtime export', () => {
    const result = fieldDynamics.applyFlow(10, 'forward');
    expect(result).toBe(11);
  });

  test('generatePulse works through runtime export', () => {
    const result = fieldDynamics.generatePulse(5, 3);
    expect(result).toEqual([5, 5, 5]);
  });

  test('computeVector works through runtime export', () => {
    const result = fieldDynamics.computeVector(10, 0);
    expect(result.x).toBeCloseTo(10);
    expect(result.y).toBeCloseTo(0);
  });
});
