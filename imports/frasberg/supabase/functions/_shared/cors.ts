// CORS Headers for Supabase Edge Functions

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(): Response {
  return new Response("ok", { headers: corsHeaders });
}
