import { describe, expect, it } from 'vitest';
import { EmergentAgent } from '../src';

describe('EmergentAgent', () => {
  it('routes, recalls, orchestrates and remembers', async () => {
    const remembered: unknown[] = [];
    const agent = new EmergentAgent(
      { route: (i) => (i.includes('song') ? 'luchii-music' : 'luchii-chat') },
      { recall: () => ['ctx'], remember: (_i, r) => void remembered.push(r) },
      { id: 'u1', workspaceId: 'w1' },
      { run: async (i, c) => `${c.model}:${i}:${c.memory.join()}` },
    );
    const out = await agent.execute('make a song');
    expect(out).toEqual({
      model: 'luchii-music',
      response: 'luchii-music:make a song:ctx',
    });
    expect(remembered).toEqual(['luchii-music:make a song:ctx']);
  });
});
