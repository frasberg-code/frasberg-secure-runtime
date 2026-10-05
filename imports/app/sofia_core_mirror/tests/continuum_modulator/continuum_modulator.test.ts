import { modulateContinuity } from '../../supabase/sofia_core/continuum_modulator/continuum_modulator';

describe('continuum_modulator', () => {
  test('modulates continuity with context', () => {
    const state = { value: 42 };
    const result = modulateContinuity(state, 'runtime');
    expect(result).toEqual({ value: 42, context: 'runtime' });
  });

  test('preserves state without mutation', () => {
    const state = { a: 1, b: 2 };
    const result = modulateContinuity(state, 'test');
    expect(result).toEqual({ a: 1, b: 2, context: 'test' });
    // Verify it's a new object (no mutation)
    expect(result).not.toBe(state);
  });

  test('handles empty state', () => {
    const state = {};
    const result = modulateContinuity(state, 'empty');
    expect(result).toEqual({ context: 'empty' });
  });

  test('handles complex nested state', () => {
    const state = { nested: { deep: { value: 'test' } }, array: [1, 2, 3] };
    const result = modulateContinuity(state, 'complex');
    expect(result.nested).toBe(state.nested); // Shallow copy
    expect(result).toHaveProperty('context', 'complex');
  });

  test('overrides existing context property', () => {
    const state = { context: 'old', data: 'preserved' };
    const result = modulateContinuity(state, 'new');
    expect(result).toEqual({ context: 'new', data: 'preserved' });
  });
});
