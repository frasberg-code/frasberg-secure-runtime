import { convergeFieldAlignment } from '../../supabase/sofia_core/field_convergence/field_convergence';

describe('field_convergence', () => {
  test('converges orientations using converger', () => {
    const converger = (values: string[]) => values.join('|');
    const result = convergeFieldAlignment(['N', 'NE', 'E'], converger);
    expect(result.converged).toBe(true);
    expect(result.center).toBe('N|NE|E');
  });

  test('converges numeric orientations using converger', () => {
    const converger = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    const result = convergeFieldAlignment([10, 20, 30], converger);
    expect(result.converged).toBe(true);
    expect(result.center).toBe(20);
  });

  test('converges object orientations using converger', () => {
    const converger = (values: Array<{ value: number }>) => ({
      value: values.reduce((sum, obj) => sum + obj.value, 0),
    });
    const result = convergeFieldAlignment(
      [{ value: 5 }, { value: 10 }, { value: 15 }],
      converger
    );
    expect(result.converged).toBe(true);
    expect(result.center).toEqual({ value: 30 });
  });

  test('throws error when no orientations provided', () => {
    const converger = (values: string[]) => values[0];
    expect(() => convergeFieldAlignment([], converger)).toThrow(
      'No orientations provided for convergence'
    );
  });

  test('handles single orientation', () => {
    const converger = (values: number[]) => values[0];
    const result = convergeFieldAlignment([42], converger);
    expect(result.converged).toBe(true);
    expect(result.center).toBe(42);
  });

  test('handles boolean convergence', () => {
    const converger = (values: boolean[]) => values.every((v) => v);
    const result = convergeFieldAlignment([true, true, true], converger);
    expect(result.converged).toBe(true);
    expect(result.center).toBe(true);
  });
});
