export type SovereignOverrideScope = "WORKLOAD" | "CORRIDOR" | "ZONE" | "GLOBAL";

export interface SovereignOverrideRequest {
  id: string;
  scope: SovereignOverrideScope;
  requester: string; // sovereign authority / regulator
  reason: string;
  workloadId?: string;
  corridorId?: string;
  zoneId?: string;
  expiresAt?: string; // ISO 8601
}

export interface SovereignOverrideDecision {
  approved: boolean;
  approvedBy: string[];
  reason: string;
}

export interface SovereignOverrideRuntimeConfig {
  allowedRequesters: string[];
  maxDurationHours: number;
}

export interface SovereignOverrideTelemetry {
  emit(event: {
    type: "override_requested" | "override_approved" | "override_rejected" | "override_expired";
    overrideId: string;
    scope: SovereignOverrideScope;
    requester: string;
    reason: string;
  }): void;
}

export class SovereignOverrideChannel {
  private activeOverrides = new Map<string, SovereignOverrideRequest>();

  constructor(
    private readonly config: SovereignOverrideRuntimeConfig,
    private readonly telemetry: SovereignOverrideTelemetry
  ) {}

  requestOverride(req: SovereignOverrideRequest): SovereignOverrideDecision {
    if (!this.config.allowedRequesters.includes(req.requester)) {
      this.telemetry.emit({
        type: "override_rejected",
        overrideId: req.id,
        scope: req.scope,
        requester: req.requester,
        reason: "Requester not authorized.",
      });
      return { approved: false, approvedBy: [], reason: "Requester not authorized." };
    }

    // Duration check
    if (req.expiresAt) {
      const expires = new Date(req.expiresAt).getTime();
      const now = Date.now();
      const hours = (expires - now) / (1000 * 60 * 60);
      if (hours > this.config.maxDurationHours) {
        this.telemetry.emit({
          type: "override_rejected",
          overrideId: req.id,
          scope: req.scope,
          requester: req.requester,
          reason: "Override duration exceeds maximum allowed.",
        });
        return { approved: false, approvedBy: [], reason: "Duration too long." };
      }
    }

    this.activeOverrides.set(req.id, req);

    this.telemetry.emit({
      type: "override_approved",
      overrideId: req.id,
      scope: req.scope,
      requester: req.requester,
      reason: req.reason,
    });

    return {
      approved: true,
      approvedBy: [req.requester],
      reason: "Override approved under sovereign authority.",
    };
  }

  isOverrideActive(id: string): boolean {
    const o = this.activeOverrides.get(id);
    if (!o) return false;
    if (!o.expiresAt) return true;
    return new Date(o.expiresAt).getTime() > Date.now();
  }

  getActiveOverrides(): SovereignOverrideRequest[] {
    return [...this.activeOverrides.values()].filter((o) => this.isOverrideActive(o.id));
  }

  expireOverride(id: string) {
    const o = this.activeOverrides.get(id);
    if (!o) return;
    this.activeOverrides.delete(id);
    this.telemetry.emit({
      type: "override_expired",
      overrideId: id,
      scope: o.scope,
      requester: o.requester,
      reason: "Override expired.",
    });
  }
}
