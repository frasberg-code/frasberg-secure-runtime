import { logDiagnostics } from "../../packages/worldgraph-engine/diagnostics";

export async function propagateDiagnostics(req, res, next) {
  await logDiagnostics(req.owner, "router", { path: req.path });
  next();
}
