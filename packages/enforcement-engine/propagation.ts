export function propagateConstraints(rules: any) {
  return {
    consistencyPropagation: rules.consistencyApplied,
    determinismPropagation: rules.determinismApplied,
    invariantPropagation: rules.invariantsApplied,
    checksum: Math.random().toString(36).slice(2)
  };
}
