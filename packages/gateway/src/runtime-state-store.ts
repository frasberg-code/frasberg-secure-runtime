import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

export interface RuntimeRecord {
  pk: string;
  sk: string;
  kind: string;
  [key: string]: unknown;
}

export interface RuntimeStateStore {
  get(pk: string, sk: string): Promise<RuntimeRecord | undefined>;
  put(record: RuntimeRecord): Promise<void>;
  delete(pk: string, sk: string): Promise<void>;
  query(
    pk: string,
    options?: { skPrefix?: string; limit?: number; descending?: boolean },
  ): Promise<RuntimeRecord[]>;
}

export class DynamoRuntimeStateStore implements RuntimeStateStore {
  private readonly documentClient?: DynamoDBDocumentClient;
  private readonly memory = new Map<string, RuntimeRecord>();

  constructor(
    private readonly tableName = process.env.RUNTIME_STATE_TABLE,
    clientConfig: DynamoDBClientConfig = {},
  ) {
    if (tableName) {
      this.documentClient = DynamoDBDocumentClient.from(
        new DynamoDBClient(clientConfig),
        { marshallOptions: { removeUndefinedValues: true } },
      );
    }
  }

  async get(pk: string, sk: string): Promise<RuntimeRecord | undefined> {
    if (!this.documentClient || !this.tableName) {
      return this.memory.get(this.key(pk, sk));
    }
    const result = await this.documentClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk, sk },
        ConsistentRead: true,
      }),
    );
    return result.Item as RuntimeRecord | undefined;
  }

  async put(record: RuntimeRecord): Promise<void> {
    if (!this.documentClient || !this.tableName) {
      this.memory.set(this.key(record.pk, record.sk), record);
      return;
    }
    await this.documentClient.send(
      new PutCommand({ TableName: this.tableName, Item: record }),
    );
  }

  async delete(pk: string, sk: string): Promise<void> {
    if (!this.documentClient || !this.tableName) {
      this.memory.delete(this.key(pk, sk));
      return;
    }
    await this.documentClient.send(
      new DeleteCommand({ TableName: this.tableName, Key: { pk, sk } }),
    );
  }

  async query(
    pk: string,
    options: { skPrefix?: string; limit?: number; descending?: boolean } = {},
  ): Promise<RuntimeRecord[]> {
    if (!this.documentClient || !this.tableName) {
      return [...this.memory.values()]
        .filter(
          (record) =>
            record.pk === pk &&
            (!options.skPrefix || record.sk.startsWith(options.skPrefix)),
        )
        .sort((a, b) => a.sk.localeCompare(b.sk) * (options.descending ? -1 : 1))
        .slice(0, options.limit);
    }

    const records: RuntimeRecord[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const page = await this.documentClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: options.skPrefix
            ? '#pk = :pk AND begins_with(#sk, :prefix)'
            : '#pk = :pk',
          ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' },
          ExpressionAttributeValues: {
            ':pk': pk,
            ...(options.skPrefix ? { ':prefix': options.skPrefix } : {}),
          },
          ScanIndexForward: !options.descending,
          ...(options.limit
            ? { Limit: Math.max(1, options.limit - records.length) }
            : {}),
          ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
        }),
      );
      records.push(...((page.Items ?? []) as RuntimeRecord[]));
      lastKey = page.LastEvaluatedKey;
    } while (lastKey && (!options.limit || records.length < options.limit));
    return records;
  }

  private key(pk: string, sk: string) {
    return `${pk}\u0000${sk}`;
  }
}
