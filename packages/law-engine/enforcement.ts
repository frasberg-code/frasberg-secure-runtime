export function buildEnforcement(constraints: any) {
  return {
    consistencyCheck: constraints.mustBeConsistent,
    determinismCheck: constraints.mustBeDeterministic,
    invariantCheck: constraints.mustRespectInvariants,
    checksum: Math.random().toString(36).slice(2)
  };
}
