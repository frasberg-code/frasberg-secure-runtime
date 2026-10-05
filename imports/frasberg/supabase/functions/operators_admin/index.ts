import { createClient } from "npm:@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Diagnostics: capture token and env
  const authz = req.headers.get("authorization") ?? "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  const envKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;
  const envUrl = Deno.env.get("SUPABASE_URL") ?? null;

  if (path.endsWith("/diagnostics")) {
    return new Response(
      JSON.stringify({
        receivedToken: token,
        envServiceRoleKey: envKey,
        envSupabaseUrl: envUrl,
        tokenMatchesEnv: token === envKey,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    envUrl!,
    envKey!,
    { auth: { persistSession: false } }
  );

  if (path.endsWith("/list")) {
    const { data, error } = await supabase.from("some_admin_view").select("*").limit(100);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ data }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
