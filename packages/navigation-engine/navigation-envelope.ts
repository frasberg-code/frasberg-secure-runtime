import { Navigation } from "./navigation-model";

export function buildNavigationEnvelope(navigation: Navigation) {
  return {
    navigationId: navigation.navigationId,
    decision: navigation.decision,
    travel: navigation.travel,
    navigationGraph: navigation.navigationGraph,
    timestamp: Date.now()
  };
}
