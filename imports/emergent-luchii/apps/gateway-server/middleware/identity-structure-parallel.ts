// OPTION 1 — PARALLEL FLOW (chosen by MR).
// The existing pattern/structure pipeline stays primary and untouched.
// These engines run as a parallel enrichment chain BEFORE the existing
// identity middleware; x-owner-id enforcement remains authoritative.
import { injectBehavior } from "./behavior";
import { injectPattern } from "./pattern";
import { injectStructure } from "./structure";

export const injectIdentityStructureParallel = [
  injectBehavior,
  injectPattern,
  injectStructure
];

// Wiring (inside the checkout gateway):
//   app.use(injectIdentityStructureParallel);   // NEW PARALLEL FLOW
//   app.use(existingIdentityMiddleware);         // x-owner-id enforcement
//   app.use(existingPatternStructurePipeline);   // existing runtime behavior
