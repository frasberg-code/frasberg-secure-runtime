import { expressApexStateIV } from '../../supabase/sofia_core/field_apex_expression_iv/field_apex_expression_iv';

describe('field_apex_expression_iv', () => {
  test('expresses fourth-order apex numerically', () => {
    const fn = (x: number) => x * 10;
    const result = expressApexStateIV(444, fn);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe(4440);
  });

  test('expresses fourth-order apex for strings', () => {
    const fn = (x: string) => `${x}::apex4`;
    const result = expressApexStateIV('focus4', fn);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe('focus4::apex4');
  });
});
