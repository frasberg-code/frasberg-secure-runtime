export type KernelMode = "bootstrap" | "steady_state" | "evolution" | "self_governing";

export interface SafetyEnvelopeSnapshot {
  slaOk: boolean;
  latencyOk: boolean;
  complianceOk: boolean;
  sovereigntyOk: boolean;
  meshOk: boolean;
  evolutionOk: boolean;
}

export interface ModeTransitionDecision {
  allowed: boolean;
  from: KernelMode;
  to: KernelMode;
  reason: string;
}

export class KernelModeManager {
  private currentMode: KernelMode = "bootstrap";

  constructor(private readonly safetySnapshotProvider: () => SafetyEnvelopeSnapshot) {}

  getMode(): KernelMode {
    return this.currentMode;
  }

  canTransition(to: KernelMode): ModeTransitionDecision {
    const snapshot = this.safetySnapshotProvider();
    const from = this.currentMode;

    // Hard rules:
    // - self_governing only if ALL safety dimensions are green
    // - evolution only if compliance + sovereignty + mesh are green
    // - steady_state requires minimum SLA + compliance + sovereignty
    // - bootstrap → steady_state allowed once minimal safety is met

    if (from === "bootstrap" && to === "steady_state") {
      if (snapshot.slaOk && snapshot.complianceOk && snapshot.sovereigntyOk) {
        return { allowed: true, from, to, reason: "Minimal safety envelope satisfied." };
      }
      return {
        allowed: false,
        from,
        to,
        reason: "Cannot leave bootstrap: SLA/compliance/sovereignty not yet green.",
      };
    }

    if (to === "evolution") {
      if (snapshot.complianceOk && snapshot.sovereigntyOk && snapshot.meshOk && snapshot.evolutionOk) {
        return { allowed: true, from, to, reason: "Evolution envelope satisfied." };
      }
      return {
        allowed: false,
        from,
        to,
        reason: "Evolution blocked: one or more evolution safety dimensions are amber/red.",
      };
    }

    if (to === "self_governing") {
      const allOk =
        snapshot.slaOk &&
        snapshot.latencyOk &&
        snapshot.complianceOk &&
        snapshot.sovereigntyOk &&
        snapshot.meshOk &&
        snapshot.evolutionOk;

      if (allOk) {
        return { allowed: true, from, to, reason: "All safety envelope dimensions green." };
      }
      return {
        allowed: false,
        from,
        to,
        reason: "Self‑governing blocked: safety envelope not fully green.",
      };
    }

    if (to === "steady_state") {
      if (snapshot.slaOk && snapshot.complianceOk && snapshot.sovereigntyOk) {
        return { allowed: true, from, to, reason: "Core safety dimensions satisfied." };
      }
      return {
        allowed: false,
        from,
        to,
        reason: "steady_state blocked: SLA/compliance/sovereignty not green.",
      };
    }

    return { allowed: false, from, to, reason: "Unsupported transition." };
  }

  transition(to: KernelMode): ModeTransitionDecision {
    const decision = this.canTransition(to);
    if (decision.allowed) {
      this.currentMode = to;
    }
    return decision;
  }
}
