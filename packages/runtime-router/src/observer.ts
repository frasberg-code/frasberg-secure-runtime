import { randomUUID } from 'node:crypto';
import { WorldGraphEngine, WorldGraphNode } from '@frasberg/shared';

export interface ObserverSnapshot {
  snapshotId: string;
  createdAt: string;
  clusterId?: string;
  nodeCount: number;
  nodes: WorldGraphNode[];
}

export class WorldGraphObserver {
  constructor(private readonly worldGraphEngine: WorldGraphEngine) {}

  createSnapshot(clusterId?: string): ObserverSnapshot {
    const nodes =
      clusterId === undefined
        ? this.worldGraphEngine.listNodes()
        : this.worldGraphEngine.listNodes({ clusterId });

    return {
      snapshotId: randomUUID(),
      createdAt: new Date().toISOString(),
      clusterId,
      nodeCount: nodes.length,
      nodes: nodes.map((node) => ({ ...node, tags: [...node.tags] })),
    };
  }
}
