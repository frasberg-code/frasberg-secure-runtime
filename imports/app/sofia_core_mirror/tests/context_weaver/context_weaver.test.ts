import { weaveContext } from '../../supabase/sofia_core/context_weaver/context_weaver';

describe('context_weaver', () => {
  test('weaves context threads into base', () => {
    const result = weaveContext({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  test('handles empty base', () => {
    const result = weaveContext({}, { x: 'value' });
    expect(result).toEqual({ x: 'value' });
  });

  test('handles empty threads', () => {
    const result = weaveContext({ a: 1, b: 2 }, {});
    expect(result).toEqual({ a: 1, b: 2 });
  });

  test('threads override base values', () => {
    const result = weaveContext({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  test('weaves complex nested structures', () => {
    const base = { a: 1, nested: { x: 10 } };
    const threads = { b: 2, nested: { y: 20 } };
    const result = weaveContext(base, threads);
    expect(result).toEqual({ a: 1, b: 2, nested: { y: 20 } });
  });
});
