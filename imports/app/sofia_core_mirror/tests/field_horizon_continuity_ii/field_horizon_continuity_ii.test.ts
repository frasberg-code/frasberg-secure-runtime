import { continueHorizonStateII } from '../../supabase/sofia_core/field_horizon_continuity_ii/field_horizon_continuity_ii';

describe('field_horizon_continuity_ii', () => {
  test('continues horizon-II using continuer', () => {
    const continuer = (x: string) => `${x}::continued2`;
    const result = continueHorizonStateII('mapped2', continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe('mapped2::continued2');
  });

  test('continues numeric horizon-II', () => {
    const continuer = (x: number) => x + 100;
    const result = continueHorizonStateII(5, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe(105);
  });
});
