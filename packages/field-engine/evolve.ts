export function evolveField(field: any) {
  return {
    fieldId: field.fieldId,
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  };
}
