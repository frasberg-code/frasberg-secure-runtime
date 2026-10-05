import { generateResponse } from '../../supabase/sofia_core/field_response/field_response';

describe('field_response', () => {
  test('applies response rule', () => {
    const rule = (x: unknown) => (x as number) * 2;
    expect(generateResponse(5, rule)).toBe(10);
  });

  test('handles identity function', () => {
    const rule = (x: unknown) => x;
    expect(generateResponse(42, rule)).toBe(42);
  });

  test('handles string transformation', () => {
    const rule = (x: unknown) => (x as string).toUpperCase();
    expect(generateResponse('hello', rule)).toBe('HELLO');
  });

  test('handles complex transformations', () => {
    const rule = (x: unknown) => (x as number) * (x as number) + 1;
    expect(generateResponse(3, rule)).toBe(10);
  });

  test('handles object input', () => {
    const rule = (x: unknown) => ({ ...(x as Record<string, unknown>), processed: true });
    const input = { value: 42 };
    expect(generateResponse(input, rule)).toEqual({ value: 42, processed: true });
  });
});
