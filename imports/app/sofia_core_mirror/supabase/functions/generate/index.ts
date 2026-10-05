import {
  supabaseAdmin,
  authenticate,
  getEntitlements,
  notifyFailure,
  callModel,
  uploadAsset,
} from "../_shared/sofia-edge-functions-template.ts";

console.info('generate function starting');

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const auth = await authenticate(req);
    if ("error" in auth) return new Response(auth.error, { status: auth.status });
    const user = auth.user;

    const entitlements = await getEntitlements(user.id);
    const body = await req.json();
    const kind = (body.kind ?? 'text') as "text" | "image" | "audio";

    const modelEndpoint = Deno.env.get("MODEL_ENDPOINT");
    const modelKey = Deno.env.get("MODEL_API_KEY");
    if (!modelEndpoint || !modelKey) {
      throw new Error("MODEL_ENDPOINT or MODEL_API_KEY is not set");
    }

    const result = await callModel(`${modelEndpoint}/${kind}`, modelKey, {
      prompt: body.prompt,
      options: body.options ?? {},
      user_id: user.id,
      entitlements,
    });

    let assetUrl: string | null = null;
    if (kind !== "text" && result?.asset) {
      const bytes = Array.isArray(result.asset.binary)
        ? Uint8Array.from(result.asset.binary)
        : new Uint8Array(result.asset.binary?.data ?? []);
      const blob = new Blob([bytes], { type: result.asset.type ?? "application/octet-stream" });
      const filename = result.asset.filename ?? `${crypto.randomUUID()}`;
      assetUrl = await uploadAsset(user.id, filename, blob);
    }

    return new Response(
      JSON.stringify({ ok: true, kind, result: result.result ?? result, assetUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate error:", err);
    await notifyFailure("generate", err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
