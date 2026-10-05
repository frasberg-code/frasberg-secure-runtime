import { synthesizeFieldCycleIV } from '../../supabase/sofia_core/field_cycle_synthesis_iv/field_cycle_synthesis_iv';

describe('field_cycle_synthesis_iv', () => {
  test('synthesizes fourth-order cycle numerically', () => {
    const fn = (x: number) => x + 444;
    const result = synthesizeFieldCycleIV(560, fn);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe(1004);
  });

  test('synthesizes fourth-order cycle for strings', () => {
    const fn = (x: string) => `${x}::syn4`;
    const result = synthesizeFieldCycleIV('ext4', fn);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe('ext4::syn4');
  });
});
