import type { ChatCompletionRequest } from '@frasberg/shared';
import {
  enforceIdentity,
  type UnifiedEnforcementContext,
} from '../../packages/engine/src/unified-enforce';
import { enforceContinuity } from './continuity-enforce';
import { enforceDiagnostics } from './diagnostics-enforce';
import { enforcePolicy } from './policy-enforce';

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
