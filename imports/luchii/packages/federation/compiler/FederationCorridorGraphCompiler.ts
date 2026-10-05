export interface RawRegionConfig {
  id: string;              // "eu-central-1"
  cloud: "aws" | "azure" | "gcp" | "oci" | "on_prem";
  sovereignZones: string[]; // ["EU_SOVEREIGN", "FINANCE_GLOBAL"]
}

export interface RawCorridorConfig {
  fromRegionId: string;
  toRegionId: string;
  maxLatencyMs: number;
  baseCostScore: number;
  baseHealthScore: number;
}

export interface CompiledCorridorNode {
  id: string; // region ID
  cloud: string;
  zones: string[];
}

export interface CompiledCorridorEdge {
  id: string; // "eu-central-1::us-west-2"
  fromRegionId: string;
  toRegionId: string;
  maxLatencyMs: number;
  baseCostScore: number;
  baseHealthScore: number;
  zones: string[]; // union of from/to zones
}

export interface FederationCorridorGraph {
  nodes: CompiledCorridorNode[];
  edges: CompiledCorridorEdge[];
}

export class FederationCorridorGraphCompiler {
  static compile(
    regions: RawRegionConfig[],
    corridors: RawCorridorConfig[]
  ): FederationCorridorGraph {
    const nodeMap = new Map<string, CompiledCorridorNode>();
    for (const r of regions) {
      nodeMap.set(r.id, {
        id: r.id,
        cloud: r.cloud,
        zones: r.sovereignZones,
      });
    }

    const edges: CompiledCorridorEdge[] = [];

    for (const c of corridors) {
      const from = nodeMap.get(c.fromRegionId);
      const to = nodeMap.get(c.toRegionId);
      if (!from || !to) {
        // Unknown region; skip or log in real runtime
        continue;
      }

      const zones = Array.from(new Set([...from.zones, ...to.zones]));
      const id = `${c.fromRegionId}::${c.toRegionId}`;

      edges.push({
        id,
        fromRegionId: c.fromRegionId,
        toRegionId: c.toRegionId,
        maxLatencyMs: c.maxLatencyMs,
        baseCostScore: c.baseCostScore,
        baseHealthScore: c.baseHealthScore,
        zones,
      });
    }

    return {
      nodes: [...nodeMap.values()],
      edges,
    };
  }
}
