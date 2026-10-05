import { mapHorizonStateIV } from '../../supabase/sofia_core/field_horizon_mapping_iv/field_horizon_mapping_iv';

describe('field_horizon_mapping_iv', () => {
  test('maps fourth-order horizon numerically', () => {
    const fn = (x: number) => x + 4000;
    const result = mapHorizonStateIV(10, fn);
    expect(result.mapped).toBe(true);
    expect(result.value).toBe(4010);
  });

  test('maps fourth-order horizon for strings', () => {
    const fn = (x: string) => `${x}::map4`;
    const result = mapHorizonStateIV('peak4', fn);
    expect(result.mapped).toBe(true);
    expect(result.value).toBe('peak4::map4');
  });
});
