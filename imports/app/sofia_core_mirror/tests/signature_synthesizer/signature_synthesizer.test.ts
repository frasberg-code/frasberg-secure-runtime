import { synthesizeSignature } from '../../supabase/sofia_core/signature_synthesizer/signature_synthesizer';

describe('signature_synthesizer', () => {
  test('synthesizes signature with mode', () => {
    expect(synthesizeSignature('MR', 'direct')).toBe('MR::direct');
  });

  test('synthesizes with different base', () => {
    expect(synthesizeSignature('SOFIA', 'adaptive')).toBe('SOFIA::adaptive');
  });

  test('synthesizes with numeric mode', () => {
    expect(synthesizeSignature('ENGINE', '42')).toBe('ENGINE::42');
  });

  test('synthesizes with empty mode', () => {
    expect(synthesizeSignature('BASE', '')).toBe('BASE::');
  });

  test('synthesizes with complex mode', () => {
    expect(synthesizeSignature('CORE', 'runtime-orchestration')).toBe('CORE::runtime-orchestration');
  });
});
