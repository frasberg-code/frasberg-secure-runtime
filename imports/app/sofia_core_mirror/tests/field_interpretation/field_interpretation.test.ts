import { interpretField } from '../../supabase/sofia_core/field_interpretation/field_interpretation';

describe('field_interpretation', () => {
  test('interprets field value using interpreter', () => {
    const interpreter = (x: number) => x * 3;
    expect(interpretField(4, interpreter)).toBe(12);
  });

  test('handles identity interpretation', () => {
    const interpreter = (x: number) => x;
    expect(interpretField(42, interpreter)).toBe(42);
  });

  test('handles string interpretation', () => {
    const interpreter = (x: string) => x.toUpperCase();
    expect(interpretField('hello', interpreter)).toBe('HELLO');
  });

  test('handles complex type interpretation', () => {
    const interpreter = (x: number) => ({ value: x, doubled: x * 2 });
    expect(interpretField(5, interpreter)).toEqual({ value: 5, doubled: 10 });
  });

  test('handles object input interpretation', () => {
    const interpreter = (x: { count: number }) => x.count * 10;
    expect(interpretField({ count: 3 }, interpreter)).toBe(30);
  });
});
