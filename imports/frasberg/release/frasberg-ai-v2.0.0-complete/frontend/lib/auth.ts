import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  const cookieStore = cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${cookieStore.get("sb-access-token")?.value || ""}`,
        },
      },
    }
  );
}
