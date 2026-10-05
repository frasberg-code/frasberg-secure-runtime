import { supabase } from "../worldgraph-engine/supabase-client";

export async function loadPolicy(owner: string) {
  const { data } = await supabase.rpc("policy_get", { owner });
  return data;
}

export function enforcePolicy(policy, action) {
  if (!policy) return { allowed: true };

  if (policy.blockedActions?.includes(action)) {
    return {
      allowed: false,
      reason: "Action blocked by policy"
    };
  }

  return { allowed: true };
}

export function checkPolicy(policy, action) {
  return enforcePolicy(policy, action);
}
