import { createSupabaseServer } from "./supabase";

export async function getSession() {
  const supabase = createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}
