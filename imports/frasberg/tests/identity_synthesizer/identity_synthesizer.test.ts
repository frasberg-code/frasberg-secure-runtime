import { synthesizeIdentity } from '../../supabase/frasberg/identity_synthesizer/identity_synthesizer';

describe('identity_synthesizer', () => {
  test('synthesizes expressive identity', () => {
    expect(synthesizeIdentity('Frasberg Selassie', 'test', 3)).toBe('Frasberg Selassie:test:3');
  });

  test('handles different intensity levels', () => {
    expect(synthesizeIdentity('FRASBERG', 'context', 5)).toBe('FRASBERG:context:5');
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
