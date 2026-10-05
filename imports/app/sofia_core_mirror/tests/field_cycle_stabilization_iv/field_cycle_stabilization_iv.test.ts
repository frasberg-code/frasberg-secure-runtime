import { stabilizeFieldCycleIV } from '../../supabase/sofia_core/field_cycle_stabilization_iv/field_cycle_stabilization_iv';

describe('field_cycle_stabilization_iv', () => {
  test('stabilizes fourth-order cycle numerically', () => {
    const fn = (x: number) => x + 40;
    const result = stabilizeFieldCycleIV(100, fn);
    expect(result.stabilized).toBe(true);
    expect(result.value).toBe(140);
  });

  test('stabilizes fourth-order cycle for strings', () => {
    const fn = (x: string) => `${x}::stab4`;
    const result = stabilizeFieldCycleIV('origin4', fn);
    expect(result.stabilized).toBe(true);
    expect(result.value).toBe('origin4::stab4');
  });
});
