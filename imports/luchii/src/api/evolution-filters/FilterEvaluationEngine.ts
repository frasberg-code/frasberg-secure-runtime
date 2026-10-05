import {
  EvolutionFilter,
  FilterEvaluationResult,
  EvolutionPlanEvaluation,
  SovereigntyFilter,
  SafetyFilter,
  PerformanceFilter,
  MeshFilter,
} from "../governance/types";
import { Logger, getLogger } from "../governance/logger";

export interface EvolutionPlan {
  id: string;
  name: string;
  sovereignty: Record<string, unknown>;
  safety: Record<string, number>;
  performance: Record<string, number>;
  mesh: Record<string, number>;
}

export class EvolutionFilterEvaluationEngine {
  private logger: Logger;

  constructor() {
    this.logger = getLogger("EvolutionFilterEvaluationEngine");
  }

  evaluateFilter(
    filter: EvolutionFilter,
    plan: EvolutionPlan
  ): FilterEvaluationResult {
    if (!filter.enabled) {
      return {
        filterId: filter.id,
        matches: true,
        score: 1,
        details: { reason: "filter disabled" },
      };
    }

    try {
      switch (filter.type) {
        case "SOVEREIGNTY":
          return this.evaluateSovereigntyFilter(
            filter.criteria as SovereigntyFilter,
            plan
          );
        case "SAFETY":
          return this.evaluateSafetyFilter(
            filter.criteria as SafetyFilter,
            plan
          );
        case "PERFORMANCE":
          return this.evaluatePerformanceFilter(
            filter.criteria as PerformanceFilter,
            plan
          );
        case "MESH":
          return this.evaluateMeshFilter(
            filter.criteria as MeshFilter,
            plan
          );
        default:
          return {
            filterId: filter.id,
            matches: false,
            score: 0,
            details: { error: "Unknown filter type" },
          };
      }
    } catch (error) {
      this.logger.error("Filter evaluation failed", error as Error);
      return {
        filterId: filter.id,
        matches: false,
        score: 0,
        details: { error: (error as Error).message },
      };
    }
  }

  private evaluateSovereigntyFilter(
    criteria: SovereigntyFilter,
    plan: EvolutionPlan
  ): FilterEvaluationResult {
    let score = 1;
    const violations: string[] = [];

    if (
      criteria.residencyConstraint &&
      plan.sovereignty["residency"] !== criteria.residencyConstraint
    ) {
      violations.push(
        `Residency mismatch: ${criteria.residencyConstraint}`
      );
      score -= 0.5;
    }

    if (criteria.corridorRestrictions && plan.sovereignty["corridors"]) {
      const planCorridors = plan.sovereignty["corridors"] as string[];
      const restricted = planCorridors.filter((c) =>
        criteria.corridorRestrictions!.includes(c)
      );
      if (restricted.length > 0) {
        violations.push(`Restricted corridors: ${restricted.join(", ")}`);
        score -= 0.3 * restricted.length;
      }
    }

    return {
      filterId: criteria.id,
      matches: score >= 0.5,
      score: Math.max(0, score),
      details: { violations },
    };
  }

  private evaluateSafetyFilter(
    criteria: SafetyFilter,
    plan: EvolutionPlan
  ): FilterEvaluationResult {
    let score = 1;
    const violations: string[] = [];

    const currentSla = (plan.safety["sla"] as number) || 100;
    if (currentSla < criteria.slaMinimum) {
      violations.push(`SLA below minimum: ${currentSla} < ${criteria.slaMinimum}`);
      score -= 0.4;
    }

    const latency = (plan.safety["latency"] as number) || 0;
    if (latency > criteria.latencyMaxMs) {
      violations.push(`Latency exceeds limit: ${latency}ms > ${criteria.latencyMaxMs}ms`);
      score -= 0.3;
    }

    if (criteria.complianceRequired && !plan.safety["compliant"]) {
      violations.push("Compliance required but not satisfied");
      score -= 0.3;
    }

    return {
      filterId: criteria.id,
      matches: score >= 0.5,
      score: Math.max(0, score),
      details: { violations, sla: currentSla, latency },
    };
  }

  private evaluatePerformanceFilter(
    criteria: PerformanceFilter,
    plan: EvolutionPlan
  ): FilterEvaluationResult {
    let score = 1;
    const violations: string[] = [];

    if (
      criteria.throughputMinRps &&
      (plan.performance["throughput"] as number) < criteria.throughputMinRps
    ) {
      violations.push(
        `Throughput below minimum: ${plan.performance["throughput"]} < ${criteria.throughputMinRps}`
      );
      score -= 0.3;
    }

    if (
      criteria.resourceUtilizationMax &&
      (plan.performance["utilization"] as number) > criteria.resourceUtilizationMax
    ) {
      violations.push(
        `Resource utilization exceeds limit: ${plan.performance["utilization"]} > ${criteria.resourceUtilizationMax}`
      );
      score -= 0.3;
    }

    if (
      criteria.responseTimeMaxMs &&
      (plan.performance["responseTime"] as number) > criteria.responseTimeMaxMs
    ) {
      violations.push(
        `Response time exceeds limit: ${plan.performance["responseTime"]}ms > ${criteria.responseTimeMaxMs}ms`
      );
      score -= 0.2;
    }

    return {
      filterId: criteria.id,
      matches: score >= 0.5,
      score: Math.max(0, score),
      details: {
        violations,
        throughput: plan.performance["throughput"],
        utilization: plan.performance["utilization"],
        responseTime: plan.performance["responseTime"],
      },
    };
  }

  private evaluateMeshFilter(
    criteria: MeshFilter,
    plan: EvolutionPlan
  ): FilterEvaluationResult {
    let score = 1;
    const violations: string[] = [];

    const corridorHealth = (plan.mesh["corridorHealth"] as number) || 1;
    if (corridorHealth < criteria.corridorHealthMin) {
      violations.push(
        `Corridor health below minimum: ${corridorHealth} < ${criteria.corridorHealthMin}`
      );
      score -= 0.4;
    }

    if (
      criteria.federationBalance &&
      !(plan.mesh["balanced"] as boolean)
    ) {
      violations.push("Federation not balanced");
      score -= 0.3;
    }

    if (
      criteria.meshImbalanceThreshold &&
      (plan.mesh["imbalance"] as number) > criteria.meshImbalanceThreshold
    ) {
      violations.push(
        `Mesh imbalance exceeds threshold: ${plan.mesh["imbalance"]} > ${criteria.meshImbalanceThreshold}`
      );
      score -= 0.2;
    }

    return {
      filterId: criteria.id,
      matches: score >= 0.5,
      score: Math.max(0, score),
      details: {
        violations,
        corridorHealth,
        balanced: plan.mesh["balanced"],
        imbalance: plan.mesh["imbalance"],
      },
    };
  }

  evaluatePlan(
    plan: EvolutionPlan,
    filters: EvolutionFilter[]
  ): EvolutionPlanEvaluation {
    const results = filters.map((f) => this.evaluateFilter(f, plan));
    const passed = results.every((r) => r.matches);
    const score =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 1;

    const violations: string[] = [];
    results.forEach((r) => {
      if (r.details["violations"]) {
        violations.push(...(r.details["violations"] as string[]));
      }
    });

    return {
      planId: plan.id,
      filters: results,
      passed,
      score,
      violations,
    };
  }
}
