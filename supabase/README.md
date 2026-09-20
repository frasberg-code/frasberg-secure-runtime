# Supabase migration validation

The monitoring migration is `supabase/migrations/20260920100000_monitoring_cron_and_views.sql`.

It is designed for the existing Tier 12 schema and uses `world_state`/`payload` JSONB for optional existential fields. The migration:

- creates compatible daily and hourly monitoring materialized views;
- adds guarded `admin` procedures for maintenance operations;
- refreshes views through a trusted system-only procedure;
- installs the requested pg_cron jobs idempotently when `pg_cron` is enabled;
- skips cron installation with a notice when the extension is unavailable.

To validate locally:

```bash
supabase db reset
supabase test db
```

`pg_cron` must be enabled in the target Supabase project before cron rows can be installed. The migration can still be applied without it; call `call admin.install_monitoring_cron_jobs();` after enabling the extension.
