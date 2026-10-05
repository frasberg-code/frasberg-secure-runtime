/**
 * integration.test.ts
 * Integration tests for Sofia Core engine capabilities
 */

import { validateEngineCapabilities, getEngineCapabilityGraph } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_lifecycle';

describe('Sofia Core Application Shell — Capability Integration', () => {
  test('validates actual Sofia Core engine capabilities', async () => {
    const result = await validateEngineCapabilities();

    // Should have no missing providers in the actual system
    expect(result.missingProviders.length).toBe(0);

    // Should have no circular dependencies
    expect(result.circularDependencies.length).toBe(0);
  });

  test('generates capability graph for Sofia Core engines', async () => {
    const graph = await getEngineCapabilityGraph();

    // Should have nodes for all 5 engines
    expect(graph.nodes.size).toBe(5);
    
    expect(graph.nodes.has('deviation_engine')).toBe(true);
    expect(graph.nodes.has('identity_filter')).toBe(true);
    expect(graph.nodes.has('membrane_engine')).toBe(true);
    expect(graph.nodes.has('tonal_engine')).toBe(true);
    expect(graph.nodes.has('sofia_api')).toBe(true);
  });

  test('identity_filter has no dependencies (base layer)', async () => {
    const graph = await getEngineCapabilityGraph();
    
    const identityNode = graph.nodes.get('identity_filter')!;
    expect(identityNode.consumes.length).toBe(0);
    expect(identityNode.dependencies.length).toBe(0);
    expect(identityNode.provides).toContain('identity.resolve');
    expect(identityNode.provides).toContain('identity.normalize');
  });

  test('deviation_engine depends on identity_filter', async () => {
    const graph = await getEngineCapabilityGraph();
    
    const deviationNode = graph.nodes.get('deviation_engine')!;
    expect(deviationNode.consumes).toContain('identity.resolve');
    expect(deviationNode.provides).toContain('deviation.compute');
    expect(deviationNode.provides).toContain('deviation.analyze');
  });

  test('tonal_engine has multiple dependencies', async () => {
    const graph = await getEngineCapabilityGraph();
    
    const tonalNode = graph.nodes.get('tonal_engine')!;
    expect(tonalNode.consumes.length).toBeGreaterThan(1);
    expect(tonalNode.consumes).toContain('identity.normalize');
    expect(tonalNode.consumes).toContain('membrane.filter');
  });

  test('sofia_api is the final composition layer', async () => {
    const graph = await getEngineCapabilityGraph();
    
    const apiNode = graph.nodes.get('sofia_api')!;
    expect(apiNode.consumes).toContain('tone.generate');
    expect(apiNode.consumes).toContain('membrane.transform');
    expect(apiNode.consumes).toContain('identity.resolve');
    expect(apiNode.provides).toContain('api.respond');
    expect(apiNode.provides).toContain('api.compose');
  });

  test('capability graph has correct edge structure', async () => {
    const graph = await getEngineCapabilityGraph();

    // Should have edges representing capability dependencies
    expect(graph.edges.length).toBeGreaterThan(0);

    // All edges should have valid from, to, and capability fields
    for (const edge of graph.edges) {
      expect(edge.from).toBeTruthy();
      expect(edge.to).toBeTruthy();
      expect(edge.capability).toBeTruthy();
      expect(graph.nodes.has(edge.from)).toBe(true);
      expect(graph.nodes.has(edge.to)).toBe(true);
    }
  });
});
