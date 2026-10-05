import { authorizeFieldStateIV } from '../../supabase/sofia_core/field_authority_iv/field_authority_iv';

describe('field_authority_iv', () => {
  test('authorizes fourth-order state numerically', () => {
    const fn = (x: number) => x + 4100;
    const result = authorizeFieldStateIV(10, fn);
    expect(result.authorized).toBe(true);
    expect(result.value).toBe(4110);
  });

  test('authorizes fourth-order state for strings', () => {
    const fn = (x: string) => `auth4:${x}`;
    const result = authorizeFieldStateIV('seed', fn);
    expect(result.authorized).toBe(true);
    expect(result.value).toBe('auth4:seed');
  });
});
