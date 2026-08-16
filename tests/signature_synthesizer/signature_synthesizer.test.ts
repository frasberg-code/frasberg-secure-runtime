import { synthesizeSignature } from '../../supabase/frasberg/signature_synthesizer/signature_synthesizer';

describe('signature_synthesizer', () => {
  test('synthesizes signature with mode', () => {
    expect(synthesizeSignature('Frasberg Selassie', 'direct')).toBe('MR::direct');
  });

  test('synthesizes with different base', () => {
    expect(synthesizeSignature('FRASBERG', 'adaptive')).toBe('FRASBERG::adaptive');
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
