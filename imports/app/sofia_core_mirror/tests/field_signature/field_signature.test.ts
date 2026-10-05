import { computeFieldSignature } from '../../supabase/sofia_core/field_signature/field_signature';

describe('field_signature', () => {
  test('computes identity signature using signer and validator', () => {
    const signer = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const validator = (x: number) => x > 0;
    const result = computeFieldSignature([1, 2, 3], signer, validator);
    expect(result.signature).toBe(6);
    expect(result.valid).toBe(true);
  });

  test('marks signature as invalid when validator fails', () => {
    const signer = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const validator = (x: number) => x > 100;
    const result = computeFieldSignature([1, 2, 3], signer, validator);
    expect(result.signature).toBe(6);
    expect(result.valid).toBe(false);
  });

  test('handles string signature computation', () => {
    const signer = (arr: string[]) => arr.join('-');
    const validator = (x: string) => x.length > 0;
    const result = computeFieldSignature(['A', 'B', 'C'], signer, validator);
    expect(result.signature).toBe('A-B-C');
    expect(result.valid).toBe(true);
  });

  test('handles object signature computation', () => {
    const signer = (arr: { id: number }[]) => ({ id: arr.length });
    const validator = (x: { id: number }) => x.id > 0;
    const result = computeFieldSignature([{ id: 1 }, { id: 2 }], signer, validator);
    expect(result.signature).toEqual({ id: 2 });
    expect(result.valid).toBe(true);
  });

  test('throws error when no cores provided', () => {
    const signer = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const validator = (x: number) => x > 0;
    expect(() => computeFieldSignature([], signer, validator)).toThrow(
      'No coherent cores provided for signature computation'
    );
  });

  test('handles complex validation logic', () => {
    const signer = (arr: number[]) => arr.reduce((a, b) => a * b, 1);
    const validator = (x: number) => x % 2 === 0;
    const result = computeFieldSignature([2, 3, 4], signer, validator);
    expect(result.signature).toBe(24);
    expect(result.valid).toBe(true);
  });

  test('handles single core signature', () => {
    const signer = (arr: string[]) => arr[0];
    const validator = (x: string) => x.startsWith('valid');
    const result = computeFieldSignature(['valid-signature'], signer, validator);
    expect(result.signature).toBe('valid-signature');
    expect(result.valid).toBe(true);
  });
});
