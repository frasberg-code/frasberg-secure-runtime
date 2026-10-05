import { focusFieldPeakIII } from '../../supabase/sofia_core/field_focus_iii/field_focus_iii';

describe('field_focus_iii', () => {
  test('focuses third-order peak using focusFn', () => {
    const focusFn = (x: string) => `focus3:${x}`;
    const result = focusFieldPeakIII('peak3', focusFn);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('focus3:peak3');
  });

  test('focuses third-order numeric peak', () => {
    const focusFn = (x: number) => x / 2;
    const result = focusFieldPeakIII(100, focusFn);
    expect(result.focused).toBe(true);
    expect(result.value).toBe(50);
  });

  test('focuses third-order string peak', () => {
    const focusFn = (x: string) => x.toUpperCase();
    const result = focusFieldPeakIII('peak_iii', focusFn);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('PEAK_III');
  });

  test('focuses third-order array peak', () => {
    const focusFn = (x: number[]) => x.filter(v => v > 2);
    const result = focusFieldPeakIII([1, 2, 3, 4, 5], focusFn);
    expect(result.focused).toBe(true);
    expect(result.value).toEqual([3, 4, 5]);
  });

  test('focuses third-order object peak', () => {
    const focusFn = (x: { value: number; noise: string }) => ({ value: x.value, noise: '' });
    const result = focusFieldPeakIII({ value: 42, noise: 'random' }, focusFn);
    expect(result.focused).toBe(true);
    expect(result.value).toEqual({ value: 42, noise: '' });
  });

  test('focuses third-order peak with identity focusFn', () => {
    const focusFn = (x: string) => x;
    const result = focusFieldPeakIII('FOCUSED_III', focusFn);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('FOCUSED_III');
  });
});
