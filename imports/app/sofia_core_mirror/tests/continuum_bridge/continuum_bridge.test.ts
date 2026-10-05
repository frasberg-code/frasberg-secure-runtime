import { bridgeState } from '../../supabase/sofia_core/continuum_bridge/continuum_bridge';

describe('continuum_bridge', () => {
  test('bridges state without mutation', () => {
    const state = { a: 1 };
    const result = bridgeState(state);
    expect(result).toEqual(state);
    // Verify it's a new object (no mutation)
    expect(result).not.toBe(state);
  });

  test('bridges complex state objects', () => {
    const state = { a: 1, b: 'test', c: { nested: true } };
    const result = bridgeState(state);
    expect(result).toEqual(state);
  });

  test('bridges empty state', () => {
    const state = {};
    const result = bridgeState(state);
    expect(result).toEqual({});
  });
});
