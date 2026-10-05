import { expandFieldState } from '../../supabase/sofia_core/field_expansion/field_expansion';

test('expands field using expander', () => {
  const expander = (x: number) => x * 3;
  const result = expandFieldState(4, expander);
  expect(result.expanded).toBe(true);
  expect(result.value).toBe(12);
});
