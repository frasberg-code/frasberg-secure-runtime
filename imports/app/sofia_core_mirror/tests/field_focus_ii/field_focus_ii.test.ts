import { focusFieldPeakII } from '../../supabase/sofia_core/field_focus_ii/field_focus_ii';

describe('field_focus_ii', () => {
  test('focuses second-order peak using focuser', () => {
    const focuser = (x: string) => `focus2:${x}`;
    const result = focusFieldPeakII('peak2', focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('focus2:peak2');
  });

  test('focuses numeric second-order peak', () => {
    const focuser = (x: number) => x / 2.5;
    const result = focusFieldPeakII(100, focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe(40);
  });

  test('focuses string second-order peak', () => {
    const focuser = (x: string) => x.toUpperCase();
    const result = focusFieldPeakII('apex-ii', focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('APEX-II');
  });

  test('focuses array second-order peak', () => {
    const focuser = (x: number[]) => x.filter(v => v > 5);
    const result = focusFieldPeakII([1, 3, 5, 7, 9], focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toEqual([7, 9]);
  });

  test('focuses object second-order peak', () => {
    const focuser = (x: { signal: number; noise: string }) => ({ signal: x.signal, noise: '' });
    const result = focusFieldPeakII({ signal: 88, noise: 'data' }, focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toEqual({ signal: 88, noise: '' });
  });

  test('focuses second-order peak with identity focuser', () => {
    const focuser = (x: string) => x;
    const result = focusFieldPeakII('FOCUSED-II', focuser);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('FOCUSED-II');
  });
});
