import { enforceFieldStateIV } from '../../supabase/sofia_core/field_enforcement_iv/field_enforcement_iv';

describe('field_enforcement_iv', () => {
  test('enforces fourth-order state numerically', () => {
    const fn = (x: number) => x + 444;
    const result = enforceFieldStateIV(400, fn);
    expect(result.enforced).toBe(true);
    expect(result.value).toBe(844);
  });

  test('enforces fourth-order state for strings', () => {
    const fn = (x: string) => `${x}::enf4`;
    const result = enforceFieldStateIV('dir4', fn);
    expect(result.enforced).toBe(true);
    expect(result.value).toBe('dir4::enf4');
  });
});
