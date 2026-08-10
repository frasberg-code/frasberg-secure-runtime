import { modulateIdentity } from '../../supabase/frasberg_ai/identity_modulator/identity_modulator';

describe('identity_modulator', () => {
  test('modulates identity based on mode', () => {
    expect(modulateIdentity('MR', 'direct')).toBe('MR');
  });

  test('applies formal modulation', () => {
    expect(modulateIdentity('FRASBERG', 'formal')).toBe('[FORMAL] FRASBERG');
  });

  test('applies ceremonial modulation', () => {
    expect(modulateIdentity('FRASBERG', 'ceremonial')).toBe('🌿 FRASBERG 🌿');
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
