import { generateExpression } from '../../supabase/sofia_core/expression_engine/expression_engine';

describe('expression_engine', () => {
  test('generates layered expression', () => {
    const layers: Array<(input: unknown) => unknown> = [
      (x: unknown) => (x as number) + 1,
      (x: unknown) => (x as number) * 3,
    ];
    expect(generateExpression(layers, 2)).toBe(9);
  });

  test('applies single layer transformation', () => {
    const layers: Array<(input: unknown) => unknown> = [
      (x: unknown) => (x as number) * 2
    ];
    expect(generateExpression(layers, 5)).toBe(10);
  });

  test('applies multiple layer transformations in order', () => {
    const layers: Array<(input: unknown) => unknown> = [
      (x: unknown) => (x as number) + 10,
      (x: unknown) => (x as number) * 2,
      (x: unknown) => (x as number) - 5,
    ];
    expect(generateExpression(layers, 0)).toBe(15);
  });

  test('handles empty layers array', () => {
    const layers: Array<(input: unknown) => unknown> = [];
    expect(generateExpression(layers, 42)).toBe(42);
  });

  test('works with string transformations', () => {
    const layers: Array<(input: unknown) => unknown> = [
      (x: unknown) => (x as string).toUpperCase(),
      (x: unknown) => (x as string) + '!',
    ];
    expect(generateExpression(layers, 'hello')).toBe('HELLO!');
  });
});
