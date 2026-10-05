import { applyHarmonics } from '../../supabase/sofia_core/signature_harmonics/signature_harmonics';

describe('signature_harmonics', () => {
  test('applies tonal harmonics to signature', () => {
    expect(applyHarmonics('MR', 'intense')).toBe('MR~intense');
  });

  test('applies soft tonal harmonic', () => {
    expect(applyHarmonics('SOFIA', 'soft')).toBe('SOFIA~soft');
  });

  test('applies neutral tonal harmonic', () => {
    expect(applyHarmonics('USER', 'neutral')).toBe('USER~neutral');
  });

  test('applies intense tonal harmonic', () => {
    expect(applyHarmonics('SYSTEM', 'intense')).toBe('SYSTEM~intense');
  });

  test('handles empty signature', () => {
    expect(applyHarmonics('', 'neutral')).toBe('~neutral');
  });
});
