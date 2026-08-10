import { enforceRegister } from './register_engine_runtime';
import spec from './register_engine_spec.json';

describe('Register Engine Runtime', () => {
  test('accepts valid register with no transition', () => {
    const context = {
      register: 'operational'
    };

    const result = enforceRegister('Sample output', context);
    expect(result).toBe(true);
  });

  test('accepts valid transition: ceremonial → operational', () => {
    const context = {
      previous_register: 'ceremonial',
      register: 'operational'
    };

    const result = enforceRegister('Sample output', context);
    expect(result).toBe(true);
  });

  test('rejects restricted transition: conceptual → ceremonial', () => {
    const context = {
      previous_register: 'conceptual',
      register: 'ceremonial'
    };

    const result = enforceRegister('Sample output', context);
    expect(result).toBe(false);
  });

  test('rejects missing register', () => {
    const context = {};

    const result = enforceRegister('Sample output', context);
    expect(result).toBe(false);
  });
});
