import { generateIntent } from '../../supabase/sofia_core/field_intent/field_intent';

describe('field_intent', () => {
  test('generates correct intent based on evaluation', () => {
    expect(generateIntent(0.8).intent).toBe('advance');
    expect(generateIntent(-0.8).intent).toBe('retreat');
    expect(generateIntent(0.1).intent).toBe('hold');
  });

  test('generates advance intent for positive values above threshold', () => {
    const intent = generateIntent(0.8);
    expect(intent.intent).toBe('advance');
    expect(intent.weight).toBe(0.8);
  });

  test('generates retreat intent for negative values below threshold', () => {
    const intent = generateIntent(-0.8);
    expect(intent.intent).toBe('retreat');
    expect(intent.weight).toBe(0.8);
  });

  test('generates hold intent for values near zero', () => {
    const intent = generateIntent(0.1);
    expect(intent.intent).toBe('hold');
    expect(intent.weight).toBe(0.1);
  });

  test('generates hold intent at positive boundary', () => {
    const intent = generateIntent(0.5);
    expect(intent.intent).toBe('hold');
    expect(intent.weight).toBe(0.5);
  });

  test('generates hold intent at negative boundary', () => {
    const intent = generateIntent(-0.5);
    expect(intent.intent).toBe('hold');
    expect(intent.weight).toBe(0.5);
  });

  test('generates advance intent just above threshold', () => {
    const intent = generateIntent(0.51);
    expect(intent.intent).toBe('advance');
    expect(intent.weight).toBe(0.51);
  });

  test('generates retreat intent just below threshold', () => {
    const intent = generateIntent(-0.51);
    expect(intent.intent).toBe('retreat');
    expect(intent.weight).toBe(0.51);
  });
});
