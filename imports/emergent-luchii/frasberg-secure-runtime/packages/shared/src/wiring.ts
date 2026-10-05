export const EXISTENTIAL_SCORE_MIN = 0;
export const EXISTENTIAL_SCORE_MAX = 1;

export type ContinuityArc =
  | 'stable'
  | 'collapsing'
  | 'emerging'
  | 'extinct'
  | 'mythic'
  | 'transcendent';

export type EngineJobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type GovernanceDecision = 'approved' | 'rejected' | 'needs-review';

export interface ExistentialContext {
  eid: string;
  existenceState: string;
  continuityArc: string;
  meaningScore: number;
  riskProfile: number;
  tags: string[];
}

export interface ReasoningStep {
  index: number;
  summary: string;
  confidence: number;
  tags: string[];
}

export interface ReasoningTrace {
  traceId: string;
  eid: string;
  conclusion: string;
  steps: ReasoningStep[];
}

export interface EngineJobEnvelope {
  jobId: string;
  eid: string;
  type: string;
  existentialContext: ExistentialContext;
}

export interface OsToLuchiiMessage { requestId: string; eid: string; prompt: string; existentialContext: ExistentialContext }
export interface LuchiiToOsMessage { requestId: string; eid: string; content: string; existentialContext: ExistentialContext; reasoningTrace: ReasoningTrace }
export interface OsToEngineMessage { requestId: string; eid: string; job: EngineJobEnvelope; input?: Record<string, unknown> }
export interface EngineToOsMessage { requestId: string; jobId: string; eid: string; status: EngineJobStatus; output?: Record<string, unknown>; error?: string }
export interface OsToWgqlMessage { queryId: string; eid: string; rawQuery: string; variables?: Record<string, unknown> }
export interface WgqlToOsMessage { queryId: string; eid: string; data: Record<string, unknown>; errors?: string[] }
export interface WgqlToLuchiiMessage { queryId: string; eid: string; query: string; existentialContext: ExistentialContext }
export interface LuchiiToWgqlMessage { queryId: string; eid: string; content: string; existentialContext: ExistentialContext; reasoningTrace: ReasoningTrace }
export interface WgqlToEngineMessage { queryId: string; eid: string; job: EngineJobEnvelope; input?: Record<string, unknown> }
export interface EngineToWgqlMessage { queryId: string; jobId: string; eid: string; status: EngineJobStatus; output?: Record<string, unknown>; error?: string }
export interface WgqlToOsGovernanceMessage { queryId: string; eid: string; action: string; tags: string[]; reasoningSteps: ReasoningStep[] }
export interface WgqlToOsGovernanceResponse { queryId: string; eid: string; action: string; decision: GovernanceDecision; summary: string; tags: string[]; reasoningSteps: ReasoningStep[] }

export function updateExistentialContext(
  context: ExistentialContext,
  updates: Partial<Omit<ExistentialContext, 'eid'>>,
): ExistentialContext {
  return {
    ...context,
    ...updates,
    eid: context.eid,
    meaningScore: clampScore(updates.meaningScore ?? context.meaningScore),
    riskProfile: clampScore(updates.riskProfile ?? context.riskProfile),
    tags: [...(updates.tags ?? context.tags)],
  };
}

function clampScore(value: number): number {
  return Math.max(EXISTENTIAL_SCORE_MIN, Math.min(EXISTENTIAL_SCORE_MAX, value));
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string.`);
  return value;
}
function score(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1.`);
  return value;
}
function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value.map((item, index) => string(item, `${label}[${index}]`));
}
export function validateExistentialContext(value: unknown, label = 'existentialContext'): ExistentialContext {
  const item = object(value, label);
  return { eid: string(item.eid, `${label}.eid`), existenceState: string(item.existenceState, `${label}.existenceState`), continuityArc: string(item.continuityArc, `${label}.continuityArc`), meaningScore: score(item.meaningScore, `${label}.meaningScore`), riskProfile: score(item.riskProfile, `${label}.riskProfile`), tags: strings(item.tags, `${label}.tags`) };
}

export function validateReasoningStep(value: unknown, label: string): ReasoningStep {
  const item = object(value, label);
  if (typeof item.index !== 'number' || !Number.isInteger(item.index) || item.index < 0) throw new Error(`${label}.index must be a non-negative integer.`);
  return { index: item.index, summary: string(item.summary, `${label}.summary`), confidence: score(item.confidence, `${label}.confidence`), tags: strings(item.tags, `${label}.tags`) };
}
export function validateReasoningTrace(value: unknown, label = 'reasoningTrace'): ReasoningTrace {
  const item = object(value, label);
  if (!Array.isArray(item.steps)) throw new Error(`${label}.steps must be an array.`);
  return { traceId: string(item.traceId, `${label}.traceId`), eid: string(item.eid, `${label}.eid`), conclusion: string(item.conclusion, `${label}.conclusion`), steps: item.steps.map((step, index) => validateReasoningStep(step, `${label}.steps[${index}]`)) };
}

export function validateEngineJobEnvelope(value: unknown, label = 'job'): EngineJobEnvelope {
  const item = object(value, label);
  return { jobId: string(item.jobId, `${label}.jobId`), eid: string(item.eid, `${label}.eid`), type: string(item.type, `${label}.type`), existentialContext: validateExistentialContext(item.existentialContext, `${label}.existentialContext`) };
}

export function validateOsToLuchiiMessage(value: unknown, label = 'OsToLuchiiMessage'): OsToLuchiiMessage {
  const item = object(value, label);
  return { requestId: string(item.requestId, `${label}.requestId`), eid: string(item.eid, `${label}.eid`), prompt: string(item.prompt, `${label}.prompt`), existentialContext: validateExistentialContext(item.existentialContext, `${label}.existentialContext`) };
}
export function validateLuchiiToOsMessage(value: unknown, label = 'LuchiiToOsMessage'): LuchiiToOsMessage { const item = object(value, label); return { requestId: string(item.requestId, `${label}.requestId`), eid: string(item.eid, `${label}.eid`), content: string(item.content, `${label}.content`), existentialContext: validateExistentialContext(item.existentialContext, `${label}.existentialContext`), reasoningTrace: validateReasoningTrace(item.reasoningTrace, `${label}.reasoningTrace`) }; }
export function validateOsToEngineMessage(value: unknown, label = 'OsToEngineMessage'): OsToEngineMessage { const item = object(value, label); return { requestId: string(item.requestId, `${label}.requestId`), eid: string(item.eid, `${label}.eid`), job: validateEngineJobEnvelope(item.job, `${label}.job`), input: item.input as Record<string, unknown> | undefined }; }
export function validateEngineToOsMessage(value: unknown, label = 'EngineToOsMessage'): EngineToOsMessage { const item = object(value, label); return { requestId: string(item.requestId, `${label}.requestId`), jobId: string(item.jobId, `${label}.jobId`), eid: string(item.eid, `${label}.eid`), status: string(item.status, `${label}.status`) as EngineJobStatus, output: item.output as Record<string, unknown> | undefined, error: item.error === undefined ? undefined : string(item.error, `${label}.error`) }; }
export function validateOsToWgqlMessage(value: unknown, label = 'OsToWgqlMessage'): OsToWgqlMessage { const item = object(value, label); return { queryId: string(item.queryId, `${label}.queryId`), eid: string(item.eid, `${label}.eid`), rawQuery: string(item.rawQuery, `${label}.rawQuery`), variables: item.variables as Record<string, unknown> | undefined }; }
export function validateWgqlToOsMessage(value: unknown, label = 'WgqlToOsMessage'): WgqlToOsMessage { const item = object(value, label); return { queryId: string(item.queryId, `${label}.queryId`), eid: string(item.eid, `${label}.eid`), data: object(item.data, `${label}.data`), errors: item.errors as string[] | undefined }; }
export function validateWgqlToLuchiiMessage(value: unknown, label = 'WgqlToLuchiiMessage'): WgqlToLuchiiMessage { const item = object(value, label); return { queryId: string(item.queryId, `${label}.queryId`), eid: string(item.eid, `${label}.eid`), query: string(item.query, `${label}.query`), existentialContext: validateExistentialContext(item.existentialContext, `${label}.existentialContext`) }; }
export function validateLuchiiToWgqlMessage(value: unknown, label = 'LuchiiToWgqlMessage'): LuchiiToWgqlMessage { const item = object(value, label); return { queryId: string(item.queryId, `${label}.queryId`), eid: string(item.eid, `${label}.eid`), content: string(item.content, `${label}.content`), existentialContext: validateExistentialContext(item.existentialContext, `${label}.existentialContext`), reasoningTrace: validateReasoningTrace(item.reasoningTrace, `${label}.reasoningTrace`) }; }
export function validateWgqlToEngineMessage(value: unknown, label = 'WgqlToEngineMessage'): WgqlToEngineMessage { const item = object(value, label); return { queryId: string(item.queryId, `${label}.queryId`), eid: string(item.eid, `${label}.eid`), job: validateEngineJobEnvelope(item.job, `${label}.job`), input: item.input as Record<string, unknown> | undefined }; }
export function validateEngineToWgqlMessage(value: unknown, label = 'EngineToWgqlMessage'): EngineToWgqlMessage { const item = object(value, label); return { queryId: string(item.queryId, `${label}.queryId`), jobId: string(item.jobId, `${label}.jobId`), eid: string(item.eid, `${label}.eid`), status: string(item.status, `${label}.status`) as EngineJobStatus, output: item.output as Record<string, unknown> | undefined, error: item.error === undefined ? undefined : string(item.error, `${label}.error`) }; }
export function validateWgqlToOsGovernanceMessage(value: unknown, label = 'WgqlToOsGovernanceMessage'): WgqlToOsGovernanceMessage { const item = object(value, label); if (!Array.isArray(item.tags) || !Array.isArray(item.reasoningSteps)) throw new Error(`${label}.tags and reasoningSteps are required.`); return { queryId: string(item.queryId, `${label}.queryId`), eid: string(item.eid, `${label}.eid`), action: string(item.action, `${label}.action`), tags: strings(item.tags, `${label}.tags`), reasoningSteps: item.reasoningSteps.map((step, index) => validateReasoningStep(step, `${label}.reasoningSteps[${index}]`)) }; }
export function validateWgqlToOsGovernanceResponse(value: unknown, label = 'WgqlToOsGovernanceResponse'): WgqlToOsGovernanceResponse { const item = object(value, label); if (!Array.isArray(item.tags) || !Array.isArray(item.reasoningSteps)) throw new Error(`${label}.tags and reasoningSteps are required.`); return { queryId: string(item.queryId, `${label}.queryId`), eid: string(item.eid, `${label}.eid`), action: string(item.action, `${label}.action`), decision: string(item.decision, `${label}.decision`) as GovernanceDecision, summary: string(item.summary, `${label}.summary`), tags: strings(item.tags, `${label}.tags`), reasoningSteps: item.reasoningSteps.map((step, index) => validateReasoningStep(step, `${label}.reasoningSteps[${index}]`)) }; }
