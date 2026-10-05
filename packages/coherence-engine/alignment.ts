export function buildAlignment(integrity: any) {
  return {
    validationAligned: integrity.validation,
    healthAligned: integrity.health,
    timestamp: Date.now()
  };
}
