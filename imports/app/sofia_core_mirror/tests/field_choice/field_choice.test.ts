import { chooseFieldOption } from '../../supabase/sofia_core/field_choice/field_choice';

describe('field_choice', () => {
  test('chooses option using selector', () => {
    const options = [1, 2, 3];
    const selector = (candidates: Array<number>) => candidates[2];
    expect(chooseFieldOption(options, selector)).toBe(3);
  });

  test('throws error for empty options array', () => {
    const options: number[] = [];
    const selector = (candidates: Array<number>) => candidates[0];
    expect(() => chooseFieldOption(options, selector)).toThrow('No options available for choice');
  });

  test('chooses first option when selector returns first', () => {
    const options = ['A', 'B', 'C'];
    const selector = (candidates: Array<string>) => candidates[0];
    expect(chooseFieldOption(options, selector)).toBe('A');
  });

  test('chooses option based on custom logic', () => {
    const options = [10, 20, 30, 40];
    const selector = (candidates: Array<number>) => candidates.reduce((max, val) => val > max ? val : max);
    expect(chooseFieldOption(options, selector)).toBe(40);
  });

  test('works with single option', () => {
    const options = [42];
    const selector = (candidates: Array<number>) => candidates[0];
    expect(chooseFieldOption(options, selector)).toBe(42);
  });
});
