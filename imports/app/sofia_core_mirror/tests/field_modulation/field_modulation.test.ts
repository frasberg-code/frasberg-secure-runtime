import { modulateFieldFromInfluence } from '../../supabase/sofia_core/field_modulation/field_modulation';

describe('field_modulation', () => {
  test('modulates field using modulator', () => {
    const modulator = (x: string) => `mod:${x}`;
    const result = modulateFieldFromInfluence('inf', modulator);
    expect(result.modulated).toBe(true);
    expect(result.value).toBe('mod:inf');
  });

  test('modulates numeric field', () => {
    const modulator = (x: number) => x * 3;
    const result = modulateFieldFromInfluence(7, modulator);
    expect(result.modulated).toBe(true);
    expect(result.value).toBe(21);
  });

  test('modulates object field', () => {
    const modulator = (x: { intensity: number }) => ({ intensity: x.intensity + 5 });
    const result = modulateFieldFromInfluence({ intensity: 10 }, modulator);
    expect(result.modulated).toBe(true);
    expect(result.value).toEqual({ intensity: 15 });
  });

  test('modulates field with identity modulator', () => {
    const modulator = (x: string) => x;
    const result = modulateFieldFromInfluence('FIELD', modulator);
    expect(result.modulated).toBe(true);
    expect(result.value).toBe('FIELD');
  });

  test('modulates array field', () => {
    const modulator = (x: number[]) => x.map(n => n * 2);
    const result = modulateFieldFromInfluence([1, 2, 3], modulator);
    expect(result.modulated).toBe(true);
    expect(result.value).toEqual([2, 4, 6]);
  });
});
