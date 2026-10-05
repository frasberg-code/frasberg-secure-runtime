import { bridgeSignature } from '../../supabase/sofia_core/signature_bridge/signature_bridge';

describe('signature_bridge', () => {
  test('bridges local and external signatures', () => {
    expect(bridgeSignature('local', 'external')).toBe('local⇄external');
  });

  test('bridges with uppercase signatures', () => {
    expect(bridgeSignature('SOFIA', 'EXTERNAL')).toBe('SOFIA⇄EXTERNAL');
  });

  test('bridges with numeric signatures', () => {
    expect(bridgeSignature('123', '456')).toBe('123⇄456');
  });

  test('bridges with complex signatures', () => {
    expect(bridgeSignature('local-id-123', 'ext-sys-456')).toBe('local-id-123⇄ext-sys-456');
  });

  test('handles empty signatures', () => {
    expect(bridgeSignature('', '')).toBe('⇄');
  });

  test('handles single empty signature', () => {
    expect(bridgeSignature('local', '')).toBe('local⇄');
    expect(bridgeSignature('', 'external')).toBe('⇄external');
  });

  test('preserves signature case and format', () => {
    expect(bridgeSignature('MixedCase', 'lower_case')).toBe('MixedCase⇄lower_case');
  });
});
