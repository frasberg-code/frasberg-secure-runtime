import { SovereignCorridorRule } from "../../sovereignty/runtime/SovereignCorridorEnforcementEngine";

export interface GovernanceEventEmitter {
  emit(event: {
    type:
      | "sovereignty_violation"
      | "compliance_violation"
      | "corridor_forbidden"
      | "residency_violation"
      | "safety_envelope_breach";
    workloadId?: string;
    fromRegionId?: string;
    toRegionId?: string;
    corridorRuleIds?: string[];
    details?: Record<string, unknown>;
  }): void;
}

export class KernelGovernanceHooks {
  constructor(private emitter: GovernanceEventEmitter) {}

  corridorForbidden(
    workloadId: string,
    fromRegionId: string,
    toRegionId: string,
    violatedRules: SovereignCorridorRule[]
  ) {
    this.emitter.emit({
      type: "corridor_forbidden",
      workloadId,
      fromRegionId,
      toRegionId,
      corridorRuleIds: violatedRules.map((r) => r.id),
      details: {
        message: "Attempted use of forbidden corridor.",
      },
    });
  }

  residencyViolation(workloadId: string, fromRegionId: string, toRegionId: string) {
    this.emitter.emit({
      type: "residency_violation",
      workloadId,
      fromRegionId,
      toRegionId,
      details: {
        message: "Residency‑locked workload attempted illegal move.",
      },
    });
  }

  safetyEnvelopeBreach(workloadId: string, dimension: string, value: number, threshold: number) {
    this.emitter.emit({
      type: "safety_envelope_breach",
      workloadId,
      details: {
        dimension,
        value,
        threshold,
      },
    });
  }
}
