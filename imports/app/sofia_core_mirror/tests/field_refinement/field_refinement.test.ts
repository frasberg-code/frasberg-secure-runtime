import { refineFieldState } from '../../supabase/sofia_core/field_refinement/field_refinement';

describe('field_refinement', () => {
  test('refines field using refiner', () => {
    const refiner = (x: string) => `ref:${x}`;
    const result = refineFieldState('uplift', refiner);
    expect(result.refined).toBe(true);
    expect(result.value).toBe('ref:uplift');
  });

  test('refines numeric field', () => {
    const refiner = (x: number) => Math.round(x * 100) / 100;
    const result = refineFieldState(3.14159, refiner);
    expect(result.refined).toBe(true);
    expect(result.value).toBe(3.14);
  });

  test('refines array field', () => {
    const refiner = (x: number[]) => x.filter(n => n > 0);
    const result = refineFieldState([-1, 0, 1, 2], refiner);
    expect(result.refined).toBe(true);
    expect(result.value).toEqual([1, 2]);
  });

  test('refines object field', () => {
    const refiner = (x: { precision: number }) => ({ precision: x.precision * 2 });
    const result = refineFieldState({ precision: 5 }, refiner);
    expect(result.refined).toBe(true);
    expect(result.value).toEqual({ precision: 10 });
  });

  test('refines field with identity refiner', () => {
    const refiner = (x: string) => x;
    const result = refineFieldState('EXACT', refiner);
    expect(result.refined).toBe(true);
    expect(result.value).toBe('EXACT');
  });
});
