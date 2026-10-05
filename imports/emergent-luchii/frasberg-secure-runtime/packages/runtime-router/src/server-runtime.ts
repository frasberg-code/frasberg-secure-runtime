import {
  EngineToOsMessage,
  EngineToWgqlMessage,
  LuchiiToOsMessage,
  LuchiiToWgqlMessage,
  OsToEngineMessage,
  OsToLuchiiMessage,
  OsToWgqlMessage,
  validateEngineToOsMessage,
  validateEngineToWgqlMessage,
  validateLuchiiToOsMessage,
  validateLuchiiToWgqlMessage,
  validateOsToEngineMessage,
  validateOsToLuchiiMessage,
  validateOsToWgqlMessage,
  validateWgqlToEngineMessage,
  validateWgqlToLuchiiMessage,
  validateWgqlToOsGovernanceMessage,
  validateWgqlToOsGovernanceResponse,
  validateWgqlToOsMessage,
  WgqlToEngineMessage,
  WgqlToLuchiiMessage,
  WgqlToOsGovernanceMessage,
  WgqlToOsGovernanceResponse,
  WgqlToOsMessage,
} from '@frasberg/shared';

export interface ServerTransportSubscription {
  unsubscribe(): Promise<void> | void;
}

export interface ServerTransportPublishOptions {
  timeoutMs?: number;
}

export interface ServerTransport {
  subscribe(
    channel: string,
    handler: (payload: unknown) => Promise<unknown>,
  ): Promise<ServerTransportSubscription>;
  publish<TResponse>(
    channel: string,
    payload: unknown,
    options?: ServerTransportPublishOptions,
  ): Promise<TResponse>;
  close?(): Promise<void>;
}

export class NoServerTransportSubscriberError extends Error {
  constructor(channel: string) {
    super(`No subscriber registered for channel "${channel}".`);
    this.name = 'NoServerTransportSubscriberError';
  }
}

export class ServerTransportTimeoutError extends Error {
  constructor(channel: string, timeoutMs: number) {
    super(
      `Timed out waiting for a response on "${channel}" after ${timeoutMs}ms.`,
    );
    this.name = 'ServerTransportTimeoutError';
  }
}

export class ServerTransportClosedError extends Error {
  constructor() {
    super('Server transport is closed.');
    this.name = 'ServerTransportClosedError';
  }
}

export class InMemoryServerTransport implements ServerTransport {
  private readonly subscribers = new Map<
    string,
    (payload: unknown) => Promise<unknown>
  >();
  private closed = false;

  constructor(private readonly defaultTimeoutMs = 1_000) {}

  async subscribe(
    channel: string,
    handler: (payload: unknown) => Promise<unknown>,
  ): Promise<ServerTransportSubscription> {
    this.assertOpen();
    const normalizedChannel = readChannel(channel);
    if (this.subscribers.has(normalizedChannel)) {
      throw new Error(
        `A subscriber is already registered for channel "${normalizedChannel}".`,
      );
    }

    this.subscribers.set(normalizedChannel, handler);
    let active = true;

    return {
      unsubscribe: async () => {
        if (!active) {
          return;
        }

        active = false;
        if (this.subscribers.get(normalizedChannel) === handler) {
          this.subscribers.delete(normalizedChannel);
        }
      },
    };
  }

  async publish<TResponse>(
    channel: string,
    payload: unknown,
    options: ServerTransportPublishOptions = {},
  ): Promise<TResponse> {
    this.assertOpen();
    const normalizedChannel = readChannel(channel);
    const subscriber = this.subscribers.get(normalizedChannel);
    if (!subscriber) {
      throw new NoServerTransportSubscriberError(normalizedChannel);
    }

    const timeoutMs = readTimeout(options.timeoutMs ?? this.defaultTimeoutMs);
    const response = subscriber(payload) as Promise<TResponse>;
    return new Promise<TResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ServerTransportTimeoutError(normalizedChannel, timeoutMs));
      }, timeoutMs);

      response.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.subscribers.clear();
  }

  getSubscribedChannels(): string[] {
    return [...this.subscribers.keys()].sort();
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new ServerTransportClosedError();
    }
  }
}

export interface LuchiiHandlers {
  handleOsToLuchii(message: OsToLuchiiMessage): Promise<LuchiiToOsMessage>;
  handleWgqlToLuchii(
    message: WgqlToLuchiiMessage,
  ): Promise<LuchiiToWgqlMessage>;
}

export interface EngineHandlers {
  handleOsToEngine(message: OsToEngineMessage): Promise<EngineToOsMessage>;
  handleWgqlToEngine(
    message: WgqlToEngineMessage,
  ): Promise<EngineToWgqlMessage>;
}

export interface WgqlHandlers {
  handleOsToWgql(message: OsToWgqlMessage): Promise<WgqlToOsMessage>;
  handleGovernance(
    message: WgqlToOsGovernanceMessage,
  ): Promise<WgqlToOsGovernanceResponse>;
}

export interface RouterConfig {
  luchii: LuchiiHandlers;
  engine: EngineHandlers;
  wgql: WgqlHandlers;
}

export const SERVER_RUNTIME_CHANNELS = [
  'os.luchii',
  'os.engine',
  'os.wgql',
  'wgql.luchii',
  'wgql.engine',
  'wgql.os',
] as const;

export class FrasbergServerRuntime {
  private initialized = false;
  private initialization?: Promise<void>;
  private readonly subscriptions: ServerTransportSubscription[] = [];

  constructor(
    private readonly transport: ServerTransport,
    private readonly router: RouterConfig,
  ) {}

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initialization) {
      return this.initialization;
    }

    this.initialization = this.initialize();
    try {
      await this.initialization;
    } finally {
      this.initialization = undefined;
    }
  }

  async close(): Promise<void> {
    if (this.initialization) {
      await this.initialization.catch(() => undefined);
    }

    await cleanupSubscriptions(this.subscriptions);
    this.initialized = false;
    await this.transport.close?.();
  }

  private async initialize(): Promise<void> {
    const nextSubscriptions: ServerTransportSubscription[] = [];

    try {
      nextSubscriptions.push(
        await this.transport.subscribe('os.luchii', (payload) =>
          this.dispatchOsToLuchii(payload),
        ),
      );
      nextSubscriptions.push(
        await this.transport.subscribe('os.engine', (payload) =>
          this.dispatchOsToEngine(payload),
        ),
      );
      nextSubscriptions.push(
        await this.transport.subscribe('os.wgql', (payload) =>
          this.dispatchOsToWgql(payload),
        ),
      );
      nextSubscriptions.push(
        await this.transport.subscribe('wgql.luchii', (payload) =>
          this.dispatchWgqlToLuchii(payload),
        ),
      );
      nextSubscriptions.push(
        await this.transport.subscribe('wgql.engine', (payload) =>
          this.dispatchWgqlToEngine(payload),
        ),
      );
      nextSubscriptions.push(
        await this.transport.subscribe('wgql.os', (payload) =>
          this.dispatchWgqlToOsGovernance(payload),
        ),
      );
    } catch (error) {
      await cleanupSubscriptions(nextSubscriptions);
      throw error;
    }

    this.subscriptions.push(...nextSubscriptions);
    this.initialized = true;
  }

  private async dispatchOsToLuchii(
    payload: unknown,
  ): Promise<LuchiiToOsMessage> {
    const message = validateOsToLuchiiMessage(payload);
    assertMatchingEid(
      message.existentialContext.eid,
      message.eid,
      'OsToLuchiiMessage.existentialContext.eid',
    );

    const response = validateLuchiiToOsMessage(
      await this.router.luchii.handleOsToLuchii(message),
    );
    assertMatch(
      response.requestId,
      message.requestId,
      'LuchiiToOsMessage.requestId',
    );
    assertMatchingEid(response.eid, message.eid, 'LuchiiToOsMessage.eid');
    assertMatchingEid(
      response.existentialContext.eid,
      message.eid,
      'LuchiiToOsMessage.existentialContext.eid',
    );
    assertMatchingEid(
      response.reasoningTrace.eid,
      response.eid,
      'LuchiiToOsMessage.reasoningTrace.eid',
    );
    return response;
  }

  private async dispatchOsToEngine(
    payload: unknown,
  ): Promise<EngineToOsMessage> {
    const message = validateOsToEngineMessage(payload);
    assertMatchingEid(
      message.job.eid,
      message.eid,
      'OsToEngineMessage.job.eid',
    );
    assertMatchingEid(
      message.job.existentialContext.eid,
      message.eid,
      'OsToEngineMessage.job.existentialContext.eid',
    );

    const response = validateEngineToOsMessage(
      await this.router.engine.handleOsToEngine(message),
    );
    assertMatch(
      response.requestId,
      message.requestId,
      'EngineToOsMessage.requestId',
    );
    assertMatch(response.jobId, message.job.jobId, 'EngineToOsMessage.jobId');
    assertMatchingEid(response.eid, message.eid, 'EngineToOsMessage.eid');
    return response;
  }

  private async dispatchOsToWgql(payload: unknown): Promise<WgqlToOsMessage> {
    const message = validateOsToWgqlMessage(payload);
    const response = validateWgqlToOsMessage(
      await this.router.wgql.handleOsToWgql(message),
    );
    assertMatch(response.queryId, message.queryId, 'WgqlToOsMessage.queryId');
    assertMatchingEid(response.eid, message.eid, 'WgqlToOsMessage.eid');
    return response;
  }

  private async dispatchWgqlToLuchii(
    payload: unknown,
  ): Promise<LuchiiToWgqlMessage> {
    const message = validateWgqlToLuchiiMessage(payload);
    assertMatchingEid(
      message.existentialContext.eid,
      message.eid,
      'WgqlToLuchiiMessage.existentialContext.eid',
    );

    const response = validateLuchiiToWgqlMessage(
      await this.router.luchii.handleWgqlToLuchii(message),
    );
    assertMatch(
      response.queryId,
      message.queryId,
      'LuchiiToWgqlMessage.queryId',
    );
    assertMatchingEid(response.eid, message.eid, 'LuchiiToWgqlMessage.eid');
    assertMatchingEid(
      response.existentialContext.eid,
      message.eid,
      'LuchiiToWgqlMessage.existentialContext.eid',
    );
    assertMatchingEid(
      response.reasoningTrace.eid,
      response.eid,
      'LuchiiToWgqlMessage.reasoningTrace.eid',
    );
    return response;
  }

  private async dispatchWgqlToEngine(
    payload: unknown,
  ): Promise<EngineToWgqlMessage> {
    const message = validateWgqlToEngineMessage(payload);
    assertMatchingEid(
      message.job.eid,
      message.eid,
      'WgqlToEngineMessage.job.eid',
    );
    assertMatchingEid(
      message.job.existentialContext.eid,
      message.eid,
      'WgqlToEngineMessage.job.existentialContext.eid',
    );

    const response = validateEngineToWgqlMessage(
      await this.router.engine.handleWgqlToEngine(message),
    );
    assertMatch(
      response.queryId,
      message.queryId,
      'EngineToWgqlMessage.queryId',
    );
    assertMatch(response.jobId, message.job.jobId, 'EngineToWgqlMessage.jobId');
    assertMatchingEid(response.eid, message.eid, 'EngineToWgqlMessage.eid');
    return response;
  }

  private async dispatchWgqlToOsGovernance(
    payload: unknown,
  ): Promise<WgqlToOsGovernanceResponse> {
    const message = validateWgqlToOsGovernanceMessage(payload);
    const response = validateWgqlToOsGovernanceResponse(
      await this.router.wgql.handleGovernance(message),
    );
    assertMatch(
      response.queryId,
      message.queryId,
      'WgqlToOsGovernanceResponse.queryId',
    );
    assertMatchingEid(
      response.eid,
      message.eid,
      'WgqlToOsGovernanceResponse.eid',
    );
    assertMatch(
      response.action,
      message.action,
      'WgqlToOsGovernanceResponse.action',
    );
    return response;
  }
}

async function cleanupSubscriptions(
  subscriptions: ServerTransportSubscription[],
): Promise<void> {
  while (subscriptions.length > 0) {
    const subscription = subscriptions.pop();
    await subscription?.unsubscribe();
  }
}

function readChannel(channel: string): string {
  if (typeof channel !== 'string' || channel.trim().length === 0) {
    throw new Error('channel must be a non-empty string.');
  }

  return channel;
}

function readTimeout(timeoutMs: number): number {
  if (
    typeof timeoutMs !== 'number' ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new Error('timeoutMs must be a positive finite number.');
  }

  return timeoutMs;
}

function assertMatch(actual: string, expected: string, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label} must match "${expected}".`);
  }
}

function assertMatchingEid(
  actual: string,
  expected: string,
  label: string,
): void {
  assertMatch(actual, expected, label);
}
