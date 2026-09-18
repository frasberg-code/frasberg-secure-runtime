export interface WorkerEnv {
  BOTBASE_SHARED_TOKEN?: string;
  BOTBASE_SIGNING_SECRET?: string;
}

export interface TenantRequest {
  tenantId: string;
  body?: unknown;
}
