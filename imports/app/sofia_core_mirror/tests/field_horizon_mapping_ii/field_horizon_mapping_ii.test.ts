import { mapHorizonStateII } from '../../supabase/sofia_core/field_horizon_mapping_ii/field_horizon_mapping_ii';

describe('field_horizon_mapping_ii', () => {
  test('maps expansion-II using mapper', () => {
    const mapper = (x: number[]) => x.map(v => v * 2);
    const result = mapHorizonStateII([1, 2], mapper);
    expect(result.mapped).toBe(true);
    expect(result.value).toEqual([2, 4]);
  });

  test('maps string expansion-II', () => {
    const mapper = (x: string) => `mapped2:${x}`;
    const result = mapHorizonStateII('expanded2', mapper);
    expect(result.mapped).toBe(true);
    expect(result.value).toBe('mapped2:expanded2');
  });
});
