import { checkHealth, type Probe } from './health-check';
import { overallStatus, type RuntimeHealth } from './status';

export class HealthMonitor {
  private readonly probes = new Map<string, Probe>();
  private readonly last = new Map<string, RuntimeHealth>();

  register(service: string, probe: Probe) {
    this.probes.set(service, probe);
  }

  async refresh(): Promise<RuntimeHealth[]> {
    const results = await Promise.all(
      [...this.probes].map(([service, probe]) => checkHealth(service, probe)),
    );
    for (const r of results) this.last.set(r.service, r);
    return results;
  }

  get(service: string): RuntimeHealth | undefined {
    return this.last.get(service);
  }

  overall() {
    return overallStatus([...this.last.values()]);
  }

  // Offline services map to 503 service_unavailable, never invalid_key.
  unavailable(service: string) {
    return this.last.get(service)?.status === 'offline'
      ? {
          status: 503 as const,
          body: {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: `${service} is unavailable.`,
            },
          },
        }
      : undefined;
  }
}
