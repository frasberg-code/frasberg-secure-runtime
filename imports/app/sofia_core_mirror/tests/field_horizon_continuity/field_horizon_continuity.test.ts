import { continueHorizonState } from '../../supabase/sofia_core/field_horizon_continuity/field_horizon_continuity';

test('continues horizon using continuer', () => {
  const continuer = (x: number[]) => [...x, x.length];
  const result = continueHorizonState([10, 20], continuer);
  expect(result.continuous).toBe(true);
  expect(result.value).toEqual([10, 20, 2]);
});
