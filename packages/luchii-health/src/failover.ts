import type { HealthMonitor } from './monitor';

// Returns the first healthy (or degraded) target, preferring the order given.
export function pickTarget(
  monitor: HealthMonitor,
  targets: string[],
): string | undefined {
  const healthy = targets.find((t) => monitor.get(t)?.status === 'healthy');
  if (healthy) return healthy;
  return targets.find((t) => monitor.get(t)?.status === 'degraded');
}
