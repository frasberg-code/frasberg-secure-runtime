import { SieInsight, SieRecommendation } from "../sie/SovereignIntelligenceEngine";

export type KernelMode = "steady_state" | "self_governing" | "evolution" | "federation";

export interface DashboardSafetyEnvelopeView {
  slaOk: boolean;
  latencyOk: boolean;
  complianceOk: boolean;
  sovereigntyOk: boolean;
  meshOk: boolean;
  evolutionOk: boolean;
  overallHealthy: boolean;
}

export interface DashboardModeView {
  currentMode: KernelMode;
  allowedTransitions: KernelMode[];
  lastTransitionTime: string;
}

export interface DashboardSovereignStatsView {
  residencyViolations: number;
  corridorViolations: number;
  overridesActive: number;
  evolutionBlocksRecent: number;
  meshImbalancedRegions: number;
}

export interface DashboardCorridorHealthView {
  corridorId: string;
  name: string;
  healthScore: number;
  latencyP95Ms: number;
  status: "healthy" | "degraded" | "critical" | "frozen";
  saturation: number;
}

export interface DashboardMetricsView {
  uptimePercent: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  errorRatePercent: number;
}

export interface ConstitutionalDashboardState {
  timestamp: string;
  safetyEnvelope: DashboardSafetyEnvelopeView;
  mode: DashboardModeView;
  sovereignStats: DashboardSovereignStatsView;
  corridorHealth: DashboardCorridorHealthView[];
  metrics: DashboardMetricsView;
  insights: SieInsight[];
  recommendations: SieRecommendation[];
  systemScore: number;
}

export interface DashboardSnapshot {
  state: ConstitutionalDashboardState;
  generatedAt: string;
  isStale: boolean;
}
