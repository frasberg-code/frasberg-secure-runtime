import { formFieldPeak } from '../../supabase/sofia_core/field_peak/field_peak';

describe('field_peak', () => {
  test('forms peak using peaker', () => {
    const peaker = (x: number) => x * 10;
    const result = formFieldPeak(3, peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe(30);
  });

  test('forms peak from numeric state', () => {
    const peaker = (x: number) => x * 2.5;
    const result = formFieldPeak(8, peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe(20);
  });

  test('forms peak from string state', () => {
    const peaker = (x: string) => `peak:${x}`;
    const result = formFieldPeak('refined', peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe('peak:refined');
  });

  test('forms peak from array state', () => {
    const peaker = (x: number[]) => [...x, Math.max(...x) * 2];
    const result = formFieldPeak([1, 2, 3], peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toEqual([1, 2, 3, 6]);
  });

  test('forms peak from object state', () => {
    const peaker = (x: { intensity: number }) => ({ intensity: x.intensity * 10 });
    const result = formFieldPeak({ intensity: 5 }, peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toEqual({ intensity: 50 });
  });

  test('forms peak with identity peaker', () => {
    const peaker = (x: string) => x;
    const result = formFieldPeak('PEAK', peaker);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe('PEAK');
  });
});
