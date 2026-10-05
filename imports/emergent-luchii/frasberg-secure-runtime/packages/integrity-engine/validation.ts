export function buildValidation(enforcement: any) {
  return {
    rulesValidated: enforcement.appliedRules,
    propagationValidated: enforcement.propagation,
    timestamp: Date.now()
  };
}
