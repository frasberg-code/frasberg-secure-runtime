import { randomUUID } from 'node:crypto';
import {
  EXISTENTIAL_SCORE_MAX,
  EXISTENTIAL_SCORE_MIN,
  WorldGraphEngine,
} from '@frasberg/shared';

export interface AnomalyThresholds {
  meaningSpikeThreshold: number;
  riskSpikeThreshold: number;
}

export type AnomalyType = 'meaning-spike' | 'risk-spike' | 'arc-flip';

export interface AnomalyEvent {
  id: string;
  detectedAt: string;
  eid: string;
  clusterId: string;
  type: AnomalyType;
  previousValue: string | number;
  currentValue: string | number;
}

export interface DetectAnomaliesOptions {
  clusterId?: string;
}

interface PreviousNodeState {
  meaningScore: number;
  riskProfile: number;
  continuityArc: string;
}

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  meaningSpikeThreshold: 0.35,
  riskSpikeThreshold: 0.35,
};

export class AnomalyEngine {
  private readonly previousNodeState = new Map<string, PreviousNodeState>();
  private thresholds: AnomalyThresholds;

  constructor(
    private readonly worldGraphEngine: WorldGraphEngine,
    thresholds: Partial<AnomalyThresholds> = {},
  ) {
    this.thresholds = {
      meaningSpikeThreshold: clampUnitInterval(
        thresholds.meaningSpikeThreshold ??
          DEFAULT_THRESHOLDS.meaningSpikeThreshold,
      ),
      riskSpikeThreshold: clampUnitInterval(
        thresholds.riskSpikeThreshold ?? DEFAULT_THRESHOLDS.riskSpikeThreshold,
      ),
    };
  }

  getThresholds(): AnomalyThresholds {
    return {
      ...this.thresholds,
    };
  }

  updateThresholds(thresholds: Partial<AnomalyThresholds>): AnomalyThresholds {
    this.thresholds = {
      meaningSpikeThreshold:
        thresholds.meaningSpikeThreshold === undefined
          ? this.thresholds.meaningSpikeThreshold
          : clampUnitInterval(thresholds.meaningSpikeThreshold),
      riskSpikeThreshold:
        thresholds.riskSpikeThreshold === undefined
          ? this.thresholds.riskSpikeThreshold
          : clampUnitInterval(thresholds.riskSpikeThreshold),
    };
    return this.getThresholds();
  }

  detect(options: DetectAnomaliesOptions = {}): AnomalyEvent[] {
    const nodes =
      options.clusterId === undefined
        ? this.worldGraphEngine.listNodes()
        : this.worldGraphEngine.listNodes({ clusterId: options.clusterId });
    const now = new Date().toISOString();
    const anomalies: AnomalyEvent[] = [];

    for (const node of nodes) {
      const previous = this.previousNodeState.get(node.eid);
      if (previous) {
        if (
          node.meaningScore - previous.meaningScore >=
          this.thresholds.meaningSpikeThreshold
        ) {
          anomalies.push({
            id: randomUUID(),
            detectedAt: now,
            eid: node.eid,
            clusterId: node.clusterId,
            type: 'meaning-spike',
            previousValue: previous.meaningScore,
            currentValue: node.meaningScore,
          });
        }

        if (
          node.riskProfile - previous.riskProfile >=
          this.thresholds.riskSpikeThreshold
        ) {
          anomalies.push({
            id: randomUUID(),
            detectedAt: now,
            eid: node.eid,
            clusterId: node.clusterId,
            type: 'risk-spike',
            previousValue: previous.riskProfile,
            currentValue: node.riskProfile,
          });
        }

        if (node.continuityArc !== previous.continuityArc) {
          anomalies.push({
            id: randomUUID(),
            detectedAt: now,
            eid: node.eid,
            clusterId: node.clusterId,
            type: 'arc-flip',
            previousValue: previous.continuityArc,
            currentValue: node.continuityArc,
          });
        }
      }

      this.previousNodeState.set(node.eid, {
        meaningScore: node.meaningScore,
        riskProfile: node.riskProfile,
        continuityArc: node.continuityArc,
      });
    }

    return anomalies.map((event) => ({ ...event }));
  }
}

function clampUnitInterval(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Threshold values must be finite numbers.');
  }

  if (value < EXISTENTIAL_SCORE_MIN) {
    return EXISTENTIAL_SCORE_MIN;
  }

  if (value > EXISTENTIAL_SCORE_MAX) {
    return EXISTENTIAL_SCORE_MAX;
  }

  return value;
}
