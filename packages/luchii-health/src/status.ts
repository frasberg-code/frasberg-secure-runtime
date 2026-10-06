export interface RuntimeHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
}

export function overallStatus(items: RuntimeHealth[]): RuntimeHealth['status'] {
  if (items.length === 0 || items.every((i) => i.status === 'offline'))
    return 'offline';
  return items.every((i) => i.status === 'healthy') ? 'healthy' : 'degraded';
}
