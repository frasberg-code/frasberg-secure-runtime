export type SovereignAuditEventType =
  | "RESIDENCY_DECISION"
  | "RESIDENCY_VIOLATION"
  | "CORRIDOR_DECISION"
  | "CORRIDOR_FORBIDDEN"
  | "SOVEREIGN_OVERRIDE"
  | "SAFETY_ENVELOPE_BREACH";

export interface SovereignAuditEventBase {
  id: string;
  timestamp: string; // ISO 8601
  type: SovereignAuditEventType;
  workloadId?: string;
  actor: "AUTONOMY_KERNEL" | "FEDERATION_ENGINE" | "SOVEREIGN_COUNCIL" | "SYSTEM";
  sovereignZones: string[];
}

export interface ResidencyDecisionEvent extends SovereignAuditEventBase {
  type: "RESIDENCY_DECISION";
  fromRegionId: string;
  toRegionId: string;
  allowed: boolean;
  reason: string;
  zoneDecisions: {
    zone: string;
    allowed: boolean;
    reason: string;
  }[];
}

export interface ResidencyViolationEvent extends SovereignAuditEventBase {
  type: "RESIDENCY_VIOLATION";
  fromRegionId: string;
  toRegionId: string;
  reason: string;
}

export interface CorridorDecisionEvent extends SovereignAuditEventBase {
  type: "CORRIDOR_DECISION";
  corridorId: string;
  fromRegionId: string;
  toRegionId: string;
  allowed: boolean;
  reason: string;
  violatedRuleIds?: string[];
}

export interface CorridorForbiddenEvent extends SovereignAuditEventBase {
  type: "CORRIDOR_FORBIDDEN";
  corridorId: string;
  fromRegionId: string;
  toRegionId: string;
  violatedRuleIds: string[];
}

export interface SovereignOverrideEvent extends SovereignAuditEventBase {
  type: "SOVEREIGN_OVERRIDE";
  overrideId: string;
  reason: string;
  approvedBy: string[];
}

export interface SafetyEnvelopeBreachEvent extends SovereignAuditEventBase {
  type: "SAFETY_ENVELOPE_BREACH";
  dimension: string;
  value: number;
  threshold: number;
}

export type SovereignAuditEvent =
  | ResidencyDecisionEvent
  | ResidencyViolationEvent
  | CorridorDecisionEvent
  | CorridorForbiddenEvent
  | SovereignOverrideEvent
  | SafetyEnvelopeBreachEvent;
