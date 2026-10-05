import { bindCoherence } from '../../supabase/sofia_core/coherence_binder/coherence_binder';

describe('coherence_binder', () => {
  test('binds coherence across overlays', () => {
    const result = bindCoherence({ a: 1 }, [{ b: 2 }, { c: 3 }]);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  test('handles empty overlays array', () => {
    const base = { a: 1, b: 2 };
    const result = bindCoherence(base, []);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  test('later overlays override earlier values', () => {
    const result = bindCoherence({ a: 1 }, [{ a: 2 }, { a: 3 }]);
    expect(result).toEqual({ a: 3 });
  });

  test('merges multiple overlay properties', () => {
    const result = bindCoherence(
      { base: 'value' },
      [{ layer1: 'one' }, { layer2: 'two' }, { layer3: 'three' }]
    );
    expect(result).toEqual({ base: 'value', layer1: 'one', layer2: 'two', layer3: 'three' });
  });

  test('handles complex nested structures', () => {
    const result = bindCoherence(
      { a: { nested: 'base' } },
      [{ b: { nested: 'overlay' } }]
    );
    expect(result).toEqual({ a: { nested: 'base' }, b: { nested: 'overlay' } });
  });

  test('preserves base properties not in overlays', () => {
    const result = bindCoherence(
      { preserved: 'value', overridden: 'base' },
      [{ overridden: 'overlay', added: 'new' }]
    );
    expect(result).toEqual({ preserved: 'value', overridden: 'overlay', added: 'new' });
  });

  test('handles empty base object', () => {
    const result = bindCoherence({}, [{ a: 1 }, { b: 2 }]);
    expect(result).toEqual({ a: 1, b: 2 });
  });
});
