import { synthesizeFieldContinuumIII } from '../../supabase/sofia_core/field_continuum_synthesis_iii/field_continuum_synthesis_iii';

describe('field_continuum_synthesis_iii', () => {
  test('synthesizes third-order continuum numerically', () => {
    const synthesizer = (x: number) => x / 2;
    const result = synthesizeFieldContinuumIII(200, synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe(100);
  });

  test('synthesizes third-order continuum for strings', () => {
    const synthesizer = (x: string) => `${x}::syn3`;
    const result = synthesizeFieldContinuumIII('extended3', synthesizer);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe('extended3::syn3');
  });
});
