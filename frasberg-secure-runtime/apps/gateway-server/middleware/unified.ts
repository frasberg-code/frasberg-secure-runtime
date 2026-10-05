import { injectIdentity } from "./identity";
import { injectContinuity } from "./continuity";
import { injectDiagnostics } from "./diagnostics";
import { injectPolicy } from "./policy";
import { governanceGuard } from "./governance-guard";

export const unifiedMiddleware = [
  injectIdentity,
  injectContinuity,
  injectDiagnostics,
  injectPolicy,
  governanceGuard
];
