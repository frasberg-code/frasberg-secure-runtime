# Authoritative runtime schema

The current contract is now represented by migration `20260920120000_authoritative_runtime_schema.sql`.

- `worldgraph_definitions` uses UUID `id`, `owner_id`, `kind`, and JSONB `definition`.
- `generation_jobs` is the authoritative generation-job table with `engine_name`, `state`, JSONB payloads, and `cost_usd`.
- `continuity_events` has a required JSONB `continuity` payload. Legacy `event_type` and `payload` columns remain temporarily for compatibility with earlier monitoring migrations.
- Materialized views continue to refresh through the existing `monitor.refresh_materialized_views()` function.

No seed users, default worlds, credentials, JWT secrets, service-role keys, or engine secrets are added.

Validate with:

```bash
supabase db reset
supabase test db
npm run build
npm run test
```
