import { filterIdentity } from '../../supabase/sofia_core/identity_filter/identity_filter';

describe('identity_filter - filterIdentity function', () => {
  test('filters identity input removing special characters', () => {
    expect(filterIdentity('hello@world!')).toBe('HELLOWORLD');
  });

  test('removes noise and keeps alphanumeric and dashes', () => {
    expect(filterIdentity('sofia-123')).toBe('SOFIA-123');
  });

  test('converts to uppercase', () => {
    expect(filterIdentity('lowercase')).toBe('LOWERCASE');
  });

  test('handles already clean input', () => {
    expect(filterIdentity('CLEAN123')).toBe('CLEAN123');
  });

  test('removes spaces and special characters', () => {
    expect(filterIdentity('user name 123!')).toBe('USERNAME123');
  });

  test('preserves dashes but removes other punctuation', () => {
    expect(filterIdentity('test-id_123.456')).toBe('TEST-ID123456');
  });

  test('handles empty string', () => {
    expect(filterIdentity('')).toBe('');
  });

  test('removes all non-alphanumeric except dashes', () => {
    expect(filterIdentity('a@b#c$d%e^f&g*h(i)j')).toBe('ABCDEFGHIJ');
  });

  test('handles input with only special characters', () => {
    expect(filterIdentity('!@#$%^&*()')).toBe('');
  });

  test('preserves numbers and letters with dashes', () => {
    expect(filterIdentity('user-123-test')).toBe('USER-123-TEST');
  });
});
