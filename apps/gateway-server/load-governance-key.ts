export const GOVERNANCE_ADMIN_KEY = process.env.GOVERNANCE_ADMIN_KEY;

export function verifyGovernanceKey(req) {
  const key = req.headers["x-governance-key"];
  if (!key || key !== GOVERNANCE_ADMIN_KEY) {
    return false;
  }
  return true;
}
