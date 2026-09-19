import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import {
  InMemoryBuilderOrchestrator,
  InMemoryWorldGraphService,
  type BuilderOperationRequest,
  type BuilderOrchestrator,
  type FullGameStackSchema,
  type WorldGraphCreateInput,
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

  const app = Fastify({
    logger: false,
  });

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
      const created = service.createWorld(body);
      return reply.code(201).send(created);
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
      const updates = readWorldGraphUpdateInput(request.body);
      const world = service.updateWorld(id, updates);
      return reply.code(200).send(world);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('does not exist')) {
        return reply.code(404).send({ error: message });
      }
      return reply.code(400).send({ error: message });
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
      if (message.includes('does not exist')) {
        return reply.code(404).send({ error: message });
      }
      return reply.code(400).send({ error: message });
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
      const id = readIdParam(
        (request.body as { worldId?: string })?.worldId,
        'worldId',
      );
      const world = service.getWorld(id);
      if (!world) {
        return reply.code(404).send({ error: `World "${id}" was not found.` });
      }
      const schema = buildSchemaFromWorld(world, request.body as Partial<FullGameStackSchema>);
      return reply.code(201).send(schema);
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
  return {
    id: input.id ?? `schema-${world.id}`,
    name: input.name ?? world.name,
    description: input.description ?? 'Generated from WorldGraph definition',
    ownerId: input.ownerId ?? world.ownerId,
    surfaces: input.surfaces ?? ['game', 'website'],
    world,
    version: input.version ?? 1,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

function readWorldGraphCreateInput(value: unknown): WorldGraphCreateInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }

  const payload = value as Record<string, unknown>;
  return {
    id: payload.id === undefined ? undefined : readIdParam(payload.id, 'id'),
    name: readNonEmptyString(payload.name, 'name'),
    kind: payload.kind === undefined ? 'world' : readWorldGraphKind(payload.kind),
    ownerId: payload.ownerId === undefined ? 'system' : readNonEmptyString(payload.ownerId, 'ownerId'),
    status: payload.status === undefined ? 'draft' : readStatus(payload.status),
    schemaVersion: payload.schemaVersion === undefined ? '1.0.0' : readNonEmptyString(payload.schemaVersion, 'schemaVersion'),
    nodes: Array.isArray(payload.nodes) ? payload.nodes.map(readNodeSpec) : [],
    metadata: payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
      ? (payload.metadata as Record<string, unknown>)
      : {},
  };
}

function readWorldGraphUpdateInput(value: unknown): Partial<WorldGraphCreateInput> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }

  const payload = value as Record<string, unknown>;
  const updates: Partial<WorldGraphCreateInput> = {};

  if (payload.name !== undefined) updates.name = readNonEmptyString(payload.name, 'name');
  if (payload.kind !== undefined) updates.kind = readWorldGraphKind(payload.kind);
  if (payload.ownerId !== undefined) updates.ownerId = readNonEmptyString(payload.ownerId, 'ownerId');
  if (payload.status !== undefined) updates.status = readStatus(payload.status);
  if (payload.schemaVersion !== undefined) updates.schemaVersion = readNonEmptyString(payload.schemaVersion, 'schemaVersion');
  if (payload.nodes !== undefined) updates.nodes = Array.isArray(payload.nodes) ? payload.nodes.map(readNodeSpec) : [];
  if (payload.metadata !== undefined) {
    if (typeof payload.metadata !== 'object' || Array.isArray(payload.metadata)) {
      throw new Error('metadata must be an object.');
    }
    updates.metadata = payload.metadata as Record<string, unknown>;
  }

  return updates;
}

function readBuilderOperationRequest(value: unknown): BuilderOperationRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }

  const payload = value as Record<string, unknown>;
  return {
    prompt: readNonEmptyString(payload.prompt, 'prompt'),
    projectType: readProjectType(payload.projectType),
    worldId: payload.worldId === undefined ? undefined : readIdParam(payload.worldId, 'worldId'),
    schemaId: payload.schemaId === undefined ? undefined : readIdParam(payload.schemaId, 'schemaId'),
    ownerId: payload.ownerId === undefined ? undefined : readIdParam(payload.ownerId, 'ownerId'),
    mode: payload.mode === undefined ? 'draft' : readMode(payload.mode),
    metadata: payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
      ? (payload.metadata as Record<string, unknown>)
      : {},
  };
}

function readNodeSpec(value: unknown, index = 0): WorldGraphCreateInput['nodes'][number] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`nodes[${index}] must be an object.`);
  }
  const payload = value as Record<string, unknown>;
  return {
    id: readIdParam(payload.id, `nodes[${index}].id`),
    kind: readNonEmptyString(payload.kind, `nodes[${index}].kind`),
    label: readNonEmptyString(payload.label, `nodes[${index}].label`),
    parentId: payload.parentId === undefined ? undefined : readIdParam(payload.parentId, `nodes[${index}].parentId`),
    tags: Array.isArray(payload.tags) ? payload.tags.map((tag, tagIndex) => readNonEmptyString(tag, `nodes[${index}].tags[${tagIndex}]`)) : [],
    config: payload.config && typeof payload.config === 'object' && !Array.isArray(payload.config)
      ? (payload.config as Record<string, unknown>)
      : {},
  };
}

function readWorldGraphKind(value: unknown): WorldGraphCreateInput['kind'] {
  if (
    value !== 'world' &&
    value !== 'scene' &&
    value !== 'track' &&
    value !== 'page' &&
    value !== 'screen' &&
    value !== 'flow' &&
    value !== 'app' &&
    value !== 'site'
  ) {
    throw new Error('kind must be one of world, scene, track, page, screen, flow, app, or site.');
  }
  return value;
}

function readProjectType(value: unknown): BuilderOperationRequest['projectType'] {
  if (value !== 'game' && value !== 'website' && value !== 'app' && value !== 'native') {
    throw new Error('projectType must be game, website, app, or native.');
  }
  return value;
}

function readStatus(value: unknown): WorldGraphCreateInput['status'] {
  if (value !== 'draft' && value !== 'active' && value !== 'archived') {
    throw new Error('status must be draft, active, or archived.');
  }
  return value;
}

function readMode(value: unknown): BuilderOperationRequest['mode'] {
  if (value !== 'draft' && value !== 'preview' && value !== 'publish') {
    throw new Error('mode must be draft, preview, or publish.');
  }
  return value;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function readIdParam(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}
