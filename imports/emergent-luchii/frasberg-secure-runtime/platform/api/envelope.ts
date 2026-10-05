export function apiEnvelope({ owner, continuity, diagnostics, policy, payload }) {
  return {
    version: "v1",
    owner,
    continuity,
    diagnostics,
    policy,
    payload,
    timestamp: Date.now()
  };
}
