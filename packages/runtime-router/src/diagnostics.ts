import { GovernanceEngine, WorldGraphEngine } from '@frasberg/shared';
import { AnomalyEngine } from './anomaly-engine';

export interface QuantumCollapseSampler {
  sampleCollapseProbability(eid: string): Promise<number> | number;
}

export interface DiagnosticsInput {
  sampleEids?: string[];
  clusterId?: string;
}

export interface QuantumCollapseSampleResult {
  eid: string;
  probability?: number;
  error?: string;
}

export interface RuntimeDiagnosticsReport {
  worldCount: number;
  policyCount: number;
  anomalyCount: number;
  sampledCollapses: QuantumCollapseSampleResult[];
}

export class DiagnosticsEngine {
  constructor(
    private readonly worldGraphEngine: WorldGraphEngine,
    private readonly governanceEngine: GovernanceEngine,
    private readonly anomalyEngine: AnomalyEngine,
    private readonly sampler: QuantumCollapseSampler,
  ) {}

  async generateReport(
    input: DiagnosticsInput = {},
  ): Promise<RuntimeDiagnosticsReport> {
    const sampleEids = readSampleEids(input.sampleEids);
    const anomalies = this.anomalyEngine.detect({ clusterId: input.clusterId });
    const worldCount =
      input.clusterId === undefined
        ? this.worldGraphEngine.getWorldCount()
        : new Set(
            this.worldGraphEngine
              .listNodes({ clusterId: input.clusterId })
              .map((node) => node.clusterId),
          ).size;
    const sampledCollapses: QuantumCollapseSampleResult[] = [];

    for (const eid of sampleEids) {
      try {
        const probability = await this.sampler.sampleCollapseProbability(eid);
        sampledCollapses.push({
          eid,
          probability: clampUnitInterval(probability),
        });
      } catch (error) {
        sampledCollapses.push({
          eid,
          error:
            error instanceof Error
              ? error.message
              : 'Unknown collapse sampling failure.',
        });
      }
    }

    return {
      worldCount,
      policyCount: this.governanceEngine.getPolicyCount(),
      anomalyCount: anomalies.length,
      sampledCollapses,
    };
  }
}

function readSampleEids(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('sampleEids must be an array of non-empty strings.');
  }

  return value.map((entry, index) => {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      throw new Error(`sampleEids[${index}] must be a non-empty string.`);
    }

    return entry;
  });
}

function clampUnitInterval(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Collapse probability must be a finite number.');
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}
