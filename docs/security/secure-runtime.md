# Secure runtime scaffold notes

## Important limits

This repository is a scaffold. It demonstrates local buildable services and safe worker patterns, but it does **not** claim that production Cloudflare, Kubernetes, registry, WAF, or signing infrastructure has been deployed or verified.

## Required external secrets

Provide secrets at runtime only:

- `FRASBERG_API_KEYS_JSON` for gateway API key definitions
- `FRASBERG_MUSIC_KEY`, `FRASBERG_VIDEO_KEY`, `FRASBERG_STT_KEY`, `FRASBERG_TTS_KEY`, `FRASBERG_AUDIO_KEY` for Frasberg domain routing
- `BOTBASE_SHARED_TOKEN` for authenticated worker access
- `BOTBASE_SIGNING_SECRET` for signature workers
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`, `GITHUB_WEBHOOK_SECRET` for OAuth/webhooks
- Any future upstream provider secrets (for example OpenAI-compatible credentials) through deployment-specific secret stores

Do not commit those values, and do not place signing secrets in Wrangler vars. Use `wrangler secret put`, Render/Kubernetes secret management, or an equivalent secret manager.

## Corrected WAF logic

Access should be denied unless **all** required conditions are satisfied. Example conditions include:

- valid authentication presented
- required permission granted
- expected tenant identifier present
- request size and route policy within limits

A partial match is not sufficient; the default posture is deny.

## Production replacement points

- Replace the in-memory engine repository with durable queue/storage
- Replace placeholder generation responses with verified upstream providers
- Replace scaffold worker responses with audited implementations and fine-grained authz
- Use `packages/full-game-stack-schema` validators at runtime boundaries when storing or transporting world/app/site definitions
- Use the persistent `packages/worldgraph-engine` service with authenticated Supabase RPC calls for WorldGraph storage; do not bypass RLS with direct table access from application code
- For Supabase RLS admin access, write trusted roles into `public.user_profiles.role` from server-side provisioning flows (or a validated access-token hook) before granting admin capabilities
- Route alert outbox events (`public.alert_outbox`) to Supabase Database Webhooks/Edge Functions or `pg_net` workers in deployment infrastructure
- Add real deployment secrets through GitHub environments, Kubernetes secrets, or Cloudflare secret storage
- Replace placeholder failover URLs in `manifests/multi-region-failover.template.json` with infrastructure-managed values

## WorldGraph persistence

- `supabase/migrations/20260919130000_phase1_worldgraph_persistence.sql` adds `public.worldgraph_definitions`, owner-scoped RLS, and SECURITY DEFINER RPCs for create/get/update/delete/list operations.
- `apps/gateway-server` uses the existing JWT verification and trusted role lookup pattern for HTTP authentication, while Supabase row ownership is enforced by the authenticated bearer token presented to the RPC layer.
- Run `supabase/tests/worldgraph.sql` alongside the existing SQL checks in a Supabase/Postgres environment to verify the RPCs and policies are present.
