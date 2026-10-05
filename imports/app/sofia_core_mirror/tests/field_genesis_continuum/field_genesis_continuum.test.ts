import { continueGenesis } from '../../supabase/sofia_core/field_genesis_continuum/field_genesis_continuum';

describe('field_genesis_continuum', () => {
  test('continues genesis using continuer', () => {
    const continuer = (x: number[]) => [...x, x.length * 2];
    const result = continueGenesis([1, 2, 3], continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual([1, 2, 3, 6]);
  });

  test('continues string genesis', () => {
    const continuer = (x: string) => `${x}:continued`;
    const result = continueGenesis('generated', continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe('generated:continued');
  });

  test('continues numeric genesis', () => {
    const continuer = (x: number) => x + 100;
    const result = continueGenesis(50, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toBe(150);
  });

  test('continues object genesis', () => {
    const continuer = (x: { state: string }) => ({ state: x.state, continuum: 'integrated' });
    const result = continueGenesis({ state: 'generated' }, continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual({ state: 'generated', continuum: 'integrated' });
  });

  test('continues genesis with identity continuer', () => {
    const continuer = (x: string[]) => x;
    const result = continueGenesis(['a', 'b', 'c'], continuer);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual(['a', 'b', 'c']);
  });
});
