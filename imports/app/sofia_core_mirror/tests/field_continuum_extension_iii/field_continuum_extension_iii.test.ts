import { extendFieldContinuumIII } from '../../supabase/sofia_core/field_continuum_extension_iii/field_continuum_extension_iii';

describe('field_continuum_extension_iii', () => {
  test('extends third-order continuum numerically', () => {
    const extender = (x: number) => x + 300;
    const result = extendFieldContinuumIII(100, extender);
    expect(result.extended).toBe(true);
    expect(result.value).toBe(400);
  });

  test('extends third-order continuum for strings', () => {
    const extender = (x: string) => `${x}::extend3`;
    const result = extendFieldContinuumIII('continuum', extender);
    expect(result.extended).toBe(true);
    expect(result.value).toBe('continuum::extend3');
  });
});
