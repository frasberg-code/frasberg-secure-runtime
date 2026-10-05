import { alignFieldContinuity } from '../../supabase/sofia_core/field_alignment/field_alignment';

describe('field_alignment', () => {
  test('aligns continuity inputs using aligner', () => {
    const aligner = (values: number[]) => values.reduce((a, b) => a + b, 0);
    const result = alignFieldContinuity([1, 2, 3], aligner);
    expect(result.aligned).toBe(true);
    expect(result.orientation).toBe(6);
  });

  test('aligns string inputs using aligner', () => {
    const aligner = (values: string[]) => values.join('-');
    const result = alignFieldContinuity(['a', 'b', 'c'], aligner);
    expect(result.aligned).toBe(true);
    expect(result.orientation).toBe('a-b-c');
  });

  test('aligns object inputs using aligner', () => {
    const aligner = (values: Array<{ x: number }>) => ({
      x: values.reduce((sum, obj) => sum + obj.x, 0),
    });
    const result = alignFieldContinuity([{ x: 1 }, { x: 2 }, { x: 3 }], aligner);
    expect(result.aligned).toBe(true);
    expect(result.orientation).toEqual({ x: 6 });
  });

  test('throws error when no inputs provided', () => {
    const aligner = (values: number[]) => values[0];
    expect(() => alignFieldContinuity([], aligner)).toThrow(
      'No inputs provided for alignment'
    );
  });

  test('handles single input', () => {
    const aligner = (values: string[]) => values[0];
    const result = alignFieldContinuity(['single'], aligner);
    expect(result.aligned).toBe(true);
    expect(result.orientation).toBe('single');
  });

  test('handles array alignment', () => {
    const aligner = (values: number[][]) => values.flat();
    const result = alignFieldContinuity([[1, 2], [3, 4]], aligner);
    expect(result.aligned).toBe(true);
    expect(result.orientation).toEqual([1, 2, 3, 4]);
  });
});
