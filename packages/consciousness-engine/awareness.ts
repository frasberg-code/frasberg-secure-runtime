export function buildAwareness(mind: any) {
  return {
    mindAwareness: mind.mindspace,
    fieldAwareness: mind.field,
    timestamp: Date.now()
  };
}
