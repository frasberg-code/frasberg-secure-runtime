import { describe, expect, it, vi } from 'vitest';
import { createEmergentAgent, EmergentAgentRuntime } from '../src';

describe('EmergentAgent wired into shared runtime', () => {
  const make = () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ jobId: 'j1', status: 'queued' }),
    })) as unknown as typeof fetch;
    const runtime = new EmergentAgentRuntime('http://rt', 'key', fetchImpl);
    const agent = createEmergentAgent({
      runtime,
      identity: { id: 'u1', workspaceId: 'w1' },
    });
    return { agent, fetchImpl };
  };

  it('routes music requests to /api/music', async () => {
    const { agent, fetchImpl } = make();
    const out = await agent.execute('make a beat');
    expect(out.model).toBe('luchii-music');
    expect((fetchImpl as any).mock.calls[0][0]).toBe('http://rt/api/music');
  });

  it('routes chat requests to /v1/chat/completions and remembers them', async () => {
    const { agent, fetchImpl } = make();
    await agent.execute('hello there friend');
    expect((fetchImpl as any).mock.calls[0][0]).toBe(
      'http://rt/v1/chat/completions',
    );
    await agent.execute('hello again friend');
    const body = JSON.parse((fetchImpl as any).mock.calls[1][1].body);
    expect(body.messages[0].content).toContain('hello there friend');
    expect(body.messages.at(-1).content).toBe('hello again friend');
  });

  it('rejects unstructured input routed to GT6', async () => {
    const { agent } = make();
    await expect(agent.execute('simulate a race')).rejects.toThrow(
      'GT6 requests must be JSON matching the OrchestratorRequest schema.',
    );
  });

  it('runs structured race requests through the GT6 orchestrator', async () => {
    const { agent, fetchImpl } = make();
    const request = {
      intent: {},
      permissions: {},
      maxCostWeight: 0,
      raceConfig: {
        raceId: 'race-test',
        track: {
          id: 'track-test',
          name: 'Test Track',
          lengthKm: 3,
          weather: 'clear',
          trackTempC: 20,
          surfaceGrip: 1,
        },
        cars: [],
        lapCount: 1,
        driverProfiles: [],
      },
    };

    const out = await agent.execute(JSON.stringify(request));

    expect(out.model).toBe('gt6-runtime');
    expect(out.response).toMatchObject({
      raceState: { raceId: 'race-test' },
    });
    expect((out.response as { enginesUsed: string[] }).enginesUsed).toContain(
      'logic',
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
