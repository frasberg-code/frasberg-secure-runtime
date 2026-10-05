import { upliftFieldState } from '../../supabase/sofia_core/field_uplift/field_uplift';

describe('field_uplift', () => {
  test('uplifts field using uplifter', () => {
    const uplifter = (x: number) => x + 100;
    const result = upliftFieldState(5, uplifter);
    expect(result.uplifted).toBe(true);
    expect(result.value).toBe(105);
  });

  test('uplifts string field', () => {
    const uplifter = (x: string) => `up:${x}`;
    const result = upliftFieldState('base', uplifter);
    expect(result.uplifted).toBe(true);
    expect(result.value).toBe('up:base');
  });

  test('uplifts array field', () => {
    const uplifter = (x: number[]) => x.map(n => n * 10);
    const result = upliftFieldState([1, 2, 3], uplifter);
    expect(result.uplifted).toBe(true);
    expect(result.value).toEqual([10, 20, 30]);
  });

  test('uplifts object field', () => {
    const uplifter = (x: { tier: number }) => ({ tier: x.tier + 1 });
    const result = upliftFieldState({ tier: 1 }, uplifter);
    expect(result.uplifted).toBe(true);
    expect(result.value).toEqual({ tier: 2 });
  });

  test('uplifts field with identity uplifter', () => {
    const uplifter = (x: string) => x;
    const result = upliftFieldState('SAME', uplifter);
    expect(result.uplifted).toBe(true);
    expect(result.value).toBe('SAME');
  });
});
