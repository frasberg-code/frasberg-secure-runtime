import { executeFieldDecision } from '../../supabase/sofia_core/field_execution/field_execution';

describe('field_execution', () => {
  test('executes decision using executor', () => {
    const executor = (x: number) => x * 2;
    const result = executeFieldDecision(5, executor);
    expect(result.executed).toBe(true);
    expect(result.output).toBe(10);
  });

  test('executes string decision', () => {
    const executor = (x: string) => x.toUpperCase();
    const result = executeFieldDecision('hello', executor);
    expect(result.executed).toBe(true);
    expect(result.output).toBe('HELLO');
  });

  test('executes object decision', () => {
    const executor = (x: { value: number }) => ({ value: x.value + 1 });
    const result = executeFieldDecision({ value: 10 }, executor);
    expect(result.executed).toBe(true);
    expect(result.output).toEqual({ value: 11 });
  });

  test('executes with identity executor', () => {
    const executor = (x: string) => x;
    const result = executeFieldDecision('test', executor);
    expect(result.executed).toBe(true);
    expect(result.output).toBe('test');
  });

  test('executes boolean decision', () => {
    const executor = (x: boolean) => !x;
    const result = executeFieldDecision(true, executor);
    expect(result.executed).toBe(true);
    expect(result.output).toBe(false);
  });
});
