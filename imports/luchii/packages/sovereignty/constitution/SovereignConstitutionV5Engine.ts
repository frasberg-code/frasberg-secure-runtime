import { Logger, getLogger } from "../../core/governance/logger";
import { v4 as uuidv4 } from "uuid";

export interface ConstitutionalAmendment {
  id: string;
  timestamp: string;
  category: "routing" | "override" | "mesh" | "evolution" | "safety";
  isStructural: boolean;
  changes: Record<string, any>;
  rationale: string;
  priority: "low" | "medium" | "high" | "critical";
}

export interface SelfAmendmentDecision {
  id: string;
  timestamp: string;
  applied: boolean;
  requiresApproval: boolean;
  reason: string;
  amendment: ConstitutionalAmendment;
  approvalStatus?: "pending" | "approved" | "rejected";
}

export interface ConstitutionState {
  version: "v5";
  baseVersion: "v3" | "v4";
  appliedAmendments: ConstitutionalAmendment[];
  totalAmendmentsProposed: number;
  totalAmendmentsApplied: number;
  amendmentHistory: SelfAmendmentDecision[];
}

export interface SovereignConstitutionV5Deps {
  memory: {
    write: (record: any) => void;
    read: (id: string) => any;
    query: (filter: any) => any[];
  };
  governance: {
    emit: (event: any) => void;
  };
  amendmentProposer: {
    proposeAmendments: (ctx: any) => ConstitutionalAmendment[];
  };
}

export class SovereignConstitutionV5Engine {
  private logger: Logger;
  private state: ConstitutionState;

  constructor(
    private readonly deps: SovereignConstitutionV5Deps,
    baseVersion: "v3" | "v4" = "v4"
  ) {
    this.logger = getLogger("SovereignConstitutionV5");
    this.state = {
      version: "v5",
      baseVersion,
      appliedAmendments: [],
      totalAmendmentsProposed: 0,
      totalAmendmentsApplied: 0,
      amendmentHistory: [],
    };

    this.logger.info("SovereignConstitution V5 Engine initialized", { baseVersion });
  }

  /**
   * Evaluate constitutional context and propose/apply amendments
   */
  evaluateAndAmend(ctx: any): SelfAmendmentDecision[] {
    this.logger.info("Evaluating constitutional context for amendments");

    const proposals = this.deps.amendmentProposer.proposeAmendments(ctx);
    const decisions: SelfAmendmentDecision[] = [];
    const now = new Date().toISOString();

    this.state.totalAmendmentsProposed += proposals.length;

    for (const proposal of proposals) {
      const decision: SelfAmendmentDecision = {
        id: `self_amend_${uuidv4()}`,
        timestamp: now,
        applied: false,
        requiresApproval: false,
        reason: "",
        amendment: {
          ...proposal,
          id: proposal.id || `amend_${uuidv4()}`,
          timestamp: now,
        },
      };

      // Evaluate amendment type and determine if it can auto-apply
      const isAutoAppliable = this.isAutoAppliable(proposal);

      if (isAutoAppliable && proposal.priority !== "critical") {
        // Auto-apply low-risk structural changes
        decision.applied = this.applyAmendment(decision.amendment);

        if (decision.applied) {
          decision.reason = "Structural amendment auto-applied by Constitution V5.";
          this.state.totalAmendmentsApplied++;
          this.state.appliedAmendments.push(decision.amendment);

          this.logger.info("Amendment auto-applied", {
            category: proposal.category,
            changes: Object.keys(proposal.changes),
          });
        } else {
          decision.reason = "Amendment application failed - may require manual intervention.";
          decision.requiresApproval = true;
        }
      } else {
        // Critical or complex amendments require sovereign council approval
        decision.requiresApproval = true;
        decision.reason = proposal.priority === "critical"
          ? "Critical amendment requires sovereign council approval."
          : "Complex amendment requires sovereign council approval.";

        this.logger.info("Amendment requires approval", {
          category: proposal.category,
          priority: proposal.priority,
        });
      }

      // Persist amendment to memory
      this.deps.memory.write({
        id: decision.id,
        timestamp: decision.timestamp,
        type: "CONSTITUTION_AMENDMENT",
        payload: decision,
      });

      // Emit governance event
      this.deps.governance.emit({
        type: "constitutional_self_amendment",
        details: decision,
      });

      this.state.amendmentHistory.push(decision);
      decisions.push(decision);
    }

    this.logger.info("Amendment evaluation complete", {
      proposed: proposals.length,
      autoApplied: decisions.filter((d) => d.applied).length,
      requiresApproval: decisions.filter((d) => d.requiresApproval).length,
    });

    return decisions;
  }

  /**
   * Determine if amendment can be auto-applied
   */
  private isAutoAppliable(amendment: ConstitutionalAmendment): boolean {
    // Only auto-apply structural amendments (not policy or security changes)
    if (!amendment.isStructural) {
      return false;
    }

    // Don't auto-apply safety-critical amendments
    if (amendment.category === "safety") {
      return false;
    }

    // Only low/medium priority structural amendments auto-apply
    if (amendment.priority === "high" || amendment.priority === "critical") {
      return false;
    }

    // Routing health minimum scores can auto-adjust
    if ("routingHealthMinimumScore" in amendment.changes) {
      return true;
    }

    // Override max duration can auto-adjust
    if ("overrideMaxDurationHours" in amendment.changes) {
      return true;
    }

    // Mesh rebalance thresholds can auto-adjust
    if ("meshRebalanceThreshold" in amendment.changes) {
      return true;
    }

    // Evolution cooldown periods can auto-adjust
    if ("evolutionCooldownMinutes" in amendment.changes) {
      return true;
    }

    return false;
  }

  /**
   * Apply amendment to current constitution state
   */
  private applyAmendment(amendment: ConstitutionalAmendment): boolean {
    try {
      this.logger.debug("Applying amendment", {
        id: amendment.id,
        changes: Object.keys(amendment.changes),
      });

      // In a real implementation, this would update the actual constitutional rules
      // For now, we track the application
      for (const [key, value] of Object.entries(amendment.changes)) {
        this.logger.debug("Amendment change applied", { key, oldValue: "N/A", newValue: value });
      }

      return true;
    } catch (error) {
      this.logger.error("Failed to apply amendment", error);
      return false;
    }
  }

  /**
   * Get current constitutional state
   */
  getState(): ConstitutionState {
    return { ...this.state };
  }

  /**
   * Get amendment history (optionally filtered)
   */
  getAmendmentHistory(filter?: {
    category?: string;
    applied?: boolean;
    limit?: number;
  }): SelfAmendmentDecision[] {
    let history = [...this.state.amendmentHistory];

    if (filter?.category) {
      history = history.filter((d) => d.amendment.category === filter.category);
    }

    if (filter?.applied !== undefined) {
      history = history.filter((d) => d.applied === filter.applied);
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * Get statistics about amendments
   */
  getStatistics() {
    const byCategory = this.state.appliedAmendments.reduce(
      (acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPriority = this.state.appliedAmendments.reduce(
      (acc, a) => {
        acc[a.priority] = (acc[a.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalProposed: this.state.totalAmendmentsProposed,
      totalApplied: this.state.totalAmendmentsApplied,
      approvalRate: this.state.totalAmendmentsProposed > 0
        ? ((this.state.totalAmendmentsApplied / this.state.totalAmendmentsProposed) * 100).toFixed(2) + "%"
        : "N/A",
      byCategory,
      byPriority,
      lastAmendment: this.state.amendmentHistory[this.state.amendmentHistory.length - 1]?.timestamp || "Never",
    };
  }

  /**
   * Propose amendment for sovereign council approval
   */
  proposeAmendment(amendment: Omit<ConstitutionalAmendment, "id" | "timestamp">): SelfAmendmentDecision {
    const now = new Date().toISOString();
    const fullAmendment: ConstitutionalAmendment = {
      ...amendment,
      id: `amend_${uuidv4()}`,
      timestamp: now,
    };

    const decision: SelfAmendmentDecision = {
      id: `self_amend_${uuidv4()}`,
      timestamp: now,
      applied: false,
      requiresApproval: true,
      reason: "Proposed amendment pending sovereign council approval",
      amendment: fullAmendment,
      approvalStatus: "pending",
    };

    this.logger.info("Amendment proposed for council approval", {
      category: amendment.category,
      priority: amendment.priority,
    });

    this.deps.memory.write({
      id: decision.id,
      timestamp: now,
      type: "CONSTITUTION_AMENDMENT_PROPOSAL",
      payload: decision,
    });

    this.deps.governance.emit({
      type: "constitutional_amendment_proposal",
      details: decision,
    });

    return decision;
  }

  /**
   * Apply council-approved amendment
   */
  applyApprovedAmendment(decisionId: string): boolean {
    const decision = this.state.amendmentHistory.find((d) => d.id === decisionId);
    if (!decision) {
      this.logger.warn("Amendment decision not found", { decisionId });
      return false;
    }

    const success = this.applyAmendment(decision.amendment);
    if (success) {
      decision.applied = true;
      decision.approvalStatus = "approved";
      this.state.appliedAmendments.push(decision.amendment);
      this.state.totalAmendmentsApplied++;

      this.logger.info("Approved amendment applied", { decisionId });

      this.deps.governance.emit({
        type: "constitutional_amendment_approved_and_applied",
        details: decision,
      });
    }

    return success;
  }

  /**
   * Reject amendment proposal
   */
  rejectAmendment(decisionId: string, reason: string): boolean {
    const decision = this.state.amendmentHistory.find((d) => d.id === decisionId);
    if (!decision) {
      this.logger.warn("Amendment decision not found", { decisionId });
      return false;
    }

    decision.approvalStatus = "rejected";
    decision.reason = `Rejected by sovereign council: ${reason}`;

    this.logger.info("Amendment rejected", { decisionId, reason });

    this.deps.governance.emit({
      type: "constitutional_amendment_rejected",
      details: { decision, rejectionReason: reason },
    });

    return true;
  }
}

export function createSovereignConstitutionV5Engine(
  deps: SovereignConstitutionV5Deps,
  baseVersion?: "v3" | "v4"
) {
  return new SovereignConstitutionV5Engine(deps, baseVersion);
}
