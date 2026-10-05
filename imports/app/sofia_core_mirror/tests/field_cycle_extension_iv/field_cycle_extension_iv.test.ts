import { extendFieldCycleIV } from '../../supabase/sofia_core/field_cycle_extension_iv/field_cycle_extension_iv';

describe('field_cycle_extension_iv', () => {
  test('extends fourth-order cycle numerically', () => {
    const fn = (x: number) => x * 4;
    const result = extendFieldCycleIV(140, fn);
    expect(result.extended).toBe(true);
    expect(result.value).toBe(560);
  });

  test('extends fourth-order cycle for strings', () => {
    const fn = (x: string) => `${x}::ext4`;
    const result = extendFieldCycleIV('stab4', fn);
    expect(result.extended).toBe(true);
    expect(result.value).toBe('stab4::ext4');
  });
});
