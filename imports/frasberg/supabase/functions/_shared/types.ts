// Shared types for Supabase Edge Functions

export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface Entitlements {
  user_id: string;
  tier: "free" | "pro" | "enterprise";
  quota_daily: number;
  quota_monthly: number;
  feature_flags: Record<string, boolean | string | number>;
  created_at?: string;
  updated_at?: string;
}

export interface GenerateRequest {
  type: "chat" | "image" | "video";
  prompt: string;
  options?: Record<string, any>;
}

export interface GenerateResponse {
  user_id: string;
  type: string;
  output?: string;
  asset_url?: string;
  error?: string;
}

export interface ModelResponse {
  text?: string;
  binary?: Uint8Array;
  asset?: {
    filename?: string;
    type?: string;
    binary: Uint8Array;
  };
  result?: any;
}
