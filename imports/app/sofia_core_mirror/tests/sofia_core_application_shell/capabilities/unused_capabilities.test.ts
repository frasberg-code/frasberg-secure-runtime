/**
 * unused_capabilities.test.ts
 * Tests for detecting unused capabilities
 */

import { validateCapabilities, EngineCapabilities } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capabilities';

describe('Sofia Core Application Shell — Unused Capabilities', () => {
  test('detects capability that is provided but never consumed', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['unused-capability'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['used-capability'],
      consumes: []
    });
    
    capabilities.set('engine_c', {
      provides: [],
      consumes: ['used-capability']
    });

    const result = validateCapabilities(capabilities);

    expect(result.unusedCapabilities.length).toBe(1);
    expect(result.unusedCapabilities[0].engineId).toBe('engine_a');
    expect(result.unusedCapabilities[0].capability).toBe('unused-capability');
  });

  test('all capabilities are marked unused when nothing consumes', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: []
    });

    const result = validateCapabilities(capabilities);

    expect(result.unusedCapabilities.length).toBe(2);
  });

  test('no unused capabilities when all are consumed', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: ['cap-a']
    });
    
    capabilities.set('engine_c', {
      provides: [],
      consumes: ['cap-b']
    });

    const result = validateCapabilities(capabilities);

    expect(result.unusedCapabilities.length).toBe(0);
  });

  test('capability consumed by multiple engines is not marked unused', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('provider', {
      provides: ['shared-cap'],
      consumes: []
    });
    
    capabilities.set('consumer_1', {
      provides: [],
      consumes: ['shared-cap']
    });
    
    capabilities.set('consumer_2', {
      provides: [],
      consumes: ['shared-cap']
    });

    const result = validateCapabilities(capabilities);

    expect(result.unusedCapabilities.length).toBe(0);
  });
});
