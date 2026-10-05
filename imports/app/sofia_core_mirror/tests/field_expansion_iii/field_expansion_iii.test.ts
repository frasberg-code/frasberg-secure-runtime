import { expandFieldStateIII } from '../../supabase/sofia_core/field_expansion_iii/field_expansion_iii';

describe('field_expansion_iii', () => {
  test('expands apex-III using expander', () => {
    const expander = (x: number) => x * 3;
    const result = expandFieldStateIII(10, expander);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe(30);
  });

  test('expands string apex-III', () => {
    const expander = (x: string) => `${x}::expanded3`;
    const result = expandFieldStateIII('apex3', expander);
    expect(result.expanded).toBe(true);
    expect(result.value).toBe('apex3::expanded3');
  });
});
