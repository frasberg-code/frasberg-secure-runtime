import { logDiagnostics } from "../../packages/worldgraph-engine/diagnostics";

export async function injectDiagnostics(req, res, next) {
  await logDiagnostics(req.owner, "gateway", { path: req.path });
  next();
}
