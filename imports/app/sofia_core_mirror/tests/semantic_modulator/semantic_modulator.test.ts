import { modulateSemantics } from '../../supabase/sofia_core/semantic_modulator/semantic_modulator';

describe('semantic_modulator', () => {
  test('modulates semantics with mode', () => {
    const result = modulateSemantics({ value: 1 }, 'contextual');
    expect(result.semantic_mode).toBe('contextual');
  });

  test('preserves input data', () => {
    const result = modulateSemantics({ value: 1, key: 'test' }, 'literal');
    expect(result.value).toBe(1);
    expect(result.key).toBe('test');
  });

  test('applies literal mode', () => {
    const result = modulateSemantics({ data: 'example' }, 'literal');
    expect(result.semantic_mode).toBe('literal');
  });

  test('applies abstract mode', () => {
    const result = modulateSemantics({ data: 'example' }, 'abstract');
    expect(result.semantic_mode).toBe('abstract');
  });

  test('applies contextual mode', () => {
    const result = modulateSemantics({ data: 'example' }, 'contextual');
    expect(result.semantic_mode).toBe('contextual');
  });
});
