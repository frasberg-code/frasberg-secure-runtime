import { conductResonance } from '../../supabase/sofia_core/resonance_conductor/resonance_conductor';

describe('resonance_conductor', () => {
  test('conducts resonance using average strategy', () => {
    const result = conductResonance([2, 4, 6], 'average');
    expect(result).toBe(4);
  });

  test('conducts resonance using first strategy', () => {
    const result = conductResonance([10, 20, 30], 'first');
    expect(result).toBe(10);
  });

  test('conducts resonance using last strategy', () => {
    const result = conductResonance([10, 20, 30], 'last');
    expect(result).toBe(30);
  });

  test('handles empty signals array', () => {
    const result = conductResonance([], 'average');
    expect(result).toBeNull();
  });

  test('filters non-numeric values in average strategy', () => {
    const result = conductResonance([2, 'text', 6, null, 8], 'average');
    expect(result).toBe((2 + 6 + 8) / 3);
  });

  test('returns null when no numeric values for average', () => {
    const result = conductResonance(['text', null, undefined], 'average');
    expect(result).toBeNull();
  });

  test('first strategy returns first signal regardless of type', () => {
    const result = conductResonance(['first', 'second', 'third'], 'first');
    expect(result).toBe('first');
  });

  test('last strategy returns last signal regardless of type', () => {
    const result = conductResonance(['first', 'second', 'third'], 'last');
    expect(result).toBe('third');
  });

  test('computes average with single numeric value', () => {
    const result = conductResonance([42], 'average');
    expect(result).toBe(42);
  });

  test('handles mixed numeric values', () => {
    const result = conductResonance([1, 2, 3, 4, 5], 'average');
    expect(result).toBe(3);
  });
});
