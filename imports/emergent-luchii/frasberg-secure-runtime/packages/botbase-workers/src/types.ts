export interface WorkerEnv {
  BOTBASE_SHARED_TOKEN?: string;
  BOTBASE_SIGNING_SECRET?: string;
  BOTBASE_INFRA_IP_CIDRS?: string;
}

export interface TenantRequest {
  tenantId: string;
  body?: unknown;
}
