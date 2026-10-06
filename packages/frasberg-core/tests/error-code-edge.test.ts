import { describe, expect, test } from 'vitest';
import { ErrorCode } from '../src/error-codes';

describe('error code integrity', () => {
  test('contains no duplicate values', () => {
    const values = Object.values(ErrorCode);
    expect(new Set(values).size).toBe(values.length);
  });

  test('all values are uppercase and non-empty', () => {
    for (const value of Object.values(ErrorCode)) {
      expect(value).toBe(value.toUpperCase());
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
