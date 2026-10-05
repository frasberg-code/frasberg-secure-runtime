import { directFieldStateIV } from '../../supabase/sofia_core/field_directive_iv/field_directive_iv';

describe('field_directive_iv', () => {
  test('directs fourth-order state numerically', () => {
    const fn = (x: number) => x * 4;
    const result = directFieldStateIV(100, fn);
    expect(result.directed).toBe(true);
    expect(result.value).toBe(400);
  });

  test('directs fourth-order state for strings', () => {
    const fn = (x: string) => `${x}::dir4`;
    const result = directFieldStateIV('auth4', fn);
    expect(result.directed).toBe(true);
    expect(result.value).toBe('auth4::dir4');
  });
});
