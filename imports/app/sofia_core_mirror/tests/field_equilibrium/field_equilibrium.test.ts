import { computeEquilibrium } from '../../supabase/sofia_core/field_equilibrium/field_equilibrium';

describe('field_equilibrium', () => {
  test('computes equilibrium point', () => {
    expect(computeEquilibrium([2, 4, 6])).toBe(4);
  });

  test('handles single value', () => {
    expect(computeEquilibrium([5])).toBe(5);
  });

  test('handles even number of values', () => {
    expect(computeEquilibrium([1, 2, 3, 4])).toBe(2.5);
  });

  test('handles negative values', () => {
    expect(computeEquilibrium([-2, 0, 2])).toBe(0);
  });

  test('handles decimal values', () => {
    expect(computeEquilibrium([1.5, 2.5, 3.0])).toBeCloseTo(2.3333333333, 2);
  });
});
