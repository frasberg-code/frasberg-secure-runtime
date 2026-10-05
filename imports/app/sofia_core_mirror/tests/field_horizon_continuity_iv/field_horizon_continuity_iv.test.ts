import { continueHorizonStateIV } from '../../supabase/sofia_core/field_horizon_continuity_iv/field_horizon_continuity_iv';

describe('field_horizon_continuity_iv', () => {
  test('continues fourth-order horizon numerically', () => {
    const fn = (x: number) => x + 44;
    const result = continueHorizonStateIV(400, fn);
    expect(result.continued).toBe(true);
    expect(result.value).toBe(444);
  });

  test('continues fourth-order horizon for strings', () => {
    const fn = (x: string) => `${x}::cont4`;
    const result = continueHorizonStateIV('expand4', fn);
    expect(result.continued).toBe(true);
    expect(result.value).toBe('expand4::cont4');
  });
});
