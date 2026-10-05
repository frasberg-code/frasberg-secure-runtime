import { modulateIdentity } from '../../supabase/sofia_core/identity_modulator/identity_modulator';

describe('identity_modulator', () => {
  test('modulates identity based on mode', () => {
    expect(modulateIdentity('MR', 'direct')).toBe('MR');
  });

  test('applies formal modulation', () => {
    expect(modulateIdentity('SOFIA', 'formal')).toBe('[FORMAL] SOFIA');
  });

  test('applies ceremonial modulation', () => {
    expect(modulateIdentity('SOFIA', 'ceremonial')).toBe('🌿 SOFIA 🌿');
  });

  test('returns signature unchanged in direct mode', () => {
    const signature = 'TEST_SIGNATURE';
    expect(modulateIdentity(signature, 'direct')).toBe(signature);
  });

  test('handles empty signature', () => {
    expect(modulateIdentity('', 'formal')).toBe('[FORMAL] ');
    expect(modulateIdentity('', 'ceremonial')).toBe('🌿  🌿');
    expect(modulateIdentity('', 'direct')).toBe('');
  });
});
