import { stabilizeFieldCycleIII } from '../../supabase/sofia_core/field_cycle_stabilization_iii/field_cycle_stabilization_iii';

describe('field_cycle_stabilization_iii', () => {
  test('stabilizes third-order cycle numerically', () => {
    const stabilizer = (x: number) => x * 2;
    const result = stabilizeFieldCycleIII(50, stabilizer);
    expect(result.stabilized).toBe(true);
    expect(result.value).toBe(100);
  });

  test('stabilizes third-order cycle for strings', () => {
    const stabilizer = (x: string) => `${x}::stable3`;
    const result = stabilizeFieldCycleIII('cycle', stabilizer);
    expect(result.stabilized).toBe(true);
    expect(result.value).toBe('cycle::stable3');
  });
});
