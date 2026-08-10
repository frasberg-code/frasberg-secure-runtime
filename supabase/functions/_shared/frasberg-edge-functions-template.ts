// Frasberg Edge Functions Template
// Shared logic for authentication, entitlements, model calls, asset upload, and error notification

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateUser, getUserEntitlements } from "./auth.ts";
import { uploadAssetFromBlob } from "./storage.ts";
import { logAndAlert } from "./alerts.ts";

// Initialize Supabase client
export const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

export async function authenticate(req: Request) {
  return await validateUser(req);
}

export async function getEntitlements(userId: string) {
  return await getUserEntitlements(userId);
}

export async function callModel(endpoint: string, apiKey: string, payload: any) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Model API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function uploadAsset(userId: string, filename: string, blob: Blob) {
  return await uploadAssetFromBlob(userId, filename, blob);
}

export async function notifyFailure(functionName: string, error: string) {
  await logAndAlert(functionName, error);
}
