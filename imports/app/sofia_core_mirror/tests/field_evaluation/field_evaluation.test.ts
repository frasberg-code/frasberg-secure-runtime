import { evaluateField } from '../../supabase/sofia_core/field_evaluation/field_evaluation';

describe('field_evaluation', () => {
  test('evaluates field value using criteria', () => {
    const criteria = (x: number) => x + 10;
    expect(evaluateField(5, criteria)).toBe(15);
  });

  test('handles identity evaluation', () => {
    const criteria = (x: number) => x;
    expect(evaluateField(42, criteria)).toBe(42);
  });

  test('handles scaling evaluation', () => {
    const criteria = (x: number) => x * 0.5;
    expect(evaluateField(20, criteria)).toBe(10);
  });

  test('handles threshold-based evaluation', () => {
    const criteria = (x: number) => (x > 10 ? 1 : 0);
    expect(evaluateField(15, criteria)).toBe(1);
    expect(evaluateField(5, criteria)).toBe(0);
  });

  test('handles normalization evaluation', () => {
    const criteria = (x: number) => (x - 50) / 50;
    expect(evaluateField(75, criteria)).toBe(0.5);
    expect(evaluateField(25, criteria)).toBe(-0.5);
  });
});
