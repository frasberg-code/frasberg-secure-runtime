import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function fetchDiagnostics(owner, component) {
  const { data, error } = await supabase
    .from("diagnostics")
    .select("*")
    .eq("owner_id", owner)
    .eq("component", component);
  
  if (error) throw error;
  return data;
}
