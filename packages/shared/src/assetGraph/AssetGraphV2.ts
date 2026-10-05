export type AssetType = 'video' | 'audio' | 'story' | 'telemetry';

export interface AssetNode {
  id: string;
  type: AssetType;
  url?: string;
  meta?: Record<string, any>;
}

export interface AssetEdge {
  from: string;
  to: string;
  relation: string;
}

export interface AssetGraphV2 {
  nodes: Record<string, AssetNode>;
  edges: AssetEdge[];
}

export function createEmptyGraph(): AssetGraphV2 {
  return { nodes: {}, edges: [] };
}

export function addNode(graph: AssetGraphV2, node: AssetNode): AssetGraphV2 {
  return { ...graph, nodes: { ...graph.nodes, [node.id]: node } };
}

export function addEdge(graph: AssetGraphV2, edge: AssetEdge): AssetGraphV2 {
  return { ...graph, edges: [...graph.edges, edge] };
}