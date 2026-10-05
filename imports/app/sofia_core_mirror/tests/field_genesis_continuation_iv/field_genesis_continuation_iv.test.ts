import { continueGenesisStateIV } from '../../supabase/sofia_core/field_genesis_continuation_iv/field_genesis_continuation_iv';

describe('field_genesis_continuation_iv', () => {
  test('continues fourth-order genesis numerically', () => {
    const fn = (x: number) => x + 44;
    const result = continueGenesisStateIV(400, fn);
    expect(result.continued).toBe(true);
    expect(result.value).toBe(444);
  });

  test('continues fourth-order genesis for strings', () => {
    const fn = (x: string) => `${x}::cont4`;
    const result = continueGenesisStateIV('gen4', fn);
    expect(result.continued).toBe(true);
    expect(result.value).toBe('gen4::cont4');
  });
});
