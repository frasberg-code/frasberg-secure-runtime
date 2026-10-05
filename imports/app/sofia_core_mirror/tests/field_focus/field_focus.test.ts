import { focusFieldPeak } from '../../supabase/sofia_core/field_focus/field_focus';

describe('field_focus', () => {
  test('focuses peak using focuser', () => {
    const focuser = (x: string) => `focus:${x}`;
    const result = focusFieldPeak('peak', focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('focus:peak');
  });

  test('focuses numeric peak', () => {
    const focuser = (x: number) => x / 2;
    const result = focusFieldPeak(100, focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe(50);
  });

  test('focuses string peak', () => {
    const focuser = (x: string) => x.toUpperCase();
    const result = focusFieldPeak('peak', focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('PEAK');
  });

  test('focuses array peak', () => {
    const focuser = (x: number[]) => x.filter(v => v > 2);
    const result = focusFieldPeak([1, 2, 3, 4, 5], focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toEqual([3, 4, 5]);
  });

  test('focuses object peak', () => {
    const focuser = (x: { value: number; noise: string }) => ({ value: x.value, noise: '' });
    const result = focusFieldPeak({ value: 42, noise: 'random' }, focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toEqual({ value: 42, noise: '' });
  });

  test('focuses peak with identity focuser', () => {
    const focuser = (x: string) => x;
    const result = focusFieldPeak('FOCUSED', focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('FOCUSED');
  });
});
