import { continueGenesisIII } from '../../supabase/sofia_core/field_genesis_continuum_iii/field_genesis_continuum_iii';

describe('field_genesis_continuum_iii', () => {
  test('continues third-order genesis numerically', () => {
    const continuer = (x: number) => x + 33;
    const result = continueGenesisIII(100, continuer);
    expect(result.continued).toBe(true);
    expect(result.value).toBe(133);
  });

  test('continues third-order genesis for strings', () => {
    const continuer = (x: string) => `${x}::cont3`;
    const result = continueGenesisIII('gen3', continuer);
    expect(result.continued).toBe(true);
    expect(result.value).toBe('gen3::cont3');
  });
});
