export const EXISTENTIAL_SCORE_MIN = 0;
export const EXISTENTIAL_SCORE_MAX = 1;

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

export interface OsToLuchiiMessage {
  requestId: string;
  eid: string;
  prompt: string;
  existentialContext: ExistentialContext;
}

export interface LuchiiToOsMessage {
  requestId: string;
  eid: string;
  content: string;
  existentialContext: ExistentialContext;
  reasoningTrace: ReasoningTrace;
}

export interface OsToEngineMessage {
  requestId: string;
  eid: string;
  job: EngineJobEnvelope;
  input?: Record<string, unknown>;
}

export interface EngineToOsMessage {
  requestId: string;
  jobId: string;
  eid: string;
  status: EngineJobStatus;
  output?: Record<string, unknown>;
  error?: string;
}

export interface OsToWgqlMessage {
  queryId: string;
  eid: string;
  rawQuery: string;
  variables?: Record<string, unknown>;
}

export interface WgqlToOsMessage {
  queryId: string;
  eid: string;
  data: Record<string, unknown>;
  errors?: string[];
}

export interface WgqlToLuchiiMessage {
  queryId: string;
  eid: string;
  query: string;
  existentialContext: ExistentialContext;
}

export interface LuchiiToWgqlMessage {
  queryId: string;
  eid: string;
  content: string;
  existentialContext: ExistentialContext;
  reasoningTrace: ReasoningTrace;
}

export interface WgqlToEngineMessage {
  queryId: string;
  eid: string;
  job: EngineJobEnvelope;
  input?: Record<string, unknown>;
}

export interface EngineToWgqlMessage {
  queryId: string;
  jobId: string;
  eid: string;
  status: EngineJobStatus;
  output?: Record<string, unknown>;
  error?: string;
}

export interface WgqlToOsGovernanceMessage {
  queryId: string;
  eid: string;
  action: string;
  tags: string[];
  reasoningSteps: ReasoningStep[];
}

export interface WgqlToOsGovernanceResponse {
  queryId: string;
  eid: string;
  action: string;
  decision: GovernanceDecision;
  summary: string;
  tags: string[];
  reasoningSteps: ReasoningStep[];
}

function readObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function readScore(value: unknown, label: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < EXISTENTIAL_SCORE_MIN ||
    value > EXISTENTIAL_SCORE_MAX
  ) {
    throw new Error(
      `${label} must be a finite number between ${EXISTENTIAL_SCORE_MIN} and ${EXISTENTIAL_SCORE_MAX}.`,
    );
  }

  return value;
}

function readInteger(value: unknown, label: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    !Number.isFinite(value)
  ) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return value;
}

function readStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value.map((entry, index) =>
    readNonEmptyString(entry, `${label}[${index}]`),
  );
}

function readOptionalRecord(
  value: unknown,
  label: string,
): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  return readObject(value, label);
}

function readEngineStatus(value: unknown, label: string): EngineJobStatus {
  const status = readNonEmptyString(value, label);
  if (!['queued', 'running', 'completed', 'failed'].includes(status)) {
    throw new Error(`${label} must be a supported engine job status.`);
  }

  return status as EngineJobStatus;
}

function readGovernanceDecision(
  value: unknown,
  label: string,
): GovernanceDecision {
  const decision = readNonEmptyString(value, label);
  if (!['approved', 'rejected', 'needs-review'].includes(decision)) {
    throw new Error(`${label} must be a supported governance decision.`);
  }

  return decision as GovernanceDecision;
}

export function validateExistentialContext(
  value: unknown,
  label = 'existentialContext',
): ExistentialContext {
  const object = readObject(value, label);
  return {
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    existenceState: readNonEmptyString(
      object.existenceState,
      `${label}.existenceState`,
    ),
    continuityArc: readNonEmptyString(
      object.continuityArc,
      `${label}.continuityArc`,
    ),
    meaningScore: readScore(object.meaningScore, `${label}.meaningScore`),
    riskProfile: readScore(object.riskProfile, `${label}.riskProfile`),
    tags: readStringArray(object.tags, `${label}.tags`),
  };
}

export function validateReasoningStep(
  value: unknown,
  label: string,
): ReasoningStep {
  const object = readObject(value, label);
  return {
    index: readInteger(object.index, `${label}.index`),
    summary: readNonEmptyString(object.summary, `${label}.summary`),
    confidence: readScore(object.confidence, `${label}.confidence`),
    tags: readStringArray(object.tags, `${label}.tags`),
  };
}

export function validateReasoningTrace(
  value: unknown,
  label = 'reasoningTrace',
): ReasoningTrace {
  const object = readObject(value, label);
  if (!Array.isArray(object.steps)) {
    throw new Error(`${label}.steps must be an array.`);
  }

  return {
    traceId: readNonEmptyString(object.traceId, `${label}.traceId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    conclusion: readNonEmptyString(object.conclusion, `${label}.conclusion`),
    steps: object.steps.map((step, index) =>
      validateReasoningStep(step, `${label}.steps[${index}]`),
    ),
  };
}

export function validateEngineJobEnvelope(
  value: unknown,
  label = 'job',
): EngineJobEnvelope {
  const object = readObject(value, label);
  return {
    jobId: readNonEmptyString(object.jobId, `${label}.jobId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    type: readNonEmptyString(object.type, `${label}.type`),
    existentialContext: validateExistentialContext(
      object.existentialContext,
      `${label}.existentialContext`,
    ),
  };
}

export function validateOsToLuchiiMessage(
  value: unknown,
  label = 'OsToLuchiiMessage',
): OsToLuchiiMessage {
  const object = readObject(value, label);
  return {
    requestId: readNonEmptyString(object.requestId, `${label}.requestId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    prompt: readNonEmptyString(object.prompt, `${label}.prompt`),
    existentialContext: validateExistentialContext(
      object.existentialContext,
      `${label}.existentialContext`,
    ),
  };
}

export function validateLuchiiToOsMessage(
  value: unknown,
  label = 'LuchiiToOsMessage',
): LuchiiToOsMessage {
  const object = readObject(value, label);
  return {
    requestId: readNonEmptyString(object.requestId, `${label}.requestId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    content: readNonEmptyString(object.content, `${label}.content`),
    existentialContext: validateExistentialContext(
      object.existentialContext,
      `${label}.existentialContext`,
    ),
    reasoningTrace: validateReasoningTrace(
      object.reasoningTrace,
      `${label}.reasoningTrace`,
    ),
  };
}

export function validateOsToEngineMessage(
  value: unknown,
  label = 'OsToEngineMessage',
): OsToEngineMessage {
  const object = readObject(value, label);
  return {
    requestId: readNonEmptyString(object.requestId, `${label}.requestId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    job: validateEngineJobEnvelope(object.job, `${label}.job`),
    input: readOptionalRecord(object.input, `${label}.input`),
  };
}

export function validateEngineToOsMessage(
  value: unknown,
  label = 'EngineToOsMessage',
): EngineToOsMessage {
  const object = readObject(value, label);
  return {
    requestId: readNonEmptyString(object.requestId, `${label}.requestId`),
    jobId: readNonEmptyString(object.jobId, `${label}.jobId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    status: readEngineStatus(object.status, `${label}.status`),
    output: readOptionalRecord(object.output, `${label}.output`),
    error:
      object.error === undefined
        ? undefined
        : readNonEmptyString(object.error, `${label}.error`),
  };
}

export function validateOsToWgqlMessage(
  value: unknown,
  label = 'OsToWgqlMessage',
): OsToWgqlMessage {
  const object = readObject(value, label);
  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    rawQuery: readNonEmptyString(object.rawQuery, `${label}.rawQuery`),
    variables: readOptionalRecord(object.variables, `${label}.variables`),
  };
}

export function validateWgqlToOsMessage(
  value: unknown,
  label = 'WgqlToOsMessage',
): WgqlToOsMessage {
  const object = readObject(value, label);
  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    data: readObject(object.data, `${label}.data`),
    errors:
      object.errors === undefined
        ? undefined
        : readStringArray(object.errors, `${label}.errors`),
  };
}

export function validateWgqlToLuchiiMessage(
  value: unknown,
  label = 'WgqlToLuchiiMessage',
): WgqlToLuchiiMessage {
  const object = readObject(value, label);
  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    query: readNonEmptyString(object.query, `${label}.query`),
    existentialContext: validateExistentialContext(
      object.existentialContext,
      `${label}.existentialContext`,
    ),
  };
}

export function validateLuchiiToWgqlMessage(
  value: unknown,
  label = 'LuchiiToWgqlMessage',
): LuchiiToWgqlMessage {
  const object = readObject(value, label);
  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    content: readNonEmptyString(object.content, `${label}.content`),
    existentialContext: validateExistentialContext(
      object.existentialContext,
      `${label}.existentialContext`,
    ),
    reasoningTrace: validateReasoningTrace(
      object.reasoningTrace,
      `${label}.reasoningTrace`,
    ),
  };
}

export function validateWgqlToEngineMessage(
  value: unknown,
  label = 'WgqlToEngineMessage',
): WgqlToEngineMessage {
  const object = readObject(value, label);
  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    job: validateEngineJobEnvelope(object.job, `${label}.job`),
    input: readOptionalRecord(object.input, `${label}.input`),
  };
}

export function validateEngineToWgqlMessage(
  value: unknown,
  label = 'EngineToWgqlMessage',
): EngineToWgqlMessage {
  const object = readObject(value, label);
  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    jobId: readNonEmptyString(object.jobId, `${label}.jobId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    status: readEngineStatus(object.status, `${label}.status`),
    output: readOptionalRecord(object.output, `${label}.output`),
    error:
      object.error === undefined
        ? undefined
        : readNonEmptyString(object.error, `${label}.error`),
  };
}

export function validateWgqlToOsGovernanceMessage(
  value: unknown,
  label = 'WgqlToOsGovernanceMessage',
): WgqlToOsGovernanceMessage {
  const object = readObject(value, label);
  if (!Array.isArray(object.reasoningSteps)) {
    throw new Error(`${label}.reasoningSteps must be an array.`);
  }

  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    action: readNonEmptyString(object.action, `${label}.action`),
    tags: readStringArray(object.tags, `${label}.tags`),
    reasoningSteps: object.reasoningSteps.map((step, index) =>
      validateReasoningStep(step, `${label}.reasoningSteps[${index}]`),
    ),
  };
}

export function validateWgqlToOsGovernanceResponse(
  value: unknown,
  label = 'WgqlToOsGovernanceResponse',
): WgqlToOsGovernanceResponse {
  const object = readObject(value, label);
  if (!Array.isArray(object.reasoningSteps)) {
    throw new Error(`${label}.reasoningSteps must be an array.`);
  }

  return {
    queryId: readNonEmptyString(object.queryId, `${label}.queryId`),
    eid: readNonEmptyString(object.eid, `${label}.eid`),
    action: readNonEmptyString(object.action, `${label}.action`),
    decision: readGovernanceDecision(object.decision, `${label}.decision`),
    summary: readNonEmptyString(object.summary, `${label}.summary`),
    tags: readStringArray(object.tags, `${label}.tags`),
    reasoningSteps: object.reasoningSteps.map((step, index) =>
      validateReasoningStep(step, `${label}.reasoningSteps[${index}]`),
    ),
  };
}
