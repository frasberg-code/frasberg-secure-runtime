export function applyRules(law: any) {
  return {
    consistencyApplied: law.constraints.mustBeConsistent,
    determinismApplied: law.constraints.mustBeDeterministic,
    invariantsApplied: law.constraints.mustRespectInvariants,
    timestamp: Date.now()
  };
}
