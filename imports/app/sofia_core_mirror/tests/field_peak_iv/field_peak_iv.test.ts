import { formFieldPeakIV } from '../../supabase/sofia_core/field_peak_iv/field_peak_iv';

describe('field_peak_iv', () => {
  test('forms fourth-order peak numerically', () => {
    const fn = (x: number) => x * 4;
    const result = formFieldPeakIV(100, fn);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe(400);
  });

  test('forms fourth-order peak for strings', () => {
    const fn = (x: string) => `${x}::peak4`;
    const result = formFieldPeakIV('state', fn);
    expect(result.peaked).toBe(true);
    expect(result.value).toBe('state::peak4');
  });
});
