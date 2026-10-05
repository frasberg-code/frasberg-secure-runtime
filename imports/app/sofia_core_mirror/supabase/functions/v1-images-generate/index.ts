
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Helper: Authenticate user via Bearer JWT ---
async function authenticate(req: Request) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: "Unauthorized", status: 401 };
  }
  return { user: data.user };
}

// --- Helper: Get entitlements for user ---
async function getEntitlements(userId: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data, error } = await supabase
    .from("ops.entitlements")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Entitlement lookup failed:", error);
    return null;
  }
  return data;
}

// --- Helper: Alert webhook on failure ---
async function notifyFailure(detail: string) {
  const url = Deno.env.get("ALERT_WEBHOOK_URL");
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        detail,
      }),
    });
  } catch (err) {
    console.error("Alert webhook failed:", err);
  }
}

// --- Helper: Model invocation ---
async function callModel(providerUrl: string, apiKey: string, payload: any) {
  const res = await fetch(providerUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Model error: ${res.status} ${text}`);
  }
  return res.json();
}

// --- Helper: Asset upload to Supabase Storage ---
async function uploadAsset(userId: string, filename: string, blob: Blob) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const path = `generated/${userId}/${filename}`;
  const { error } = await supabase.storage
    .from("generated-assets")
    .upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    });
  if (error) throw error;
  const { data } = supabase.storage
    .from("generated-assets")
    .getPublicUrl(path);
  return data.publicUrl;
}

console.info('images/generate function starting');

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const auth = await authenticate(req);
    if ("error" in auth) return new Response(auth.error, { status: auth.status });
    const user = auth.user;

    const entitlements = await getEntitlements(user.id);
    const body = await req.json();

    const modelEndpoint = Deno.env.get("MODEL_ENDPOINT");
    const modelKey = Deno.env.get("MODEL_API_KEY");
    if (!modelEndpoint || !modelKey) {
      throw new Error("MODEL_ENDPOINT or MODEL_API_KEY is not set");
    }

    const result = await callModel(`${modelEndpoint}/image`, modelKey, {
      prompt: body.prompt,
      options: body.options ?? {},
      user_id: user.id,
      entitlements,
    });

    let assetUrl: string | null = null;
    if (result?.asset) {
      const bytes = Array.isArray(result.asset.binary)
        ? Uint8Array.from(result.asset.binary)
        : new Uint8Array(result.asset.binary?.data ?? []);
      const blob = new Blob([bytes], { type: result.asset.type ?? "application/octet-stream" });
      const filename = result.asset.filename ?? `${crypto.randomUUID()}`;
      assetUrl = await uploadAsset(user.id, filename, blob);
    }

    return new Response(
      JSON.stringify({ ok: true, result: result.result ?? result, assetUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("images/generate error:", err);
    await notifyFailure("images/generate", err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
