import spec from './membrane_engine_spec.json';

export function enforceMembrane(output: string, context: any): boolean {
  const violations = [];

  const { pressure, symmetry } = context.membrane || {};
  const { pressure_min, pressure_max, symmetry_min, symmetry_max } = spec.membrane;

  // Validate pressure
  if (spec.enforcement.validate_pressure) {
    if (pressure === undefined || pressure < pressure_min || pressure > pressure_max) {
      violations.push('Membrane pressure out of bounds');
    }
  }

  // Validate symmetry
  if (spec.enforcement.validate_symmetry) {
    if (symmetry === undefined || symmetry < symmetry_min || symmetry > symmetry_max) {
      violations.push('Membrane symmetry out of bounds');
    }
  }

  // Log membrane events
  if (spec.enforcement.log_membrane_events) {
    console.log(`Membrane check → pressure: ${pressure}, symmetry: ${symmetry}`);
  }

  return violations.length === 0;
}
