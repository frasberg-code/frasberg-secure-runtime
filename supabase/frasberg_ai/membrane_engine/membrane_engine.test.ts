import { enforceMembrane } from './membrane_engine_runtime';
import spec from './membrane_engine_spec.json';

describe('Membrane Engine Runtime', () => {
  test('accepts valid membrane values', () => {
    const context = {
      membrane: {
        pressure: 0.8,
        symmetry: 0.7
      }
    };

    const result = enforceMembrane('Sample output', context);
    expect(result).toBe(true);
  });

  test('rejects low pressure', () => {
    const context = {
      membrane: {
        pressure: 0.2,
        symmetry: 0.7
      }
    };

    const result = enforceMembrane('Sample output', context);
    expect(result).toBe(false);
  });

  test('rejects high pressure', () => {
    const context = {
      membrane: {
        pressure: 1.2,
        symmetry: 0.7
      }
    };

    const result = enforceMembrane('Sample output', context);
    expect(result).toBe(false);
  });

  test('rejects symmetry below threshold', () => {
    const context = {
      membrane: {
        pressure: 0.8,
        symmetry: 0.3
      }
    };

    const result = enforceMembrane('Sample output', context);
    expect(result).toBe(false);
  });
});
