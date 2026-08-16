import { routeSignature } from '../../supabase/frasberg/signature_router/signature_router';

describe('signature_router', () => {
  test('routes signature to destination', () => {
    expect(routeSignature('Frasberg Selassie', 'engine')).toBe('Frasberg Selassie=>engine');
  });

  test('routes to bridge', () => {
    expect(routeSignature('FRASBERG', 'bridge')).toBe('FRASBERG=>bridge');
  });

  test('routes to synth', () => {
    expect(routeSignature('ID', 'synth')).toBe('ID=>synth');
  });

  test('handles empty signature', () => {
    expect(routeSignature('', 'engine')).toBe('=>engine');
  });

  test('handles complex signatures', () => {
    expect(routeSignature('Frasberg Selassie:CONTEXT', 'bridge')).toBe('Frasberg Selassie:CONTEXT=>bridge');
  });
});
