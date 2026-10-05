import { computeFieldStability } from '../../supabase/sofia_core/field_stability/field_stability';

describe('field_stability', () => {
  test('computes stability using evaluator', () => {
    const evaluator = (arr: number[]) => arr.every((x) => x > 0);
    const result = computeFieldStability([1, 2, 3], evaluator, 1);
    expect(result.stable).toBe(true);
    expect(result.baseline).toBe(1);
  });

  test('reports unstable when evaluator returns false', () => {
    const evaluator = (arr: number[]) => arr.every((x) => x > 5);
    const result = computeFieldStability([1, 2, 3], evaluator, 5);
    expect(result.stable).toBe(false);
    expect(result.baseline).toBe(5);
  });

  test('handles empty values array', () => {
    const evaluator = (arr: number[]) => arr.length === 0;
    const result = computeFieldStability([], evaluator, 0);
    expect(result.stable).toBe(true);
    expect(result.baseline).toBe(0);
  });

  test('handles string values', () => {
    const evaluator = (arr: string[]) =>
      arr.every((s) => s.length > 0);
    const result = computeFieldStability(['A', 'B', 'C'], evaluator, 'baseline');
    expect(result.stable).toBe(true);
    expect(result.baseline).toBe('baseline');
  });

  test('handles object baseline', () => {
    const evaluator = (arr: { value: number }[]) =>
      arr.every((obj) => obj.value >= 0);
    const baseline = { value: 100 };
    const result = computeFieldStability(
      [{ value: 1 }, { value: 2 }],
      evaluator,
      baseline
    );
    expect(result.stable).toBe(true);
    expect(result.baseline).toEqual(baseline);
  });

  test('handles custom evaluator logic', () => {
    const evaluator = (arr: number[]) => {
      const max = Math.max(...arr);
      const min = Math.min(...arr);
      return max - min < 10;
    };
    const result = computeFieldStability([10, 12, 15], evaluator, 10);
    expect(result.stable).toBe(true);
    expect(result.baseline).toBe(10);
  });
});
