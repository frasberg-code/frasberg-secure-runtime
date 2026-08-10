import { createSupabaseServer } from "./supabase";

export async function getUsage(userId: string) {
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    return { credits: 0, used: 0 };
  }

  return {
    credits: data.credits ?? 0,
    used: data.used ?? 0,
  };
}
