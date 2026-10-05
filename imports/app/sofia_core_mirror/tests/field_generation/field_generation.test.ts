import { generateFieldState } from '../../supabase/sofia_core/field_generation/field_generation';

describe('field_generation', () => {
  test('generates new field using generator', () => {
    const generator = (x: string) => `gen:${x}`;
    const result = generateFieldState('seed', generator);
    expect(result.generated).toBe(true);
    expect(result.value).toBe('gen:seed');
  });

  test('generates numeric field', () => {
    const generator = (x: number) => x * 2;
    const result = generateFieldState(5, generator);
    expect(result.generated).toBe(true);
    expect(result.value).toBe(10);
  });

  test('generates array field', () => {
    const generator = (x: number[]) => [...x, ...x];
    const result = generateFieldState([1, 2], generator);
    expect(result.generated).toBe(true);
    expect(result.value).toEqual([1, 2, 1, 2]);
  });

  test('generates object field', () => {
    const generator = (x: { seed: string }) => ({ seed: x.seed, generated: true });
    const result = generateFieldState({ seed: 'origin' }, generator);
    expect(result.generated).toBe(true);
    expect(result.value).toEqual({ seed: 'origin', generated: true });
  });

  test('generates field with identity generator', () => {
    const generator = (x: number) => x;
    const result = generateFieldState(42, generator);
    expect(result.generated).toBe(true);
    expect(result.value).toBe(42);
  });
});
