export type BuilderSurface = 'game' | 'website' | 'app' | 'native';

export type WorldGraphKind =
  | 'world'
  | 'scene'
  | 'track'
  | 'page'
  | 'screen'
  | 'flow'
  | 'app'
  | 'site';

export interface WorldGraphNodeSpec {
  id: string;
  kind: string;
  label: string;
  parentId?: string;
  tags: string[];
  config: Record<string, unknown>;
}

export interface WorldGraphRecord {
  id: string;
  name: string;
  kind: WorldGraphKind;
  ownerId: string;
  status: 'draft' | 'active' | 'archived';
  schemaVersion: string;
  nodes: WorldGraphNodeSpec[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorldGraphCreateInput {
  id?: string;
  name: string;
  kind?: WorldGraphKind;
  ownerId?: string;
  status?: WorldGraphRecord['status'];
  schemaVersion?: string;
  nodes?: WorldGraphNodeSpec[];
  metadata?: Record<string, unknown>;
}

export interface SceneGraphSnapshot {
  worldId: string;
  rootId: string;
  nodes: WorldGraphNodeSpec[];
  materializedAt: string;
}

export interface FullGameStackSchema {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  surfaces: BuilderSurface[];
  world: WorldGraphRecord;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function createDefaultFullGameStackSchema(
  input: Partial<FullGameStackSchema> & {
    id?: string;
    name: string;
    ownerId: string;
    world: WorldGraphRecord;
  },
): FullGameStackSchema {
  return {
    id: input.id ?? `schema-${randomId()}`,
    name: input.name,
    description: input.description ?? 'Frasberg full game stack schema',
    ownerId: input.ownerId,
    surfaces: input.surfaces ?? ['game', 'website', 'app'],
    world: input.world,
    version: input.version ?? 1,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function createWorldGraphRecord(
  input: WorldGraphCreateInput,
): WorldGraphRecord {
  const now = new Date().toISOString();
  const name = readNonEmptyString(input.name, 'name');
  const kind = input.kind ?? 'world';
  return {
    id: input.id ?? `world-${randomId()}`,
    name,
    kind,
    ownerId: input.ownerId ?? 'system',
    status: input.status ?? 'draft',
    schemaVersion: input.schemaVersion ?? '1.0.0',
    nodes: normalizeNodes(input.nodes ?? []),
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

export function materializeSceneGraph(
  world: WorldGraphRecord,
): SceneGraphSnapshot {
  const nodes = [...world.nodes].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
  return {
    worldId: world.id,
    rootId: nodes[0]?.id ?? world.id,
    nodes,
    materializedAt: new Date().toISOString(),
  };
}

function normalizeNodes(nodes: WorldGraphNodeSpec[]): WorldGraphNodeSpec[] {
  return nodes.map((node, index) => ({
    id: readNonEmptyString(node.id, `nodes[${index}].id`),
    kind: readNonEmptyString(node.kind, `nodes[${index}].kind`),
    label: readNonEmptyString(node.label, `nodes[${index}].label`),
    parentId: node.parentId,
    tags: Array.isArray(node.tags) ? node.tags.map(String) : [],
    config: node.config ?? {},
  }));
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
