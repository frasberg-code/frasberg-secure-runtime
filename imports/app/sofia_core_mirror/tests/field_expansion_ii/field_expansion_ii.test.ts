import { expandFieldStateII } from '../../supabase/sofia_core/field_expansion_ii/field_expansion_ii';

describe('field_expansion_ii', () => {
  test('expands apex-II using expander', () => {
    const expander = (x: number) => x * 10;
    const result = expandFieldStateII(3, expander);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe(30);
  });

  test('expands string apex-II', () => {
    const expander = (x: string) => `${x}::expanded2`;
    const result = expandFieldStateII('apex2', expander);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe('apex2::expanded2');
  });
});
