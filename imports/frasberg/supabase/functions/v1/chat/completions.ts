import {
  authenticate,
  getEntitlements,
  callModel,
  notifyFailure
} from "../../_shared/frasberg-edge-functions-template.ts";

console.info('chat/completions function starting');

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

    const result = await callModel(`${modelEndpoint}/text`, modelKey, {
      prompt: body.prompt,
      options: body.options ?? {},
      user_id: user.id,
      entitlements,
    });

    return new Response(
      JSON.stringify({ ok: true, result: result.result ?? result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("chat/completions error:", err);
    await notifyFailure("chat/completions", err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
