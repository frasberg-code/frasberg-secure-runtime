import { supabase } from "../worldgraph-engine/supabase-client";

export async function loadGovernance(owner: string) {
  const { data } = await supabase.rpc("governance_get", { owner });
  return data;
}

export function enforceGovernance(governance, action) {
  if (!governance) return { allowed: true };

  if (governance.globalBlock?.includes(action)) {
    return { allowed: false, reason: "Globally blocked by governance" };
  }

  if (governance.ownerBlock?.includes(action)) {
    return { allowed: false, reason: "Owner-level governance block" };
  }

  return { allowed: true };
}

export function checkGovernance(governance, action) {
  return enforceGovernance(governance, action);
}
