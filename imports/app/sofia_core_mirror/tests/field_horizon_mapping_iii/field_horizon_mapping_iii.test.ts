import { mapHorizonStateIII } from '../../supabase/sofia_core/field_horizon_mapping_iii/field_horizon_mapping_iii';

describe('field_horizon_mapping_iii', () => {
  test('maps third-order horizon numerically', () => {
    const fn = (x: number) => x + 1000;
    const result = mapHorizonStateIII(10, fn);
    expect(result.mapped).toBe(true);
    expect(result.value).toBe(1010);
  });

  test('maps third-order horizon for strings', () => {
    const fn = (x: string) => `${x}::map3`;
    const result = mapHorizonStateIII('peak', fn);
    expect(result.mapped).toBe(true);
    expect(result.value).toBe('peak::map3');
  });
});
