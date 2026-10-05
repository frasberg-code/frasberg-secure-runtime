/**
 * missing_providers.test.ts
 * Tests for detecting missing capability providers
 */

import { validateCapabilities, EngineCapabilities } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capabilities';

describe('Sofia Core Application Shell — Missing Providers', () => {
  test('detects missing provider for consumed capability', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['capability-x'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: [],
      consumes: ['capability-y'] // Missing provider
    });

    const result = validateCapabilities(capabilities);

    expect(result.valid).toBe(false);
    expect(result.missingProviders.length).toBe(1);
    expect(result.missingProviders[0].engineId).toBe('engine_b');
    expect(result.missingProviders[0].capability).toBe('capability-y');
  });

  test('passes when all consumed capabilities are provided', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['capability-x'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: [],
      consumes: ['capability-x'] // Provided by engine_a
    });

    const result = validateCapabilities(capabilities);

    expect(result.missingProviders.length).toBe(0);
  });

  test('detects multiple missing providers', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-1'],
      consumes: ['cap-2', 'cap-3'] // Both missing
    });

    const result = validateCapabilities(capabilities);

    expect(result.valid).toBe(false);
    expect(result.missingProviders.length).toBe(2);
    expect(result.missingProviders.some(m => m.capability === 'cap-2')).toBe(true);
    expect(result.missingProviders.some(m => m.capability === 'cap-3')).toBe(true);
  });

  test('engines with no consumes do not cause missing provider errors', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['capability-x'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['capability-y']
      // No consumes field
    });

    const result = validateCapabilities(capabilities);

    expect(result.missingProviders.length).toBe(0);
  });
});
