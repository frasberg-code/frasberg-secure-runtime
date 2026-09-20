# Schema and runtime audit

The authoritative runtime contract is implemented by `supabase/migrations/20260920130000_runtime_contract_reconciliation.sql`.

## Required schema

- `worldgraph_definitions`: UUID `id`, `owner_id`, `kind`, `schema_version`, and JSONB `definition`.
- `generation_jobs`: `owner_id`, `domain`, `engine_name`, `state`, JSONB request/response payloads, and `cost_usd numeric(10,2)`.
- `continuity_events`: `owner_id`, UUID `world_id`, and JSONB `continuity`.

## Required runtime boundaries

- Gateway validates JWT `sub`, `iss`, `aud`, and `exp`.
- Gateway obtains roles from a server-side role store.
- Engine accepts jobs only from the Gateway.
- Engine persists jobs using the authoritative `generation_jobs` fields.
- WorldGraph persists UUID-backed definitions through authenticated RPCs.
- WorldGraph and generation jobs are owner-scoped through RLS.
- Materialized views are refreshed only through `monitor.refresh_materialized_views()`.

This repository creates no seed users, credentials, JWT secrets, service-role keys, or engine secrets.

## Follow-up migration work

The existing monitoring migration still contains legacy references to `continuity_events.payload` and `public.worlds`, as well as direct materialized-view refresh statements. Those references must be migrated to the canonical tables and routed through `monitor.refresh_materialized_views()` before production deployment.
