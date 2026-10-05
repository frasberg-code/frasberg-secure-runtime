import { expandHorizonStateIV } from '../../supabase/sofia_core/field_horizon_expansion_iv/field_horizon_expansion_iv';

describe('field_horizon_expansion_iv', () => {
  test('expands fourth-order horizon numerically', () => {
    const fn = (x: number) => x * 4;
    const result = expandHorizonStateIV(100, fn);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe(400);
  });

  test('expands fourth-order horizon for strings', () => {
    const fn = (x: string) => `${x}::expand4`;
    const result = expandHorizonStateIV('map4', fn);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe('map4::expand4');
  });
});
