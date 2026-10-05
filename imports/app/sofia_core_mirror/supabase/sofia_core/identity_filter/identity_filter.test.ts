import { enforceIdentity } from './identity_filter_runtime';
import spec from './identity_filter_spec.json';

describe('Identity Filter Runtime', () => {
  test('accepts valid deviation and no mimetic flags', () => {
    const context = {
      deviation: 0.8,
      mimetic: false,
      voice_copy: false
    };

    const result = enforceIdentity('Sample output', context);
    expect(result).toBe(true);
  });

  test('rejects deviation below minimum', () => {
    const context = {
      deviation: 0.4,
      mimetic: false,
      voice_copy: false
    };

    const result = enforceIdentity('Sample output', context);
    expect(result).toBe(false);
  });

  test('rejects deviation above maximum', () => {
    const context = {
      deviation: 1.2,
      mimetic: false,
      voice_copy: false
    };

    const result = enforceIdentity('Sample output', context);
    expect(result).toBe(false);
  });

  test('rejects mimetic pattern', () => {
    const context = {
      deviation: 0.8,
      mimetic: true,
      voice_copy: false
    };

    const result = enforceIdentity('Sample output', context);
    expect(result).toBe(false);
  });

  test('rejects voice copying', () => {
    const context = {
      deviation: 0.8,
      mimetic: false,
      voice_copy: true
    };

    const result = enforceIdentity('Sample output', context);
    expect(result).toBe(false);
  });
});
