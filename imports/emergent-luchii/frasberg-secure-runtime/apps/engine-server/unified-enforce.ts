import { enforceIdentity } from "./identity-enforce";
import { enforceContinuity } from "./continuity-enforce";
import { enforceDiagnostics } from "./diagnostics-enforce";
import { enforcePolicy } from "./policy-enforce";

export function unifiedEnforce(engine, owner, context) {
  enforceIdentity(engine, owner);
  enforceContinuity(engine, owner, context.continuity);
  enforceDiagnostics(engine, owner, context);
  enforcePolicy(engine, owner, context.policy);
}
