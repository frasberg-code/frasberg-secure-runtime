import { transformFieldState } from '../../supabase/sofia_core/field_transformation/field_transformation';

describe('field_transformation', () => {
  test('transforms field using transformer', () => {
    const transformer = (x: number) => x * 2;
    const result = transformFieldState(5, transformer);
    expect(result.transformed).toBe(true);
    expect(result.value).toBe(10);
  });

  test('transforms string field', () => {
    const transformer = (x: string) => `transformed:${x}`;
    const result = transformFieldState('shifted', transformer);
    expect(result.transformed).toBe(true);
    expect(result.value).toBe('transformed:shifted');
  });

  test('transforms object field', () => {
    const transformer = (x: { depth: number }) => ({ depth: x.depth * 10 });
    const result = transformFieldState({ depth: 5 }, transformer);
    expect(result.transformed).toBe(true);
    expect(result.value).toEqual({ depth: 50 });
  });

  test('transforms field with identity transformer', () => {
    const transformer = (x: number) => x;
    const result = transformFieldState(42, transformer);
    expect(result.transformed).toBe(true);
    expect(result.value).toBe(42);
  });

  test('transforms array field', () => {
    const transformer = (x: number[]) => x.map(n => n + 1);
    const result = transformFieldState([1, 2, 3], transformer);
    expect(result.transformed).toBe(true);
    expect(result.value).toEqual([2, 3, 4]);
  });
});
