export const routeMap = {
  "/api/cases": {
    target: process.env.CASE_URL || "http://localhost:3001",
    pathRewrite: { "^/api/cases": "" },
  },
  "/api/evidence": {
    target: process.env.EVIDENCE_URL || "http://localhost:3002",
    pathRewrite: { "^/api/evidence": "" },
  },
  "/api/law": {
    target: process.env.LAW_URL || "http://localhost:3003",
    pathRewrite: { "^/api/law": "" },
  },
  "/api/integrity": {
    target: process.env.INTEGRITY_URL || "http://localhost:3004",
    pathRewrite: { "^/api/integrity": "" },
  },
  "/api/audit": {
    target: process.env.AUDIT_URL || "http://localhost:3005",
    pathRewrite: { "^/api/audit": "" },
  },
  "/api/users": {
    target: process.env.USER_URL || "http://localhost:3006",
    pathRewrite: { "^/api/users": "" },
  },
};
