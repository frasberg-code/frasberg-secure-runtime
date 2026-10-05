import { continueGenesisII } from '../../supabase/sofia_core/field_genesis_continuum_ii/field_genesis_continuum_ii';

describe('field_genesis_continuum_ii', () => {
  test('continues genesis-II using continuer', () => {
    const continuer = (x: number) => x + 100;
    const result = continueGenesisII(20, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe(120);
  });

  test('continues string genesis-II', () => {
    const continuer = (x: string) => `continued2:${x}`;
    const result = continueGenesisII('gen2', continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe('continued2:gen2');
  });
});
