import type { RuntimeHealth } from './status';

export type Probe = () => Promise<unknown>;

export async function checkHealth(
  service: string,
  probe: Probe,
  opts: { timeoutMs?: number; degradedMs?: number; now?: () => number } = {},
): Promise<RuntimeHealth> {
  const now = opts.now ?? Date.now;
  const timeoutMs = opts.timeoutMs ?? 3000;
  const degradedMs = opts.degradedMs ?? 1000;
  const started = now();
  try {
    await Promise.race([
      probe(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs).unref?.(),
      ),
    ]);
    const latencyMs = now() - started;
    return {
      service,
      status: latencyMs > degradedMs ? 'degraded' : 'healthy',
      latencyMs,
    };
  } catch {
    return { service, status: 'offline', latencyMs: now() - started };
  }
}
