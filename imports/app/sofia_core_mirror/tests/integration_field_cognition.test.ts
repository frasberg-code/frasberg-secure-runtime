import { fieldCognition } from '../supabase/sofia_core/sofia_core_runtime';

describe('Field Cognition Runtime Integration', () => {
  test('fieldCognition exports interpretField', () => {
    expect(typeof fieldCognition.interpretField).toBe('function');
    const result = fieldCognition.interpretField(10, (x: number) => x * 2);
    expect(result).toBe(20);
  });

  test('fieldCognition exports evaluateField', () => {
    expect(typeof fieldCognition.evaluateField).toBe('function');
    const result = fieldCognition.evaluateField(5, (x: number) => x + 5);
    expect(result).toBe(10);
  });

  test('fieldCognition exports generateIntent', () => {
    expect(typeof fieldCognition.generateIntent).toBe('function');
    const result = fieldCognition.generateIntent(0.8);
    expect(result.intent).toBe('advance');
    expect(result.weight).toBe(0.8);
  });

  test('fieldCognition integrates all three functions', () => {
    // Simulate a cognition pipeline
    const rawInput = 100;
    const interpreted = fieldCognition.interpretField(rawInput, (x: number) => x / 100);
    const evaluated = fieldCognition.evaluateField(interpreted as number, (x: number) => x - 0.3);
    const intent = fieldCognition.generateIntent(evaluated);
    
    expect(intent.intent).toBe('advance');
    expect(intent.weight).toBe(0.7);
  });
});
