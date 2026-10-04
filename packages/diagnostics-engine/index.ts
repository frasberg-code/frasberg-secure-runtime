import { supabase } from "../worldgraph-engine/supabase-client";

export async function loadDiagnostics(owner) {
  const { data } = await supabase.rpc("diagnostics_events_get", { owner });
  return data;
}

export async function writeDiagnostics(owner, event) {
  await supabase.rpc("diagnostics_event_insert", {
    owner,
    event
  });
}
