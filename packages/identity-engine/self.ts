export function buildSelf(awareness: any) {
  return {
    awarenessSelf: awareness.perception,
    fieldSelf: awareness.field,
    timestamp: Date.now()
  };
}
