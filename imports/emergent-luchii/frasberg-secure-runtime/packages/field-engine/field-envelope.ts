import { Field } from "./field-model";

export function buildFieldEnvelope(field: Field) {
  return {
    fieldId: field.fieldId,
    influence: field.influence,
    topology: field.topology,
    fieldGraph: field.fieldGraph,
    timestamp: Date.now()
  };
}
