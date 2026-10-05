export const governance = {
  authority: "Frasberg",
  article: "IV",
  advisoryOnly: true,
  constraints: {
    forbidden: ["/verdicts", "/sentencing", "/adjudicate", "/intent"],
    auditRequired: true,
    humanInTheLoop: true,
  },

  validateEndpoint: (path: string) => {
    const forbidden = governance.constraints.forbidden;
    return !forbidden.some((p) => path.startsWith(p));
  },

  getMetadata: () => ({
    anchorSHA: "09b70b557e3539fba67249e4951e2373dc33f434",
    cycle: 2,
    phase: 17,
    status: "FLIA_ACTIVE",
  }),
};
