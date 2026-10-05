import { expandHorizonStateIII } from '../../supabase/sofia_core/field_horizon_expansion_iii/field_horizon_expansion_iii';

describe('field_horizon_expansion_iii', () => {
  test('expands third-order horizon numerically', () => {
    const fn = (x: number) => x * 4;
    const result = expandHorizonStateIII(100, fn);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe(400);
  });

  test('expands third-order horizon for strings', () => {
    const fn = (x: string) => `${x}::expand3`;
    const result = expandHorizonStateIII('map3', fn);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe('map3::expand3');
  });
});
