# Secure RPCs and schema compatibility

The repository’s canonical Supabase schema uses `owner_id`, UUID world IDs, `engine_name`, `cost_usd`, and JSONB continuity payloads. The secure RPC migration therefore adapts the requested legacy API names to the actual schema instead of creating duplicate `user_id`/text-ID tables.

Added in `supabase/migrations/20260920110000_secure_user_rpcs.sql`:

- owner-scoped job, cost, and engine-usage RPCs;
- admin-only world listing and lookup;
- owner/admin continuity-event access;
- owner/admin audit access;
- cost-based quota checking;
- bucketed rate-limit increments;
- explicit authenticated grants and public revocation.

Do not seed UUIDs into `auth.users` unless those users were created by Supabase Auth. Do not put service-role keys, JWT secrets, database passwords, webhook URLs, or engine credentials in migrations or SQL seed files. The backend service-role client may bypass RLS, so application code must pass authenticated ownership explicitly and must not expose that client to browsers.

The legacy snippets using `user_id`, `actor`, `metadata`, `world_id text`, or `monitor.refresh_materialized_views()` as a procedure are not directly deployable against this repository’s current schema; use the canonical RPC signatures above.
