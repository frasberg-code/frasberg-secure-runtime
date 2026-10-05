/**
 * capability_graph.test.ts
 * Tests for capability graph generation and correctness
 */

import { getCapabilityGraph, EngineCapabilities } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capabilities';

describe('Sofia Core Application Shell — Capability Graph', () => {
  test('generates correct nodes for all engines', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: ['cap-a']
    });

    const graph = getCapabilityGraph(capabilities);

    expect(graph.nodes.size).toBe(2);
    expect(graph.nodes.has('engine_a')).toBe(true);
    expect(graph.nodes.has('engine_b')).toBe(true);
  });

  test('generates correct edges between engines', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: ['cap-a']
    });

    const graph = getCapabilityGraph(capabilities);

    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].from).toBe('engine_b');
    expect(graph.edges[0].to).toBe('engine_a');
    expect(graph.edges[0].capability).toBe('cap-a');
  });

  test('tracks dependencies correctly in nodes', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: ['cap-a']
    });

    const graph = getCapabilityGraph(capabilities);

    const nodeB = graph.nodes.get('engine_b')!;
    expect(nodeB.dependencies).toContain('engine_a');
    expect(nodeB.dependencies.length).toBe(1);

    const nodeA = graph.nodes.get('engine_a')!;
    expect(nodeA.dependencies.length).toBe(0);
  });

  test('handles multiple capability dependencies', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a'],
      consumes: []
    });
    
    capabilities.set('engine_b', {
      provides: ['cap-b'],
      consumes: []
    });
    
    capabilities.set('engine_c', {
      provides: ['cap-c'],
      consumes: ['cap-a', 'cap-b']
    });

    const graph = getCapabilityGraph(capabilities);

    const nodeC = graph.nodes.get('engine_c')!;
    expect(nodeC.dependencies).toContain('engine_a');
    expect(nodeC.dependencies).toContain('engine_b');
    expect(nodeC.dependencies.length).toBe(2);

    expect(graph.edges.length).toBe(2);
  });

  test('graph includes provides and consumes in nodes', () => {
    const capabilities = new Map<string, EngineCapabilities>();
    
    capabilities.set('engine_a', {
      provides: ['cap-a', 'cap-b'],
      consumes: ['cap-c']
    });

    const graph = getCapabilityGraph(capabilities);

    const node = graph.nodes.get('engine_a')!;
    expect(node.provides).toEqual(['cap-a', 'cap-b']);
    expect(node.consumes).toEqual(['cap-c']);
  });
});
