import { formFieldPeakIII } from '../../supabase/sofia_core/field_peak_iii/field_peak_iii';

describe('field_peak_iii', () => {
  test('forms third-order peak using peakFn', () => {
    const peakFn = (x: number) => x * 10;
    const result = formFieldPeakIII(3, peakFn);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe(30);
  });

  test('forms third-order peak from numeric state', () => {
    const peakFn = (x: number) => x * 2.5;
    const result = formFieldPeakIII(8, peakFn);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe(20);
  });

  test('forms third-order peak from string state', () => {
    const peakFn = (x: string) => `peak3:${x}`;
    const result = formFieldPeakIII('dominion3', peakFn);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe('peak3:dominion3');
  });

  test('forms third-order peak from array state', () => {
    const peakFn = (x: number[]) => [...x, Math.max(...x) * 3];
    const result = formFieldPeakIII([1, 2, 3], peakFn);
    expect(result.peaked).toBe(true);
    expect(result.value).toEqual([1, 2, 3, 9]);
  });

  test('forms third-order peak from object state', () => {
    const peakFn = (x: { intensity: number }) => ({ intensity: x.intensity * 10 });
    const result = formFieldPeakIII({ intensity: 5 }, peakFn);
    expect(result.peaked).toBe(true);
    expect(result.value).toEqual({ intensity: 50 });
  });

  test('forms third-order peak with identity peakFn', () => {
    const peakFn = (x: string) => x;
    const result = formFieldPeakIII('PEAK_III', peakFn);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe('PEAK_III');
  });
});
