import { describe, expect, it, vi } from 'vitest';
import type {
  EngineJobEnvelope,
  EngineToOsMessage,
  EngineToWgqlMessage,
  ExistentialContext,
  LuchiiToOsMessage,
  LuchiiToWgqlMessage,
  OsToEngineMessage,
  OsToLuchiiMessage,
  OsToWgqlMessage,
  ReasoningStep,
  WgqlToEngineMessage,
  WgqlToLuchiiMessage,
  WgqlToOsGovernanceMessage,
  WgqlToOsGovernanceResponse,
  WgqlToOsMessage,
} from '@frasberg/shared';
import {
  FrasbergServerRuntime,
  InMemoryServerTransport,
  NoServerTransportSubscriberError,
  type RouterConfig,
  SERVER_RUNTIME_CHANNELS,
  ServerTransportClosedError,
  ServerTransportTimeoutError,
  type ServerTransport,
  type ServerTransportPublishOptions,
  type ServerTransportSubscription,
} from '../src/server-runtime';

describe('FrasbergServerRuntime', () => {
  it('registers all six channels exactly once and routes request/reply messages', async () => {
    const transport = new InMemoryServerTransport();
    const router = createRouter();
    const runtime = new FrasbergServerRuntime(transport, router);

    await runtime.init();
    await runtime.init();

    expect(transport.getSubscribedChannels()).toEqual(
      [...SERVER_RUNTIME_CHANNELS].sort(),
    );

    const osToLuchii = baseOsToLuchiiMessage();
    const osToLuchiiResponse = await transport.publish<LuchiiToOsMessage>(
      'os.luchii',
      osToLuchii,
    );
    expect(osToLuchiiResponse.requestId).toBe(osToLuchii.requestId);

    const osToEngine = baseOsToEngineMessage();
    const osToEngineResponse = await transport.publish<EngineToOsMessage>(
      'os.engine',
      osToEngine,
    );
    expect(osToEngineResponse.jobId).toBe(osToEngine.job.jobId);

    const osToWgql = baseOsToWgqlMessage();
    const osToWgqlResponse = await transport.publish<WgqlToOsMessage>(
      'os.wgql',
      osToWgql,
    );
    expect(osToWgqlResponse.queryId).toBe(osToWgql.queryId);

    const wgqlToLuchii = baseWgqlToLuchiiMessage();
    const wgqlToLuchiiResponse = await transport.publish<LuchiiToWgqlMessage>(
      'wgql.luchii',
      wgqlToLuchii,
    );
    expect(wgqlToLuchiiResponse.queryId).toBe(wgqlToLuchii.queryId);

    const wgqlToEngine = baseWgqlToEngineMessage();
    const wgqlToEngineResponse = await transport.publish<EngineToWgqlMessage>(
      'wgql.engine',
      wgqlToEngine,
    );
    expect(wgqlToEngineResponse.jobId).toBe(wgqlToEngine.job.jobId);

    const governance = baseGovernanceMessage();
    const governanceResponse =
      await transport.publish<WgqlToOsGovernanceResponse>(
        'wgql.os',
        governance,
      );
    expect(governanceResponse.action).toBe(governance.action);

    expect(router.luchii.handleOsToLuchii).toHaveBeenCalledTimes(1);
    expect(router.engine.handleOsToEngine).toHaveBeenCalledTimes(1);
    expect(router.wgql.handleOsToWgql).toHaveBeenCalledTimes(1);
    expect(router.luchii.handleWgqlToLuchii).toHaveBeenCalledTimes(1);
    expect(router.engine.handleWgqlToEngine).toHaveBeenCalledTimes(1);
    expect(router.wgql.handleGovernance).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed input before invoking handlers', async () => {
    const transport = new InMemoryServerTransport();
    const router = createRouter();
    const runtime = new FrasbergServerRuntime(transport, router);

    await runtime.init();

    const invalidMessage = {
      ...baseOsToLuchiiMessage(),
      existentialContext: {
        ...baseExistentialContext(),
        meaningScore: 1.5,
      },
    };

    await expect(
      transport.publish('os.luchii', invalidMessage),
    ).rejects.toThrow(/meaningScore/);
    expect(router.luchii.handleOsToLuchii).not.toHaveBeenCalled();
  });

  it('rejects malformed handler output', async () => {
    const transport = new InMemoryServerTransport();
    const router = createRouter({
      luchii: {
        handleOsToLuchii: vi.fn(async () => ({
          requestId: 'req-1',
          eid: 'eid-1',
          existentialContext: baseExistentialContext(),
          reasoningTrace: baseReasoningTrace(),
        })),
      },
    });
    const runtime = new FrasbergServerRuntime(transport, router);

    await runtime.init();

    await expect(
      transport.publish('os.luchii', baseOsToLuchiiMessage()),
    ).rejects.toThrow(/content/);
  });

  it('rejects mismatched correlated handler output', async () => {
    const transport = new InMemoryServerTransport();
    const router = createRouter({
      engine: {
        handleOsToEngine: vi.fn(async () => ({
          ...baseEngineToOsMessage(),
          jobId: 'job-mismatch',
        })),
      },
    });
    const runtime = new FrasbergServerRuntime(transport, router);

    await runtime.init();

    await expect(
      transport.publish('os.engine', baseOsToEngineMessage()),
    ).rejects.toThrow(/jobId must match/);
  });

  it('propagates handler failures', async () => {
    const transport = new InMemoryServerTransport();
    const router = createRouter({
      wgql: {
        handleOsToWgql: vi.fn(async () => {
          throw new Error('wgql exploded');
        }),
      },
    });
    const runtime = new FrasbergServerRuntime(transport, router);

    await runtime.init();

    await expect(
      transport.publish('os.wgql', baseOsToWgqlMessage()),
    ).rejects.toThrow('wgql exploded');
  });

  it('surfaces missing routes and closes transport resources cleanly', async () => {
    const transport = new InMemoryServerTransport();

    await expect(transport.publish('os.luchii', {})).rejects.toBeInstanceOf(
      NoServerTransportSubscriberError,
    );

    const runtime = new FrasbergServerRuntime(transport, createRouter());
    await runtime.init();
    await runtime.close();

    expect(transport.getSubscribedChannels()).toEqual([]);
    await expect(transport.publish('os.luchii', {})).rejects.toBeInstanceOf(
      ServerTransportClosedError,
    );
  });

  it('times out slow in-memory handlers deterministically', async () => {
    vi.useFakeTimers();

    const transport = new InMemoryServerTransport(5);
    await transport.subscribe('os.luchii', async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      return baseLuchiiToOsMessage();
    });

    const pending = expect(
      transport.publish('os.luchii', baseOsToLuchiiMessage()),
    ).rejects.toBeInstanceOf(ServerTransportTimeoutError);

    await vi.advanceTimersByTimeAsync(5);

    await pending;
    vi.useRealTimers();
  });

  it('rolls back partial initialization when a registration fails', async () => {
    const transport = new FailingSubscribeTransport('os.wgql');
    const runtime = new FrasbergServerRuntime(transport, createRouter());

    await expect(runtime.init()).rejects.toThrow(
      'subscribe failed for os.wgql',
    );
    expect(transport.unsubscribedChannels).toEqual(['os.engine', 'os.luchii']);
  });
});

class FailingSubscribeTransport implements ServerTransport {
  readonly unsubscribedChannels: string[] = [];

  constructor(private readonly failingChannel: string) {}

  async subscribe(channel: string): Promise<ServerTransportSubscription> {
    if (channel === this.failingChannel) {
      throw new Error(`subscribe failed for ${channel}`);
    }

    return {
      unsubscribe: async () => {
        this.unsubscribedChannels.push(channel);
      },
    };
  }

  async publish<TResponse>(
    _channel: string,
    _payload: unknown,
    _options?: ServerTransportPublishOptions,
  ): Promise<TResponse> {
    throw new Error('not implemented');
  }
}

function createRouter(overrides: Partial<RouterConfig> = {}): RouterConfig {
  const baseRouter: RouterConfig = {
    luchii: {
      handleOsToLuchii: vi.fn(async (message) =>
        baseLuchiiToOsMessage(message),
      ),
      handleWgqlToLuchii: vi.fn(async (message) =>
        baseLuchiiToWgqlMessage(message),
      ),
    },
    engine: {
      handleOsToEngine: vi.fn(async (message) =>
        baseEngineToOsMessage(message),
      ),
      handleWgqlToEngine: vi.fn(async (message) =>
        baseEngineToWgqlMessage(message),
      ),
    },
    wgql: {
      handleOsToWgql: vi.fn(async (message) => baseWgqlToOsMessage(message)),
      handleGovernance: vi.fn(async (message) =>
        baseGovernanceResponse(message),
      ),
    },
  };

  return {
    ...baseRouter,
    ...overrides,
    luchii: { ...baseRouter.luchii, ...overrides.luchii },
    engine: { ...baseRouter.engine, ...overrides.engine },
    wgql: { ...baseRouter.wgql, ...overrides.wgql },
  };
}

function baseExistentialContext(eid = 'eid-1'): ExistentialContext {
  return {
    eid,
    existenceState: 'stable',
    continuityArc: 'observed',
    meaningScore: 0.8,
    riskProfile: 0.2,
    tags: ['core', 'safe'],
  };
}

function baseReasoningStep(): ReasoningStep {
  return {
    index: 0,
    summary: 'validated request',
    confidence: 0.9,
    tags: ['validation'],
  };
}

function baseReasoningTrace(eid = 'eid-1') {
  return {
    traceId: 'trace-1',
    eid,
    conclusion: 'accepted',
    steps: [baseReasoningStep()],
  };
}

function baseJobEnvelope(eid = 'eid-1', jobId = 'job-1'): EngineJobEnvelope {
  return {
    jobId,
    eid,
    type: 'render',
    existentialContext: baseExistentialContext(eid),
  };
}

function baseOsToLuchiiMessage(
  overrides: Partial<OsToLuchiiMessage> = {},
): OsToLuchiiMessage {
  return {
    requestId: 'req-1',
    eid: 'eid-1',
    prompt: 'summarize',
    existentialContext: baseExistentialContext('eid-1'),
    ...overrides,
  };
}

function baseLuchiiToOsMessage(
  message: Partial<OsToLuchiiMessage> = {},
): LuchiiToOsMessage {
  const eid = message.eid ?? 'eid-1';
  return {
    requestId: message.requestId ?? 'req-1',
    eid,
    content: 'answer',
    existentialContext: baseExistentialContext(eid),
    reasoningTrace: baseReasoningTrace(eid),
  };
}

function baseOsToEngineMessage(
  overrides: Partial<OsToEngineMessage> = {},
): OsToEngineMessage {
  return {
    requestId: 'req-1',
    eid: 'eid-1',
    job: baseJobEnvelope('eid-1', 'job-1'),
    input: { prompt: 'run' },
    ...overrides,
  };
}

function baseEngineToOsMessage(
  message: Partial<OsToEngineMessage> = {},
): EngineToOsMessage {
  return {
    requestId: message.requestId ?? 'req-1',
    jobId: message.job?.jobId ?? 'job-1',
    eid: message.eid ?? 'eid-1',
    status: 'completed',
    output: { ok: true },
  };
}

function baseOsToWgqlMessage(
  overrides: Partial<OsToWgqlMessage> = {},
): OsToWgqlMessage {
  return {
    queryId: 'query-1',
    eid: 'eid-1',
    rawQuery: '{ health }',
    variables: { limit: 1 },
    ...overrides,
  };
}

function baseWgqlToOsMessage(
  message: Partial<OsToWgqlMessage> = {},
): WgqlToOsMessage {
  return {
    queryId: message.queryId ?? 'query-1',
    eid: message.eid ?? 'eid-1',
    data: { health: 'ok' },
  };
}

function baseWgqlToLuchiiMessage(
  overrides: Partial<WgqlToLuchiiMessage> = {},
): WgqlToLuchiiMessage {
  return {
    queryId: 'query-2',
    eid: 'eid-2',
    query: 'interpret',
    existentialContext: baseExistentialContext('eid-2'),
    ...overrides,
  };
}

function baseLuchiiToWgqlMessage(
  message: Partial<WgqlToLuchiiMessage> = {},
): LuchiiToWgqlMessage {
  const eid = message.eid ?? 'eid-2';
  return {
    queryId: message.queryId ?? 'query-2',
    eid,
    content: 'interpreted',
    existentialContext: baseExistentialContext(eid),
    reasoningTrace: baseReasoningTrace(eid),
  };
}

function baseWgqlToEngineMessage(
  overrides: Partial<WgqlToEngineMessage> = {},
): WgqlToEngineMessage {
  return {
    queryId: 'query-3',
    eid: 'eid-3',
    job: baseJobEnvelope('eid-3', 'job-3'),
    input: { prompt: 'compile' },
    ...overrides,
  };
}

function baseEngineToWgqlMessage(
  message: Partial<WgqlToEngineMessage> = {},
): EngineToWgqlMessage {
  return {
    queryId: message.queryId ?? 'query-3',
    jobId: message.job?.jobId ?? 'job-3',
    eid: message.eid ?? 'eid-3',
    status: 'completed',
    output: { ok: true },
  };
}

function baseGovernanceMessage(
  overrides: Partial<WgqlToOsGovernanceMessage> = {},
): WgqlToOsGovernanceMessage {
  return {
    queryId: 'query-4',
    eid: 'eid-4',
    action: 'approve',
    tags: ['policy'],
    reasoningSteps: [baseReasoningStep()],
    ...overrides,
  };
}

function baseGovernanceResponse(
  message: Partial<WgqlToOsGovernanceMessage> = {},
): WgqlToOsGovernanceResponse {
  return {
    queryId: message.queryId ?? 'query-4',
    eid: message.eid ?? 'eid-4',
    action: message.action ?? 'approve',
    decision: 'approved',
    summary: 'accepted',
    tags: ['policy'],
    reasoningSteps: [baseReasoningStep()],
  };
}
