import { orchestrate } from '../../supabase/sofia_core/orchestration_engine/orchestration_engine';

describe('orchestration_engine', () => {
  test('orchestrates modules in sequence', () => {
    const modules = {
      a: (x: number) => x + 1,
      b: (x: number) => x * 2,
    };
    expect(orchestrate(modules, 1)).toBe(4);
  });

  test('orchestrates with single module', () => {
    const modules = {
      a: (x: number) => x + 10,
    };
    expect(orchestrate(modules, 5)).toBe(15);
  });

  test('orchestrates with empty modules', () => {
    const modules = {};
    expect(orchestrate(modules, 42)).toBe(42);
  });

  test('orchestrates with multiple transformations', () => {
    const modules = {
      double: (x: number) => x * 2,
      addFive: (x: number) => x + 5,
      square: (x: number) => x * x,
    };
    // (2 * 2 + 5) * (2 * 2 + 5) = 9 * 9 = 81
    expect(orchestrate(modules, 2)).toBe(81);
  });

  test('orchestrates with string transformations', () => {
    const modules = {
      prefix: (s: string) => `hello_${s}`,
      suffix: (s: string) => `${s}_world`,
    };
    expect(orchestrate(modules, 'test')).toBe('hello_test_world');
  });
});
