import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function logDiagnostics(owner, component, payload) {
  const { error } = await supabase.rpc("diagnostics_log", {
    owner,
    component,
    payload
  });
  if (error) throw error;
}
