import { propagateIdentity } from "./identity";
import { propagateContinuity } from "./continuity";
import { propagateDiagnostics } from "./diagnostics";
import { propagatePolicy } from "./policy";

export const unifiedRouterMiddleware = [
  propagateIdentity,
  propagateContinuity,
  propagateDiagnostics,
  propagatePolicy
];
