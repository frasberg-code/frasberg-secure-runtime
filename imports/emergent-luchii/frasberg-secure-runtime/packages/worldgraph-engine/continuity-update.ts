import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function updateContinuity(owner, newState) {
  const { error } = await supabase.rpc("continuity_update", {
    owner,
    new_state: newState
  });
  if (error) throw error;
}
