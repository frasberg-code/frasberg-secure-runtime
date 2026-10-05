import { fetchDiagnostics } from "./diagnostics-fetch";

export async function aggregateDiagnostics(owner) {
  const components = ["gateway", "router", "engine"];
  const diagnostics = {};

  for (const component of components) {
    diagnostics[component] = await fetchDiagnostics(owner, component);
  }

  return diagnostics;
}
