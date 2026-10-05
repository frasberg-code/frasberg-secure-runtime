import { z } from "zod";

// Evolution Filter Types
export const FilterTypeSchema = z.enum([
  "SOVEREIGNTY",
  "SAFETY",
  "PERFORMANCE",
  "MESH",
]);
export type FilterType = z.infer<typeof FilterTypeSchema>;

export const SovereigntyFilterSchema = z.object({
  id: z.string().uuid(),
  residencyConstraint: z.string().optional(),
  corridorRestrictions: z.array(z.string()).optional(),
});
export type SovereigntyFilter = z.infer<typeof SovereigntyFilterSchema>;

export const SafetyFilterSchema = z.object({
  id: z.string().uuid(),
  slaMinimum: z.number().min(0).max(100),
  latencyMaxMs: z.number().positive(),
  complianceRequired: z.boolean().optional(),
});
export type SafetyFilter = z.infer<typeof SafetyFilterSchema>;

export const PerformanceFilterSchema = z.object({
  id: z.string().uuid(),
  throughputMinRps: z.number().positive().optional(),
  resourceUtilizationMax: z.number().min(0).max(100).optional(),
  responseTimeMaxMs: z.number().positive().optional(),
});
export type PerformanceFilter = z.infer<typeof PerformanceFilterSchema>;

export const MeshFilterSchema = z.object({
  id: z.string().uuid(),
  corridorHealthMin: z.number().min(0).max(1),
  federationBalance: z.boolean().optional(),
  meshImbalanceThreshold: z.number().min(0).max(1).optional(),
});
export type MeshFilter = z.infer<typeof MeshFilterSchema>;

export const EvolutionFilterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: FilterTypeSchema,
  criteria: z.union([
    SovereigntyFilterSchema,
    SafetyFilterSchema,
    PerformanceFilterSchema,
    MeshFilterSchema,
  ]),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EvolutionFilter = z.infer<typeof EvolutionFilterSchema>;

// Filter evaluation result
export interface FilterEvaluationResult {
  filterId: string;
  matches: boolean;
  score: number;
  details: Record<string, unknown>;
}

export interface EvolutionPlanEvaluation {
  planId: string;
  filters: FilterEvaluationResult[];
  passed: boolean;
  score: number;
  violations: string[];
}

// Kernel Mode Types
export const KernelModeSchema = z.enum([
  "steady_state",
  "self_governing",
  "evolution",
  "federation",
]);
export type KernelMode = z.infer<typeof KernelModeSchema>;

// Corridor Types
export const CorridorStatusSchema = z.enum([
  "healthy",
  "degraded",
  "frozen",
  "critical",
]);
export type CorridorStatus = z.infer<typeof CorridorStatusSchema>;

export interface Corridor {
  id: string;
  name: string;
  status: CorridorStatus;
  healthScore: number;
  frozen: boolean;
  lastHealthCheck: string;
}

// Override Types
export const OverrideStatusSchema = z.enum([
  "active",
  "revoked",
  "expired",
]);
export type OverrideStatus = z.infer<typeof OverrideStatusSchema>;

export interface SovereignOverride {
  id: string;
  type: string;
  status: OverrideStatus;
  issuedBy: string;
  issuedAt: string;
  revokedAt?: string;
  reason: string;
}
