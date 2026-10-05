export function assertCycle2Allowed(path: string) {
  const forbidden = [/^\/verdicts\b/, /^\/sentencing\b/, /^\/intent\b/];
  if (forbidden.some((r) => r.test(path))) {
    const err = new Error(
      "Autonomous adjudication is forbidden under Cycle 2."
    );
    (err as any).status = 403;
    throw err;
  }
}

export function validateAdvisoryOnly(analysisType: string): boolean {
  const forbidden = ["verdict", "sentencing", "guilt", "innocence"];
  return !forbidden.some((term) =>
    analysisType.toLowerCase().includes(term)
  );
}

export const cycle2Config = {
  authority: "Frasberg",
  article: "IV",
  anchorSHA: "09b70b557e3539fba67249e4951e2373dc33f434",
  phase: 17,
  status: "FLIA_ACTIVE",
  advisoryOnly: true,
  requiresHumanOversight: true,
};
