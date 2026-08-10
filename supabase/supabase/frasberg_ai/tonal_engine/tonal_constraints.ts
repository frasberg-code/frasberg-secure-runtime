export function validateConstraints(output: string, constraints: any): string[] {
  const violations = [];

  if (constraints.non_mimetic_identity) {
    if (output.toLowerCase().includes("i am you") ||
        output.toLowerCase().includes("i am the user") ||
        output.toLowerCase().includes("i am human")) {
      violations.push("Mimetic identity violation");
    }
  }

  if (constraints.deviation_control) {
    const deviation = measureDeviation(output);
    if (deviation > constraints.deviation_control.max_deviation) {
      violations.push("Deviation threshold exceeded");
    }
  }

  return violations;
}

function measureDeviation(output: string): number {
  return Math.min(1, output.length / 500);
}
