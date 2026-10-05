import { expressFieldIdentity } from '../../supabase/sofia_core/field_expression/field_expression';

describe('field_expression', () => {
  test('expresses identity using expressor', () => {
    const expressor = (x: string) => `expr:${x}`;
    const result = expressFieldIdentity('ID', expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toBe('expr:ID');
  });

  test('handles numeric identity expression', () => {
    const expressor = (x: number) => x * 2;
    const result = expressFieldIdentity(5, expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toBe(10);
  });

  test('handles object identity expression', () => {
    const expressor = (x: { name: string }) => ({ name: x.name.toUpperCase() });
    const result = expressFieldIdentity({ name: 'sofia' }, expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toEqual({ name: 'SOFIA' });
  });

  test('handles array identity expression', () => {
    const expressor = (x: number[]) => x.map(n => n + 1);
    const result = expressFieldIdentity([1, 2, 3], expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toEqual([2, 3, 4]);
  });

  test('handles complex transformation', () => {
    const expressor = (x: { values: number[] }) => ({
      values: x.values.filter(n => n > 0),
    });
    const result = expressFieldIdentity({ values: [-1, 0, 1, 2] }, expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toEqual({ values: [1, 2] });
  });

  test('handles boolean identity expression', () => {
    const expressor = (x: boolean) => !x;
    const result = expressFieldIdentity(true, expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toBe(false);
  });

  test('always marks as expressed', () => {
    const expressor = (x: string) => x;
    const result = expressFieldIdentity('unchanged', expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toBe('unchanged');
  });

  test('handles string transformation expression', () => {
    const expressor = (x: string) => x.split('').reverse().join('');
    const result = expressFieldIdentity('hello', expressor);
    expect(result.expressed).toBe(true);
    expect(result.output).toBe('olleh');
  });
});
