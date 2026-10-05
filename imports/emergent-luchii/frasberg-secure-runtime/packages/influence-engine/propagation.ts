export function buildPropagation(field: any) {
  return {
    fieldPropagation: field.influence,
    topologyPropagation: field.topology,
    timestamp: Date.now()
  };
}
