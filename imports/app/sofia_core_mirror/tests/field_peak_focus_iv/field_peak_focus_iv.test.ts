import { focusFieldPeakIV } from '../../supabase/sofia_core/field_peak_focus_iv/field_peak_focus_iv';

describe('field_peak_focus_iv', () => {
  test('focuses fourth-order peak numerically', () => {
    const fn = (x: number) => x + 44;
    const result = focusFieldPeakIV(400, fn);
    expect(result.focused).toBe(true);
    expect(result.value).toBe(444);
  });

  test('focuses fourth-order peak for strings', () => {
    const fn = (x: string) => `${x}::focus4`;
    const result = focusFieldPeakIV('peak4', fn);
    expect(result.focused).toBe(true);
    expect(result.value).toBe('peak4::focus4');
  });
});
