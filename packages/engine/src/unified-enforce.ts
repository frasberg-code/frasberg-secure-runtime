import {
  validateChatRequest,
  type ChatCompletionRequest,
} from '@frasberg/shared';

export interface UnifiedEnforcementContext {
  continuity?: string | string[];
  requestId: string;
  policy: unknown;
}

export function unifiedEnforce(
  engine: unknown,
  owner: string,
  context: UnifiedEnforcementContext,
): ChatCompletionRequest {
  enforceIdentity(engine, owner);
  enforceContinuity(engine, owner, context.continuity);
  enforceDiagnostics(engine, owner, context);
  return enforcePolicy(engine, owner, context.policy);
}

export function enforceIdentity(_engine: unknown, owner: string): void {
  if (!owner.trim()) {
    throw new Error('Owner identity must not be empty.');
  }
}

export function enforceContinuity(
  _engine: unknown,
  _owner: string,
  continuity: string | string[] | undefined,
): void {
  if (continuity === undefined) {
    return;
  }
  if (
    typeof continuity !== 'string' ||
    !continuity.trim() ||
    continuity.length > 256
  ) {
    throw new Error(
      'Continuity identifier must be a non-empty string of at most 256 characters.',
    );
  }
}

export function enforceDiagnostics(
  _engine: unknown,
  _owner: string,
  context: UnifiedEnforcementContext,
): void {
  if (!context.requestId.trim()) {
    throw new Error('Diagnostic request identifier must not be empty.');
  }
}

export function enforcePolicy(
  _engine: unknown,
  _owner: string,
  policy: unknown,
): ChatCompletionRequest {
  return validateChatRequest(policy);
}
