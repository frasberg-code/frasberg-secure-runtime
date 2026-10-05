import { establishAuthorityCycle } from '../../supabase/sofia_core/field_authority_cycle/field_authority_cycle';

describe('field_authority_cycle', () => {
  test('establishes authority cycle using authorityFn', () => {
    const authorityFn = (x: number) => x * 2;
    const result = establishAuthorityCycle(5, authorityFn);
    expect(result.authoritative).toBe(true);
    expect(result.value).toBe(10);
  });

  test('establishes authority cycle with string transformation', () => {
    const authorityFn = (x: string) => `authority:${x}`;
    const result = establishAuthorityCycle('synthesis', authorityFn);
    expect(result.authoritative).toBe(true);
    expect(result.value).toBe('authority:synthesis');
  });

  test('establishes authority cycle with array transformation', () => {
    const authorityFn = (x: number[]) => x.map(n => n * 10);
    const result = establishAuthorityCycle([1, 2, 3], authorityFn);
    expect(result.authoritative).toBe(true);
    expect(result.value).toEqual([10, 20, 30]);
  });

  test('establishes authority cycle with object transformation', () => {
    const authorityFn = (x: { synthesized: string }) => ({ ...x, authority: true });
    const result = establishAuthorityCycle({ synthesized: 'continuum' }, authorityFn);
    expect(result.authoritative).toBe(true);
    expect(result.value).toEqual({ synthesized: 'continuum', authority: true });
  });

  test('establishes authority cycle with identity function', () => {
    const authorityFn = (x: boolean) => x;
    const result = establishAuthorityCycle(true, authorityFn);
    expect(result.authoritative).toBe(true);
    expect(result.value).toBe(true);
  });
});
