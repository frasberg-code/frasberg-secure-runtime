import { extendFieldContinuum } from '../../supabase/sofia_core/field_continuum_extension/field_continuum_extension';

describe('field_continuum_extension', () => {
  test('extends continuum using extender', () => {
    const extender = (x: string) => `${x}::ext`;
    const result = extendFieldContinuum('cycle', extender);
    expect(result.extended).toBe(true);
    expect(result.value).toBe('cycle::ext');
  });

  test('extends numeric continuum with doubling', () => {
    const extender = (x: number) => x * 2;
    const result = extendFieldContinuum(5, extender);
    expect(result.extended).toBe(true);
    expect(result.value).toBe(10);
  });

  test('extends numeric continuum with addition', () => {
    const extender = (x: number) => x + 50;
    const result = extendFieldContinuum(10, extender);
    expect(result.extended).toBe(true);
    expect(result.value).toBe(60);
  });

  test('extends array continuum by appending', () => {
    const extender = (x: string[]) => [...x, 'extended'];
    const result = extendFieldContinuum(['a', 'b'], extender);
    expect(result.extended).toBe(true);
    expect(result.value).toEqual(['a', 'b', 'extended']);
  });

  test('extends array continuum by doubling', () => {
    const extender = (x: number[]) => [...x, ...x];
    const result = extendFieldContinuum([1, 2], extender);
    expect(result.extended).toBe(true);
    expect(result.value).toEqual([1, 2, 1, 2]);
  });

  test('extends object continuum with arc property', () => {
    const extender = (x: { cycle: string }) => ({ ...x, arc: 'long' });
    const result = extendFieldContinuum({ cycle: 'stable' }, extender);
    expect(result.extended).toBe(true);
    expect(result.value).toEqual({ cycle: 'stable', arc: 'long' });
  });

  test('extends object continuum with extended property', () => {
    const extender = (x: { cycle: string }) => ({ cycle: x.cycle, extended: 'yes' });
    const result = extendFieldContinuum({ cycle: 'stable' }, extender);
    expect(result.extended).toBe(true);
    expect(result.value).toEqual({ cycle: 'stable', extended: 'yes' });
  });

  test('extends continuum with identity extender (array)', () => {
    const extender = (x: number[]) => x;
    const result = extendFieldContinuum([1, 2, 3], extender);
    expect(result.extended).toBe(true);
    expect(result.value).toEqual([1, 2, 3]);
  });

  test('extends continuum with identity extender (string)', () => {
    const extender = (x: string) => x;
    const result = extendFieldContinuum('stable-cycle', extender);
    expect(result.extended).toBe(true);
    expect(result.value).toBe('stable-cycle');
  });
});
