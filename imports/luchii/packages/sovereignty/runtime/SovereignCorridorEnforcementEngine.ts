export type SovereignZoneId =
  | "EU_SOVEREIGN"
  | "US_SOVEREIGN"
  | "FINANCE_GLOBAL"
  | "HEALTH_GLOBAL"
  | "GOV_NATIONAL";

export interface CorridorId {
  fromRegionId: string;
  toRegionId: string;
}

export interface SovereignCorridorRule {
  id: string; // e.g. "EU_US_FORBIDDEN"
  zones: SovereignZoneId[]; // zones this rule applies to
  forbidden: boolean;
  allowed: boolean;
}

export interface CorridorDescriptor {
  id: string; // synthetic ID
  fromRegionId: string;
  toRegionId: string;
  zones: SovereignZoneId[]; // zones intersected by this corridor
}

export interface CorridorDecision {
  allowed: boolean;
  reason: string;
  violatedRules: SovereignCorridorRule[];
}

export interface SovereignCorridorTelemetry {
  emit(event: {
    type: string;
    corridorId: string;
    fromRegionId: string;
    toRegionId: string;
    allowed: boolean;
    reason: string;
    violatedRuleIds?: string[];
  }): void;
}

export class SovereignCorridorEnforcementEngine {
  private corridors: Map<string, CorridorDescriptor>;
  private rules: SovereignCorridorRule[];
  private telemetry: SovereignCorridorTelemetry;

  constructor(
    corridors: CorridorDescriptor[],
    rules: SovereignCorridorRule[],
    telemetry: SovereignCorridorTelemetry
  ) {
    this.corridors = new Map(corridors.map((c) => [c.id, c]));
    this.rules = rules;
    this.telemetry = telemetry;
  }

  private corridorKey(fromRegionId: string, toRegionId: string): string {
    return `${fromRegionId}::${toRegionId}`;
  }

  getCorridor(fromRegionId: string, toRegionId: string): CorridorDescriptor | undefined {
    return this.corridors.get(this.corridorKey(fromRegionId, toRegionId));
  }

  decideCorridor(fromRegionId: string, toRegionId: string): CorridorDecision {
    const corridorId = this.corridorKey(fromRegionId, toRegionId);
    const corridor = this.corridors.get(corridorId);

    if (!corridor) {
      const reason = "Unknown corridor.";
      this.telemetry.emit({
        type: "sovereign_corridor_unknown",
        corridorId,
        fromRegionId,
        toRegionId,
        allowed: false,
        reason,
      });
      return {
        allowed: false,
        reason,
        violatedRules: [],
      };
    }

    const violatedRules: SovereignCorridorRule[] = [];

    for (const rule of this.rules) {
      const intersectsZone = rule.zones.some((z) => corridor.zones.includes(z));
      if (!intersectsZone) continue;

      if (rule.forbidden) {
        violatedRules.push(rule);
      }
    }

    const allowed = violatedRules.length === 0;
    const reason = allowed
      ? "Corridor allowed under sovereign rules."
      : "Corridor forbidden by one or more sovereign rules.";

    this.telemetry.emit({
      type: "sovereign_corridor_decision",
      corridorId,
      fromRegionId,
      toRegionId,
      allowed,
      reason,
      violatedRuleIds: violatedRules.map((r) => r.id),
    });

    return {
      allowed,
      reason,
      violatedRules,
    };
  }
}
