/**
 * circular_dependencies.test.ts
 * Tests for detecting circular capability dependencies
 */

import { validateCapabilities, EngineCapabilities } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capabilities';

describe('Sofia Core Application Shell — Circular Dependencies', () => {
  test('detects simple circular dependency (A -> B -> A)', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: ['cap-b']
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: ['cap-a']
    });

    const result = validateCapabilities(capabilities);

    expect(result.valid).toBe(false);
    expect(result.circularDependencies.length).toBeGreaterThan(0);
  });

  test('detects three-way circular dependency (A -> B -> C -> A)', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: ['cap-c']
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: ['cap-a']
    });
    
    capabilities.set('engine_c', {
      provides: ['cap-c'],
      consumes: ['cap-b']
    });

    const result = validateCapabilities(capabilities);

    expect(result.valid).toBe(false);
    expect(result.circularDependencies.length).toBeGreaterThan(0);
  });

  test('allows linear dependency chain without cycles', () => {
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
      provides: ['cap-c'],
      consumes: ['cap-b']
    });

    const result = validateCapabilities(capabilities);

    expect(result.circularDependencies.length).toBe(0);
  });

  test('allows diamond dependency pattern without cycles', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    // Diamond: A provides to B and C, both provide to D
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: ['cap-a']
    });
    
    capabilities.set('engine_c', {
      provides: ['cap-c'],
      consumes: ['cap-a']
    });
    
    capabilities.set('engine_d', {
      provides: ['cap-d'],
      consumes: ['cap-b', 'cap-c']
    });

    const result = validateCapabilities(capabilities);

    expect(result.circularDependencies.length).toBe(0);
  });
});
