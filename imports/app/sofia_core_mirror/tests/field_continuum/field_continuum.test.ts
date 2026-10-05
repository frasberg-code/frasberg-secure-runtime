import { continueFieldEvolution } from '../../supabase/sofia_core/field_continuum/field_continuum';

describe('field_continuum', () => {
  test('continues evolution using continuer', () => {
    const continuer = (x: number[]) => [...x, x.length];
    const result = continueFieldEvolution([1, 2, 3], continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual([1, 2, 3, 3]);
  });

  test('continues string field evolution', () => {
    const continuer = (x: string) => `${x}→next`;
    const result = continueFieldEvolution('evolved', continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe('evolved→next');
  });

  test('continues numeric field evolution', () => {
    const continuer = (x: number) => x + 100;
    const result = continueFieldEvolution(50, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe(150);
  });

  test('continues object field evolution', () => {
    const continuer = (x: { stage: number }) => ({ stage: x.stage + 1, continuous: true });
    const result = continueFieldEvolution({ stage: 3 }, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual({ stage: 4, continuous: true });
  });

  test('continues field evolution with identity continuer', () => {
    const continuer = (x: number[]) => x;
    const result = continueFieldEvolution([1, 2, 3], continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual([1, 2, 3]);
  });
});
