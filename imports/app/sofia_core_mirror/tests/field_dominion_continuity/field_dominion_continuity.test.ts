import { continueDominion } from '../../supabase/sofia_core/field_dominion_continuity/field_dominion_continuity';

describe('field_dominion_continuity', () => {
  test('continues dominion using continuer', () => {
    const continuer = (x: number[]) => [...x, x.length + 1];
    const result = continueDominion([1, 2], continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual([1, 2, 3]);
  });

  test('continues dominion with string transformation', () => {
    const continuer = (x: string) => `${x}-continued`;
    const result = continueDominion('projected', continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe('projected-continued');
  });

  test('continues dominion with numeric transformation', () => {
    const continuer = (x: number) => x * 2;
    const result = continueDominion(100, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe(200);
  });

  test('continues dominion with object transformation', () => {
    const continuer = (x: { projected: boolean }) => ({ ...x, continuous: true });
    const result = continueDominion({ projected: true }, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual({ projected: true, continuous: true });
  });

  test('continues dominion with identity function', () => {
    const continuer = (x: boolean[]) => x;
    const result = continueDominion([true, false], continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual([true, false]);
  });
});
