import { computeFieldResonance } from '../../supabase/sofia_core/field_resonance/field_resonance';

describe('field_resonance', () => {
  test('computes resonance using resonator', () => {
    const resonator = (x: number) => x * 3;
    const result = computeFieldResonance(4, resonator);
    expect(result.resonant).toBe(true);
    expect(result.value).toBe(12);
  });

  test('computes string resonance', () => {
    const resonator = (x: string) => `resonant:${x}`;
    const result = computeFieldResonance('FIELD', resonator);
    expect(result.resonant).toBe(true);
    expect(result.value).toBe('resonant:FIELD');
  });

  test('computes object resonance', () => {
    const resonator = (x: { val: number }) => ({ val: x.val * 2 });
    const result = computeFieldResonance({ val: 10 }, resonator);
    expect(result.resonant).toBe(true);
    expect(result.value).toEqual({ val: 20 });
  });

  test('computes resonance with identity resonator', () => {
    const resonator = (x: number) => x;
    const result = computeFieldResonance(42, resonator);
    expect(result.resonant).toBe(true);
    expect(result.value).toBe(42);
  });

  test('computes array resonance', () => {
    const resonator = (x: number[]) => x.map(n => n + 10);
    const result = computeFieldResonance([1, 2, 3], resonator);
    expect(result.resonant).toBe(true);
    expect(result.value).toEqual([11, 12, 13]);
  });
});
