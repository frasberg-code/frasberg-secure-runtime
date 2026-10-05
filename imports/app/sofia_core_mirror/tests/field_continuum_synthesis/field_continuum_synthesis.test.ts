import { synthesizeFieldContinuum } from '../../supabase/sofia_core/field_continuum_synthesis/field_continuum_synthesis';

describe('field_continuum_synthesis', () => {
  test('synthesizes continuum using synthesizer', () => {
    const synthesizer = (x: number[]) => x.reduce((a, b) => a + b, 0);
    const result = synthesizeFieldContinuum([1, 2, 3], synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe(6);
  });

  test('synthesizes string continuum with unified prefix', () => {
    const synthesizer = (x: string) => `unified:${x}`;
    const result = synthesizeFieldContinuum('extended', synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe('unified:extended');
  });

  test('synthesizes string continuum with :: separator', () => {
    const synthesizer = (x: string) => `${x}::unified`;
    const result = synthesizeFieldContinuum('extended', synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe('extended::unified');
  });

  test('synthesizes array continuum with join', () => {
    const synthesizer = (x: string[]) => x.join('-');
    const result = synthesizeFieldContinuum(['cycle1', 'cycle2', 'cycle3'], synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe('cycle1-cycle2-cycle3');
  });

  test('synthesizes array continuum with transformation', () => {
    const synthesizer = (x: string[]) => x.join('-');
    const result = synthesizeFieldContinuum(['a', 'b', 'c'], synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe('a-b-c');
  });

  test('synthesizes object continuum with unified flag', () => {
    const synthesizer = (x: { extended: string }) => ({ ...x, unified: true });
    const result = synthesizeFieldContinuum({ extended: 'continuum' }, synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toEqual({ extended: 'continuum', unified: true });
  });

  test('synthesizes object continuum with synthesized property', () => {
    const synthesizer = (x: { extended: string }) => ({ extended: x.extended, synthesized: 'complete' });
    const result = synthesizeFieldContinuum({ extended: 'longArc' }, synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toEqual({ extended: 'longArc', synthesized: 'complete' });
  });

  test('synthesizes continuum with identity synthesizer (boolean array)', () => {
    const synthesizer = (x: boolean[]) => x;
    const result = synthesizeFieldContinuum([true, false, true], synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toEqual([true, false, true]);
  });

  test('synthesizes continuum with identity synthesizer (number)', () => {
    const synthesizer = (x: number) => x;
    const result = synthesizeFieldContinuum(42, synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe(42);
  });
});
