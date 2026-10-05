import { formFieldPeakII } from '../../supabase/sofia_core/field_peak_ii/field_peak_ii';

describe('field_peak_ii', () => {
  test('forms second-order peak using peaker', () => {
    const peaker = (x: number) => x * 5;
    const result = formFieldPeakII(2, peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe(10);
  });

  test('forms second-order peak from numeric state', () => {
    const peaker = (x: number) => x * 3.5;
    const result = formFieldPeakII(4, peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe(14);
  });

  test('forms second-order peak from string state', () => {
    const peaker = (x: string) => `peak2:${x}`;
    const result = formFieldPeakII('dominion', peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe('peak2:dominion');
  });

  test('forms second-order peak from array state', () => {
    const peaker = (x: number[]) => [...x, Math.max(...x) * 3];
    const result = formFieldPeakII([1, 2, 3], peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toEqual([1, 2, 3, 9]);
  });

  test('forms second-order peak from object state', () => {
    const peaker = (x: { intensity: number }) => ({ intensity: x.intensity * 20 });
    const result = formFieldPeakII({ intensity: 5 }, peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toEqual({ intensity: 100 });
  });

  test('forms second-order peak with identity peaker', () => {
    const peaker = (x: string) => x;
    const result = formFieldPeakII('PEAK-II', peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe('PEAK-II');
  });
});
