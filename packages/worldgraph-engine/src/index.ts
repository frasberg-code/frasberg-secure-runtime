import {
  validateWorldDefinition,
  type WorldDefinition,
  type WorldDefinitionKind,
} from '@frasberg/full-game-stack-schema';

export interface WorldGraphRequestContext {
  accessToken: string;
  ownerId: string;
  continuityId?: string;
  allowAdminReadAcrossOwners?: boolean;
}

export interface WorldGraphDefinitionRecord {
  id: string;
  ownerId: string;
  kind: WorldDefinitionKind;
  name: string;
  schemaVersion: string;
  definition: WorldDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface WorldGraphListOptions {
  page?: number;
  pageSize?: number;
}

export interface WorldGraphListPage {
  items: WorldGraphDefinitionRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export interface WorldGraphService {
  createDefinition(
    context: WorldGraphRequestContext,
    definition: unknown,
  ): Promise<WorldGraphDefinitionRecord>;
  getDefinition(
    context: WorldGraphRequestContext,
    id: string,
  ): Promise<WorldGraphDefinitionRecord | undefined>;
  updateDefinition(
    context: WorldGraphRequestContext,
    id: string,
    definition: unknown,
  ): Promise<WorldGraphDefinitionRecord | undefined>;
  deleteDefinition(
    context: WorldGraphRequestContext,
    id: string,
  ): Promise<boolean>;
  listDefinitions(
    context: WorldGraphRequestContext,
    options?: WorldGraphListOptions,
  ): Promise<WorldGraphListPage>;
}

export interface WorldGraphRpcClient {
  rpc<TResponse>(
    fn: string,
    args?: Record<string, unknown>,
  ): Promise<TResponse>;
}

export interface WorldGraphRpcClientFactory {
  create(accessToken: string): WorldGraphRpcClient;
}

interface WorldGraphRow {
  id: unknown;
  owner_id: unknown;
  definition_kind: unknown;
  name: unknown;
  schema_version: unknown;
  document: unknown;
  created_at: unknown;
  updated_at: unknown;
}

interface WorldGraphListRow extends WorldGraphRow {
  total_count: unknown;
}

export class PersistentWorldGraphService implements WorldGraphService {
  constructor(private readonly rpcClientFactory: WorldGraphRpcClientFactory) {}

  async createDefinition(
    context: WorldGraphRequestContext,
    definition: unknown,
  ): Promise<WorldGraphDefinitionRecord> {
    const validatedContext = validateContext(context);
    const validatedDefinition = validateWorldDefinition(definition);
    const client = this.rpcClientFactory.create(validatedContext.accessToken);
    const row = await client.rpc<WorldGraphRow>(
      'rpc_create_worldgraph_definition',
      {
        p_definition: validatedDefinition,
      },
    );
    return mapRecord(row, validatedContext);
  }

  async getDefinition(
    context: WorldGraphRequestContext,
    id: string,
  ): Promise<WorldGraphDefinitionRecord | undefined> {
    const validatedContext = validateContext(context);
    const client = this.rpcClientFactory.create(validatedContext.accessToken);
    const row = await client.rpc<WorldGraphRow | null>(
      'rpc_get_worldgraph_definition',
      {
        p_definition_id: readNonEmptyString(id, 'id'),
      },
    );
    return row ? mapRecord(row, validatedContext) : undefined;
  }

  async updateDefinition(
    context: WorldGraphRequestContext,
    id: string,
    definition: unknown,
  ): Promise<WorldGraphDefinitionRecord | undefined> {
    const validatedContext = validateContext(context);
    const validatedDefinition = validateWorldDefinition(definition);
    const client = this.rpcClientFactory.create(validatedContext.accessToken);
    const row = await client.rpc<WorldGraphRow | null>(
      'rpc_update_worldgraph_definition',
      {
        p_definition_id: readNonEmptyString(id, 'id'),
        p_definition: validatedDefinition,
      },
    );
    return row ? mapRecord(row, validatedContext) : undefined;
  }

  async deleteDefinition(
    context: WorldGraphRequestContext,
    id: string,
  ): Promise<boolean> {
    const validatedContext = validateContext(context);
    const client = this.rpcClientFactory.create(validatedContext.accessToken);
    const deleted = await client.rpc<boolean>(
      'rpc_delete_worldgraph_definition',
      {
        p_definition_id: readNonEmptyString(id, 'id'),
      },
    );
    return Boolean(deleted);
  }

  async listDefinitions(
    context: WorldGraphRequestContext,
    options: WorldGraphListOptions = {},
  ): Promise<WorldGraphListPage> {
    const validatedContext = validateContext(context);
    const page = readPositiveInteger(options.page ?? 1, 'page');
    const pageSize = readBoundedInteger(
      options.pageSize ?? 20,
      'pageSize',
      1,
      100,
    );
    const offset = (page - 1) * pageSize;
    const client = this.rpcClientFactory.create(validatedContext.accessToken);
    const rows = await client.rpc<WorldGraphListRow[]>(
      'rpc_list_worldgraph_definitions',
      {
        p_owner_id: validatedContext.allowAdminReadAcrossOwners
          ? null
          : validatedContext.ownerId,
        p_limit: pageSize,
        p_offset: offset,
      },
    );
    const items = rows.map((row) => mapRecord(row, validatedContext));
    const total = rows[0]
      ? readNonNegativeInteger(rows[0].total_count, 'total_count')
      : 0;
    return { items, page, pageSize, total };
  }
}

export interface SupabaseRestRpcClientFactoryOptions {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export class SupabaseRestRpcClientFactory implements WorldGraphRpcClientFactory {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SupabaseRestRpcClientFactoryOptions) {
    this.baseUrl = readNonEmptyString(options.baseUrl, 'baseUrl');
    this.apiKey = readNonEmptyString(options.apiKey, 'apiKey');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  create(accessToken: string): WorldGraphRpcClient {
    const token = readNonEmptyString(accessToken, 'accessToken');
    return {
      rpc: async <TResponse>(
        fn: string,
        args: Record<string, unknown> = {},
      ) => {
        const response = await this.fetchImpl(
          `${this.baseUrl.replace(/\/$/, '')}/rest/v1/rpc/${encodeURIComponent(readNonEmptyString(fn, 'fn'))}`,
          {
            method: 'POST',
            headers: {
              apikey: this.apiKey,
              authorization: ['Bearer', token].join(' '),
              'content-type': 'application/json',
            },
            body: JSON.stringify(args),
          },
        );

        const payload = (await readJson(response)) as
          TResponse | { message?: unknown; error?: unknown };
        if (!response.ok) {
          const message =
            payload && typeof payload === 'object'
              ? readOptionalErrorMessage(payload as Record<string, unknown>)
              : undefined;
          throw new Error(
            message ??
              `Supabase RPC ${fn} failed with status ${response.status}.`,
          );
        }

        return payload as TResponse;
      },
    };
  }
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }
  return response.json();
}

function readOptionalErrorMessage(
  value: Record<string, unknown>,
): string | undefined {
  if (typeof value.message === 'string' && value.message.trim().length > 0) {
    return value.message;
  }
  if (typeof value.error === 'string' && value.error.trim().length > 0) {
    return value.error;
  }
  return undefined;
}

function validateContext(
  value: WorldGraphRequestContext,
): WorldGraphRequestContext {
  return {
    accessToken: readNonEmptyString(value.accessToken, 'accessToken'),
    ownerId: readNonEmptyString(value.ownerId, 'ownerId'),
    allowAdminReadAcrossOwners:
      value.allowAdminReadAcrossOwners === undefined
        ? undefined
        : readBoolean(
            value.allowAdminReadAcrossOwners,
            'allowAdminReadAcrossOwners',
          ),
  };
}

function mapRecord(
  row: WorldGraphRow,
  context: WorldGraphRequestContext,
): WorldGraphDefinitionRecord {
  const definition = validateWorldDefinition(row.document, 'document');
  const ownerId = readNonEmptyString(row.owner_id, 'owner_id');
  if (!context.allowAdminReadAcrossOwners && ownerId !== context.ownerId) {
    throw new Error(
      'WorldGraph RPC returned a definition for an unexpected owner.',
    );
  }

  return {
    id: readNonEmptyString(row.id, 'id'),
    ownerId,
    kind: readWorldDefinitionKind(row.definition_kind, 'definition_kind'),
    name: readNonEmptyString(row.name, 'name'),
    schemaVersion: readNonEmptyString(row.schema_version, 'schema_version'),
    definition,
    createdAt: readIsoString(row.created_at, 'created_at'),
    updatedAt: readIsoString(row.updated_at, 'updated_at'),
  };
}

function readWorldDefinitionKind(
  value: unknown,
  label: string,
): WorldDefinitionKind {
  if (value !== 'game' && value !== 'app' && value !== 'site') {
    throw new Error(`${label} must be one of: game, app, site.`);
  }
  return value;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function readIsoString(value: unknown, label: string): string {
  const normalized = readNonEmptyString(value, label);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      normalized,
    ) ||
    Number.isNaN(Date.parse(normalized))
  ) {
    throw new Error(`${label} must be an ISO timestamp string.`);
  }
  return normalized;
}

function readPositiveInteger(value: unknown, label: string): number {
  return readBoundedInteger(value, label, 1, Number.MAX_SAFE_INTEGER);
}

function readNonNegativeInteger(value: unknown, label: string): number {
  return readBoundedInteger(value, label, 0, Number.MAX_SAFE_INTEGER);
}

function readBoundedInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(
      `${label} must be an integer between ${minimum} and ${maximum}.`,
    );
  }
  return value;
}

function readBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean.`);
  }
  return value;
}
