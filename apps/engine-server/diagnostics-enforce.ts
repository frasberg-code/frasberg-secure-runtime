import { logDiagnostics } from "../../packages/worldgraph-engine/diagnostics";

export async function enforceDiagnostics(engine, owner, context) {
  await logDiagnostics(owner, "engine", context);
}
