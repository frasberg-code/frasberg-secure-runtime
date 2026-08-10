import spec from './register_engine_spec.json';

export function enforceRegister(output: string, context: any): boolean {
  const violations = [];

  // Validate register presence
  if (spec.enforcement.validate_register_presence) {
    if (!context.register || !spec.registers.includes(context.register)) {
      violations.push('Invalid or missing register');
    }
  }

  // Validate transitions
  if (spec.enforcement.reject_invalid_transitions && context.previous_register) {
    const transitionKey = `${context.previous_register}_to_${context.register}`;
    const rule = spec.transition_rules[transitionKey];

    if (!rule || rule === 'restricted') {
      violations.push(`Invalid register transition: ${transitionKey}`);
    }
  }

  // Log transitions if enabled
  if (spec.enforcement.log_transition_events && context.previous_register) {
    console.log(`Register transition: ${context.previous_register} → ${context.register}`);
  }

  return violations.length === 0;
}
