// Authentication utilities for Supabase Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

export interface AuthError {
  error: string;
  status: number;
}

/**
 * Validate user from Authorization header
 */
export async function validateUser(req: Request): Promise<AuthResult | AuthError> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return { error: "Server configuration error", status: 500 };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return { error: "Missing authorization token", status: 401 };
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: "Unauthorized", status: 401 };
  }

  return { user: data.user };
}

/**
 * Get user entitlements from database
 */
export async function getUserEntitlements(userId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase configuration missing");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("ops.entitlements")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Return default entitlements if none exist
    return {
      tier: "free",
      quota_daily: 50,
      quota_monthly: 500,
      feature_flags: {},
    };
  }

  return data;
}
