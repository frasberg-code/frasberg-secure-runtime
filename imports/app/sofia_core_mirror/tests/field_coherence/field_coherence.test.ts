import { computeFieldCoherence } from '../../supabase/sofia_core/field_coherence/field_coherence';

describe('field_coherence', () => {
  test('computes coherence using validator', () => {
    const validator = (value: number) => value > 0;
    const result = computeFieldCoherence(10, validator);
    expect(result.coherent).toBe(true);
    expect(result.core).toBe(10);
  });

  test('marks as incoherent when validator fails', () => {
    const validator = (value: number) => value > 100;
    const result = computeFieldCoherence(10, validator);
    expect(result.coherent).toBe(false);
    expect(result.core).toBe(10);
  });

  test('handles string coherence validation', () => {
    const validator = (value: string) => value.length > 0;
    const result = computeFieldCoherence('valid', validator);
    expect(result.coherent).toBe(true);
    expect(result.core).toBe('valid');
  });

  test('handles object coherence validation', () => {
    const validator = (value: { valid: boolean }) => value.valid === true;
    const result = computeFieldCoherence({ valid: true }, validator);
    expect(result.coherent).toBe(true);
    expect(result.core).toEqual({ valid: true });
  });

  test('handles array coherence validation', () => {
    const validator = (value: number[]) => value.length > 0;
    const result = computeFieldCoherence([1, 2, 3], validator);
    expect(result.coherent).toBe(true);
    expect(result.core).toEqual([1, 2, 3]);
  });

  test('handles boolean coherence validation', () => {
    const validator = (value: boolean) => value === true;
    const result = computeFieldCoherence(true, validator);
    expect(result.coherent).toBe(true);
    expect(result.core).toBe(true);
  });

  test('preserves core value even when incoherent', () => {
    const validator = (value: string) => value === 'expected';
    const result = computeFieldCoherence('unexpected', validator);
    expect(result.coherent).toBe(false);
    expect(result.core).toBe('unexpected');
  });
});
