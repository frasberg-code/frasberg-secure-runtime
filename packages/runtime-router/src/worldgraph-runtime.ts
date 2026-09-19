import Fastify, { type FastifyInstance } from 'fastify';
import {
  InMemoryBuilderOrchestrator,
  InMemoryWorldGraphService,
  type BuilderOperationRequest,
  type BuilderOrchestrator,
  type FullGameStackSchema,
  type WorldGraphCreateInput,
  type WorldGraphNodeSpec,
  type WorldGraphRecord,
  type WorldGraphService,
  createBuilderOperationRequest,
} from '@frasberg/shared';

export interface WorldGraphRuntimeOptions {
  service?: WorldGraphService;
  builderOrchestrator?: BuilderOrchestrator;
}

export function buildWorldGraphRuntimeApp(
  options: WorldGraphRuntimeOptions = {},
): FastifyInstance {
  const service = options.service ?? new InMemoryWorldGraphService();
  const builderOrchestrator =
    options.builderOrchestrator ?? new InMemoryBuilderOrchestrator();

  const app = Fastify({ logger: false });

  app.get('/v1/worldgraph/health', async () => ({
    status: 'ok',
    note: 'WorldGraph runtime contract is active.',
  }));

  app.get('/v1/worldgraph/worlds', async () => ({
    worlds: service.listWorlds(),
  }));

  app.post('/v1/worldgraph/worlds', async (request, reply) => {
    try {
      const body = readWorldGraphCreateInput(request.body);
      return reply.code(201).send(service.createWorld(body));
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/worldgraph/worlds/:id', async (request, reply) => {
    try {
      const id = readIdParam((request.params as { id?: string }).id, 'id');
      const world = service.getWorld(id);
      if (!world) {
        return reply.code(404).send({ error: `World "${id}" was not found.` });
      }
      return reply.code(200).send(world);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.patch('/v1/worldgraph/worlds/:id', async (request, reply) => {
    try {
      const id = readIdParam((request.params as { id?: string }).id, 'id');
      const world = service.updateWorld(id, readWorldGraphUpdateInput(request.body));
      return reply.code(200).send(world);
    } catch (error) {
      const message = (error as Error).message;
      return reply.code(message.includes('does not exist') ? 404 : 400).send({
        error: message,
      });
    }
  });

  app.delete('/v1/worldgraph/worlds/:id', async (request, reply) => {
    try {
      const id = readIdParam((request.params as { id?: string }).id, 'id');
      const deleted = service.deleteWorld(id);
      if (!deleted) {
        return reply.code(404).send({ error: `World "${id}" was not found.` });
      }
      return reply.code(200).send({ deleted: true, world: deleted });
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/worldgraph/worlds/:id/scene', async (request, reply) => {
    try {
      const id = readIdParam((request.params as { id?: string }).id, 'id');
      return reply.code(200).send(service.materializeScene(id));
    } catch (error) {
      const message = (error as Error).message;
      return reply.code(message.includes('does not exist') ? 404 : 400).send({
        error: message,
      });
    }
  });

  app.post('/v1/worldgraph/builders/plan', async (request, reply) => {
    try {
      const body = createBuilderOperationRequest(
        readBuilderOperationRequest(request.body),
      );
      return reply.code(200).send(builderOrchestrator.plan(body));
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/worldgraph/schema', async (request, reply) => {
    try {
      const payload = readRecord(request.body, 'request body');
      const id = readIdParam(payload.worldId, 'worldId');
      const world = service.getWorld(id);
      if (!world) {
        return reply.code(404).send({ error: `World "${id}" was not found.` });
      }
      return reply.code(201).send(buildSchemaFromWorld(world, payload));
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  return app;
}

function buildSchemaFromWorld(
  world: WorldGraphRecord,
  input: Partial<FullGameStackSchema> = {},
): FullGameStackSchema {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `schema-${world.id}`,
    name: input.name ?? world.name,
    description: input.description ?? 'Generated from WorldGraph definition',
    ownerId: input.ownerId ?? world.ownerId,
    surfaces: input.surfaces ?? ['game', 'website'],
    world,
    version: input.version ?? 1,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

function readWorldGraphCreateInput(value: unknown): WorldGraphCreateInput {
  const payload = readRecord(value, 'request body');
  return {
    id: payload.id === undefined ? undefined : readIdParam(payload.id, 'id'),
    name: readNonEmptyString(payload.name, 'name'),
    kind: payload.kind === undefined ? 'world' : readWorldGraphKind(payload.kind),
    ownerId:
      payload.ownerId === undefined
        ? 'system'
        : readNonEmptyString(payload.ownerId, 'ownerId'),
    status: payload.status === undefined ? 'draft' : readStatus(payload.status),
    schemaVersion:
      payload.schemaVersion === undefined
        ? '1.0.0'
        : readNonEmptyString(payload.schemaVersion, 'schemaVersion'),
    nodes: Array.isArray(payload.nodes)
      ? payload.nodes.map((node, index) => readNodeSpec(node, index))
      : [],
    metadata: readOptionalRecord(payload.metadata, 'metadata'),
  };
}

function readWorldGraphUpdateInput(value: unknown): Partial<WorldGraphCreateInput> {
  const payload = readRecord(value, 'request body');
  const updates: Partial<WorldGraphCreateInput> = {};
  if (payload.name !== undefined) updates.name = readNonEmptyString(payload.name, 'name');
  if (payload.kind !== undefined) updates.kind = readWorldGraphKind(payload.kind);
  if (payload.ownerId !== undefined) updates.ownerId = readNonEmptyString(payload.ownerId, 'ownerId');
  if (payload.status !== undefined) updates.status = readStatus(payload.status);
  if (payload.schemaVersion !== undefined) updates.schemaVersion = readNonEmptyString(payload.schemaVersion, 'schemaVersion');
  if (payload.nodes !== undefined) {
    if (!Array.isArray(payload.nodes)) throw new Error('nodes must be an array.');
    updates.nodes = payload.nodes.map((node, index) => readNodeSpec(node, index));
  }
  if (payload.metadata !== undefined) updates.metadata = readOptionalRecord(payload.metadata, 'metadata');
  return updates;
}

function readBuilderOperationRequest(value: unknown): BuilderOperationRequest {
  const payload = readRecord(value, 'request body');
  return {
    prompt: readNonEmptyString(payload.prompt, 'prompt'),
    projectType: readProjectType(payload.projectType),
    worldId: payload.worldId === undefined ? undefined : readIdParam(payload.worldId, 'worldId'),
    schemaId: payload.schemaId === undefined ? undefined : readIdParam(payload.schemaId, 'schemaId'),
    ownerId: payload.ownerId === undefined ? undefined : readIdParam(payload.ownerId, 'ownerId'),
    mode: payload.mode === undefined ? 'draft' : readMode(payload.mode),
    metadata: readOptionalRecord(payload.metadata, 'metadata'),
  };
}

function readNodeSpec(value: unknown, index: number): WorldGraphNodeSpec {
  const payload = readRecord(value, `nodes[${index}]`);
  return {
    id: readIdParam(payload.id, `nodes[${index}].id`),
    kind: readNonEmptyString(payload.kind, `nodes[${index}].kind`),
    label: readNonEmptyString(payload.label, `nodes[${index}].label`),
    parentId:
      payload.parentId === undefined
        ? undefined
        : readIdParam(payload.parentId, `nodes[${index}].parentId`),
    tags: Array.isArray(payload.tags)
      ? payload.tags.map((tag, tagIndex) =>
          readNonEmptyString(tag, `nodes[${index}].tags[${tagIndex}]`),
        )
      : [],
    config: readOptionalRecord(payload.config, `nodes[${index}].config`),
  };
}

function readWorldGraphKind(value: unknown): WorldGraphCreateInput['kind'] {
  if (!['world', 'scene', 'track', 'page', 'screen', 'flow', 'app', 'site'].includes(String(value))) {
    throw new Error('kind must be one of world, scene, track, page, screen, flow, app, or site.');
  }
  return value as WorldGraphCreateInput['kind'];
}

function readProjectType(value: unknown): BuilderOperationRequest['projectType'] {
  if (!['game', 'website', 'app', 'native'].includes(String(value))) {
    throw new Error('projectType must be game, website, app, or native.');
  }
  return value as BuilderOperationRequest['projectType'];
}

function readStatus(value: unknown): WorldGraphCreateInput['status'] {
  if (!['draft', 'active', 'archived'].includes(String(value))) {
    throw new Error('status must be draft, active, or archived.');
  }
  return value as WorldGraphCreateInput['status'];
}

function readMode(value: unknown): BuilderOperationRequest['mode'] {
  if (!['draft', 'preview', 'publish'].includes(String(value))) {
    throw new Error('mode must be draft, preview, or publish.');
  }
  return value as BuilderOperationRequest['mode'];
}

function readRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function readOptionalRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === undefined) return {};
  return readRecord(value, label);
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function readIdParam(value: unknown, label: string): string {
  return readNonEmptyString(value, label);
}
