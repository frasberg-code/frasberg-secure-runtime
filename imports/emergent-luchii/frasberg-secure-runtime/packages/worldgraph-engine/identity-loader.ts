import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function loadIdentity(owner) {
  const { data, error } = await supabase.rpc("identity_graph_get", { owner });
  if (error) throw error;
  return data;
}
