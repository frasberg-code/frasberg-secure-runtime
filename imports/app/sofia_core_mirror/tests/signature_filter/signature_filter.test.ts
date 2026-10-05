import { filterSignature } from '../../supabase/sofia_core/signature_filter/signature_filter';

describe('signature_filter', () => {
  test('filters and shapes signature', () => {
    expect(filterSignature(' mr ')).toBe('MR');
  });

  test('trims whitespace', () => {
    expect(filterSignature('  sofia  ')).toBe('SOFIA');
  });

  test('converts to uppercase', () => {
    expect(filterSignature('lowercase')).toBe('LOWERCASE');
  });

  test('handles empty strings', () => {
    expect(filterSignature('')).toBe('');
  });

  test('handles already formatted strings', () => {
    expect(filterSignature('ALREADY')).toBe('ALREADY');
  });
});
