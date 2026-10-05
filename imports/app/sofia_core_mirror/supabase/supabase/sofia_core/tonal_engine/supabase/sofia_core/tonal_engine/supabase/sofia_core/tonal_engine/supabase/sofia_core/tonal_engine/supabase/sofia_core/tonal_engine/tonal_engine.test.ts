import { enforceTonalGovernance } from './tonal_engine_runtime';
import spec from './tonal_engine_spec.json';

describe('Tonal Engine Runtime', () => {
  test('accepts valid output with correct context', () => {
    const context = {
      register: 'ceremonial',
      hinge: 'locked',
      membrane: { pressure: 0.8, symmetry: 0.7 }
    };

    const result = enforceTonalGovernance('Sofia output sample', context);
    expect(result).toBe(true);
  });

  test('rejects output with invalid register', () => {
    const context = {
      register: 'invalid',
      hinge: 'locked',
      membrane: { pressure: 0.8, symmetry: 0.7 }
    };

    const result = enforceTonalGovernance('Sofia output sample', context);
    expect(result).toBe(false);
  });

  test('rejects output with membrane violation', () => {
    const context = {
      register: 'operational',
      hinge: 'fluid',
      membrane: { pressure: 0.2, symmetry: 0.1 }
    };

    const result = enforceTonalGovernance('Sofia output sample', context);
    expect(result).toBe(false);
  });
});
