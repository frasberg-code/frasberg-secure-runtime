import { synthesizeFieldCycles } from '../../supabase/sofia_core/field_synthesis/field_synthesis';

describe('field_synthesis', () => {
  test('synthesizes cycles using synthesizer', () => {
    const synth = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    expect(synthesizeFieldCycles([1, 2, 3], synth)).toBe(6);
  });

  test('handles single cycle', () => {
    const synth = (arr: number[]) => arr[0];
    expect(synthesizeFieldCycles([42], synth)).toBe(42);
  });

  test('handles string cycles', () => {
    const synth = (arr: string[]) => arr.join('-');
    expect(synthesizeFieldCycles(['A', 'B', 'C'], synth)).toBe('A-B-C');
  });

  test('handles object cycles', () => {
    const synth = (arr: { value: number }[]) => ({
      value: arr.reduce((sum, obj) => sum + obj.value, 0),
    });
    const result = synthesizeFieldCycles(
      [{ value: 1 }, { value: 2 }, { value: 3 }],
      synth
    );
    expect(result).toEqual({ value: 6 });
  });

  test('throws error when no cycles provided', () => {
    const synth = (arr: number[]) => arr[0];
    expect(() => synthesizeFieldCycles([], synth)).toThrow(
      'No cycles provided for synthesis'
    );
  });

  test('handles custom synthesizer logic', () => {
    const synth = (arr: number[]) => Math.max(...arr);
    expect(synthesizeFieldCycles([5, 2, 8, 1], synth)).toBe(8);
  });
});
