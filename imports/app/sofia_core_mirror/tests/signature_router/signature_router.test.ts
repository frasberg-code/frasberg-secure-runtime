import { routeSignature } from '../../supabase/sofia_core/signature_router/signature_router';

describe('signature_router', () => {
  test('routes signature to destination', () => {
    expect(routeSignature('MR', 'engine')).toBe('MR=>engine');
  });

  test('routes to bridge', () => {
    expect(routeSignature('SOFIA', 'bridge')).toBe('SOFIA=>bridge');
  });

  test('routes to synth', () => {
    expect(routeSignature('ID', 'synth')).toBe('ID=>synth');
  });

  test('handles empty signature', () => {
    expect(routeSignature('', 'engine')).toBe('=>engine');
  });

  test('handles complex signatures', () => {
    expect(routeSignature('MR:CONTEXT', 'bridge')).toBe('MR:CONTEXT=>bridge');
  });
});
