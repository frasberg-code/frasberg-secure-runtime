import { returnToOriginIII } from '../../supabase/sofia_core/field_origin_iii/field_origin_iii';

describe('field_origin_iii', () => {
  test('restores origin-III numerically', () => {
    const originFn = (x: number) => x - 3000;
    const result = returnToOriginIII(3500, originFn);
    expect(result.originRestored).toBe(true);
    expect(result.value).toBe(500);
  });

  test('restores origin-III for strings', () => {
    const originFn = (x: string) => `origin3:${x}`;
    const result = returnToOriginIII('state', originFn);
    expect(result.originRestored).toBe(true);
    expect(result.value).toBe('origin3:state');
  });
});
