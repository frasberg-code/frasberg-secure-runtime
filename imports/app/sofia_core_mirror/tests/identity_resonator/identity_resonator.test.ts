import { resonateIdentity } from '../../supabase/sofia_core/identity_resonator/identity_resonator';

describe('identity_resonator', () => {
  test('resonates identity with amplitude', () => {
    expect(resonateIdentity('MR', 3)).toBe('MR::~~~');
  });

  test('resonates with amplitude of 1', () => {
    expect(resonateIdentity('SOFIA', 1)).toBe('SOFIA::~');
  });

  test('resonates with amplitude of 5', () => {
    expect(resonateIdentity('USER', 5)).toBe('USER::~~~~~');
  });

  test('handles zero amplitude as minimum 1', () => {
    expect(resonateIdentity('SYSTEM', 0)).toBe('SYSTEM::~');
  });

  test('handles negative amplitude as minimum 1', () => {
    expect(resonateIdentity('TEST', -5)).toBe('TEST::~');
  });

  test('handles empty signature', () => {
    expect(resonateIdentity('', 3)).toBe('::~~~');
  });

  test('handles large amplitude', () => {
    expect(resonateIdentity('ID', 10)).toBe('ID::~~~~~~~~~~');
  });

  test('preserves signature content', () => {
    expect(resonateIdentity('COMPLEX_SIG_123', 2)).toBe('COMPLEX_SIG_123::~~');
  });
});
