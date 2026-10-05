import { synthesizeIdentity } from '../../supabase/sofia_core/identity_synthesizer/identity_synthesizer';

describe('identity_synthesizer', () => {
  test('synthesizes expressive identity', () => {
    expect(synthesizeIdentity('MR', 'test', 3)).toBe('MR:test:3');
  });

  test('handles different intensity levels', () => {
    expect(synthesizeIdentity('SOFIA', 'context', 5)).toBe('SOFIA:context:5');
  });

  test('handles zero intensity', () => {
    expect(synthesizeIdentity('ID', 'minimal', 0)).toBe('ID:minimal:0');
  });

  test('handles negative intensity', () => {
    expect(synthesizeIdentity('BASE', 'negative', -1)).toBe('BASE:negative:-1');
  });

  test('handles empty strings', () => {
    expect(synthesizeIdentity('', '', 1)).toBe('::1');
  });
});
