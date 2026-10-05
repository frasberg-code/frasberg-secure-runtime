import { originateFieldStateIV } from '../../supabase/sofia_core/field_origin_iv/field_origin_iv';

describe('field_origin_iv', () => {
  test('originates fourth-order state numerically', () => {
    const fn = (x: number) => x + 4000;
    const result = originateFieldStateIV(10, fn);
    expect(result.originated).toBe(true);
    expect(result.value).toBe(4010);
  });

  test('originates fourth-order state for strings', () => {
    const fn = (x: string) => `origin4:${x}`;
    const result = originateFieldStateIV('seed', fn);
    expect(result.originated).toBe(true);
    expect(result.value).toBe('origin4:seed');
  });
});
