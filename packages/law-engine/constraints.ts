export function buildConstraints() {
  return {
    mustBeConsistent: true,
    mustBeDeterministic: true,
    mustRespectInvariants: true,
    timestamp: Date.now()
  };
}
