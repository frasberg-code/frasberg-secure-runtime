import { continueDominionIII } from '../../supabase/sofia_core/field_dominion_continuity_iii/field_dominion_continuity_iii';

describe('field_dominion_continuity_iii', () => {
  test('continues third-order dominion numerically', () => {
    const continuer = (x: number) => x + 33;
    const result = continueDominionIII(300, continuer);
    expect(result.continued).toBe(true);
    expect(result.value).toBe(333);
  });

  test('continues third-order dominion for strings', () => {
    const continuer = (x: string) => `${x}::cont3`;
    const result = continueDominionIII('proj3', continuer);
    expect(result.continued).toBe(true);
    expect(result.value).toBe('proj3::cont3');
  });
});
