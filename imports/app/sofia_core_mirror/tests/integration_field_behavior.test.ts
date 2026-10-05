import { fieldBehavior } from '../supabase/sofia_core/sofia_core_runtime';

describe('Runtime Integration - Field Behavior Triad', () => {
  test('fieldBehavior exports all three functions', () => {
    expect(fieldBehavior).toBeDefined();
    expect(fieldBehavior.generateResponse).toBeDefined();
    expect(fieldBehavior.applyAdjustment).toBeDefined();
    expect(fieldBehavior.computeEquilibrium).toBeDefined();
  });

  test('generateResponse works through runtime export', () => {
    const rule = (x: unknown) => (x as number) * 2;
    const result = fieldBehavior.generateResponse(5, rule);
    expect(result).toBe(10);
  });

  test('applyAdjustment works through runtime export', () => {
    const result = fieldBehavior.applyAdjustment(10, -2);
    expect(result).toBe(8);
  });

  test('computeEquilibrium works through runtime export', () => {
    const result = fieldBehavior.computeEquilibrium([2, 4, 6]);
    expect(result).toBe(4);
  });
});
