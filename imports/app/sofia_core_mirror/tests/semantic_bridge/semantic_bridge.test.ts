import { bridgeSemantics } from '../../supabase/sofia_core/semantic_bridge/semantic_bridge';

describe('semantic_bridge', () => {
  test('bridges semantics with context', () => {
    const result = bridgeSemantics({ value: 1 }, 'test');
    expect(result.semantic_context).toBe('test');
  });

  test('preserves original state properties', () => {
    const state = { value: 1, data: 'test' };
    const result = bridgeSemantics(state, 'context');
    expect(result.value).toBe(1);
    expect(result.data).toBe('test');
  });

  test('bridges empty state with context', () => {
    const result = bridgeSemantics({}, 'empty_context');
    expect(result.semantic_context).toBe('empty_context');
  });

  test('bridges complex state with context', () => {
    const state = { a: 1, b: { nested: true }, c: [1, 2, 3] };
    const result = bridgeSemantics(state, 'complex');
    expect(result.semantic_context).toBe('complex');
    expect(result.a).toBe(1);
  });

  test('does not mutate original state', () => {
    const state = { value: 1 };
    const result = bridgeSemantics(state, 'test');
    expect(result).not.toBe(state);
    expect(state).not.toHaveProperty('semantic_context');
  });
});
