import { mapHorizonState } from '../../supabase/sofia_core/field_horizon_mapping/field_horizon_mapping';

test('maps horizon using mapper', () => {
  const mapper = (x: string) => `map:${x}`;
  const result = mapHorizonState('expanded', mapper);
  expect(result.mapped).toBe(true);
  expect(result.value).toBe('map:expanded');
});
