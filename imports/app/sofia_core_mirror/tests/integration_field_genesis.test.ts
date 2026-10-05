import { fieldGenesis } from '../supabase/sofia_core/sofia_core_runtime';

describe('Field Genesis Triad Runtime Integration', () => {
  test('fieldGenesis exports all three functions', () => {
    expect(fieldGenesis).toBeDefined();
    expect(fieldGenesis.returnToOrigin).toBeDefined();
    expect(fieldGenesis.generateFieldState).toBeDefined();
    expect(fieldGenesis.continueGenesis).toBeDefined();
  });

  test('returnToOrigin is callable from runtime', () => {
    const result = fieldGenesis.returnToOrigin(100, (x: number) => x - 50);
    expect(result.origin).toBe(true);
    expect(result.value).toBe(50);
  });

  test('generateFieldState is callable from runtime', () => {
    const result = fieldGenesis.generateFieldState('seed', (x: string) => `gen:${x}`);
    expect(result.generated).toBe(true);
    expect(result.value).toBe('gen:seed');
  });

  test('continueGenesis is callable from runtime', () => {
    const result = fieldGenesis.continueGenesis([1, 2], (x: number[]) => [...x, 3]);
    expect(result.continuous).toBe(true);
    expect(result.value).toEqual([1, 2, 3]);
  });

  test('full triad workflow: horizon -> origin -> generation -> continuum', () => {
    // Step 1: Return to origin
    const originState = fieldGenesis.returnToOrigin(
      1000,
      (h: number) => 0
    );
    expect(originState.origin).toBe(true);
    expect(originState.value).toBe(0);

    // Step 2: Generate from origin
    const generatedState = fieldGenesis.generateFieldState(
      originState.value,
      (o: number) => o + 100
    );
    expect(generatedState.generated).toBe(true);
    expect(generatedState.value).toBe(100);

    // Step 3: Continue into continuum
    const continuumState = fieldGenesis.continueGenesis(
      generatedState.value,
      (g: number) => g + 50
    );
    expect(continuumState.continuous).toBe(true);
    expect(continuumState.value).toBe(150);
  });
});
