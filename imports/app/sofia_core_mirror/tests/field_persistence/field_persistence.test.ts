import { ensureFieldPersistence } from '../../supabase/sofia_core/field_persistence/field_persistence';

describe('field_persistence', () => {
  test('ensures persistence using validator', () => {
    const validator = (x: number) => x > 0;
    const result = ensureFieldPersistence(5, validator);
    expect(result.persistent).toBe(true);
    expect(result.value).toBe(5);
  });

  test('marks as non-persistent when validator fails', () => {
    const validator = (x: number) => x > 0;
    const result = ensureFieldPersistence(-5, validator);
    expect(result.persistent).toBe(false);
    expect(result.value).toBe(-5);
  });

  test('handles string validation', () => {
    const validator = (s: string) => s.length > 0;
    const result = ensureFieldPersistence('valid', validator);
    expect(result.persistent).toBe(true);
    expect(result.value).toBe('valid');
  });

  test('handles empty string as invalid', () => {
    const validator = (s: string) => s.length > 0;
    const result = ensureFieldPersistence('', validator);
    expect(result.persistent).toBe(false);
    expect(result.value).toBe('');
  });

  test('handles object validation', () => {
    const validator = (obj: { valid: boolean }) => obj.valid;
    const result = ensureFieldPersistence({ valid: true }, validator);
    expect(result.persistent).toBe(true);
    expect(result.value).toEqual({ valid: true });
  });

  test('handles array validation', () => {
    const validator = (arr: number[]) => arr.length > 0;
    const result = ensureFieldPersistence([1, 2, 3], validator);
    expect(result.persistent).toBe(true);
    expect(result.value).toEqual([1, 2, 3]);
  });

  test('handles complex validation logic', () => {
    const validator = (x: number) => x % 2 === 0 && x > 0;
    const result1 = ensureFieldPersistence(4, validator);
    expect(result1.persistent).toBe(true);

    const result2 = ensureFieldPersistence(3, validator);
    expect(result2.persistent).toBe(false);

    const result3 = ensureFieldPersistence(-2, validator);
    expect(result3.persistent).toBe(false);
  });
});
