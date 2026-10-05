import { continueHorizonStateIII } from '../../supabase/sofia_core/field_horizon_continuity_iii/field_horizon_continuity_iii';

describe('field_horizon_continuity_iii', () => {
  test('continues third-order horizon numerically', () => {
    const fn = (x: number) => x + 33;
    const result = continueHorizonStateIII(400, fn);
    expect(result.continued).toBe(true);
    expect(result.value).toBe(433);
  });

  test('continues third-order horizon for strings', () => {
    const fn = (x: string) => `${x}::cont3`;
    const result = continueHorizonStateIII('expand3', fn);
    expect(result.continued).toBe(true);
    expect(result.value).toBe('expand3::cont3');
  });
});
