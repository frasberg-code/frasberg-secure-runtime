import { verifyGovernanceKey } from "../load-governance-key";

export function governanceGuard(req, res, next) {
  if (!verifyGovernanceKey(req)) {
    return res.status(403).json({ error: "Forbidden: governance-admin key required" });
  }
  next();
}
