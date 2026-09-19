-- Tier 12 follow-up admin maintenance and monitoring objects.
-- Safety notes:
-- * Admin maintenance functions explicitly allow either an interactive admin
--   (user_profiles.role = 'admin') or a cron/system execution role without JWT
--   context. This keeps pg_cron invocations distinct from authenticated user
--   activity while still blocking non-admin users.
-- * When cron/system work needs an actor identifier, use NULL actor_id plus
--   detail metadata such as {"actor_type":"system","invocation_role":"postgres"}
--   rather than fabricated auth.users UUIDs.
-- * pg_cron scheduling is best-effort and idempotent: the extension must already
--   be enabled in Supabase (dashboard/database extension enablement) before job
--   rows can be created, and redeploys unschedule matching names before adding
--   fresh definitions.
-- * Monitoring materialized views live in the monitor schema. The refresh helper
--   uses non-concurrent refresh because migrations and simple cron calls can run
--   it safely inside normal transactions; unique indexes are still created so a
--   future move to REFRESH ... CONCURRENTLY remains possible if lock tradeoffs
--   change with higher data volume.

create schema if not exists monitor;

alter table public.audit_log
  alter column actor_id drop not null;

comment on column public.audit_log.actor_id is
  'Interactive actions store auth.uid(); cron/system maintenance may store NULL and annotate detail.actor_type = ''system'' plus detail.invocation_role.';

create or replace function public.current_execution_is_system()
returns boolean
language sql
stable
set search_path = public, auth, pg_temp
as $$
  select auth.uid() is null
    and coalesce(nullif(current_setting('role', true), 'none'), current_user) in ('postgres', 'service_role', 'supabase_admin');
$$;

create or replace function public.require_admin_or_system(p_operation text default 'admin operation')
returns void
language plpgsql
security definer
stable
set search_path = public, auth, pg_temp
as $$
begin
  if public.current_execution_is_system() then
    return;
  end if;

  if auth.uid() is not null and public.current_user_is_admin() then
    return;
  end if;

  raise exception 'admin privileges required for %', coalesce(p_operation, 'this operation')
    using errcode = '42501';
end;
$$;

create or replace function public.validate_retention_days(
  p_label text,
  p_days integer,
  p_minimum_days integer default 7
)
returns integer
language plpgsql
immutable
set search_path = public, pg_temp
as $$
begin
  if coalesce(p_days, -1) < p_minimum_days then
    raise exception '% retention must be at least % days', p_label, p_minimum_days;
  end if;

  return p_days;
end;
$$;

create or replace function public.admin_reset_monthly_quotas(p_owner_id uuid default null)
returns table(affected_count integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_affected_count integer := 0;
begin
  perform public.require_admin_or_system('admin_reset_monthly_quotas');

  update public.user_costs
     set total_cost_usd = 0,
         updated_at = now()
   where (p_owner_id is null or owner_id = p_owner_id)
     and total_cost_usd <> 0;

  get diagnostics v_affected_count = row_count;

  return query select v_affected_count;
end;
$$;

create or replace function public.admin_preview_resource_cleanup(
  p_rate_limit_retention_days integer default 30,
  p_delivered_alert_retention_days integer default 30
)
returns table(
  rate_limits_to_delete integer,
  delivered_alerts_to_delete integer
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_rate_limit_retention_days integer;
  v_delivered_alert_retention_days integer;
begin
  perform public.require_admin_or_system('admin_preview_resource_cleanup');

  v_rate_limit_retention_days := public.validate_retention_days('rate limit', p_rate_limit_retention_days);
  v_delivered_alert_retention_days := public.validate_retention_days('delivered alert', p_delivered_alert_retention_days);

  return query
  select
    (
      select count(*)::integer
      from public.rate_limits rl
      where rl.updated_at < now() - make_interval(days => v_rate_limit_retention_days)
    ) as rate_limits_to_delete,
    (
      select count(*)::integer
      from public.alert_outbox ao
      where ao.delivered_at is not null
        and ao.delivered_at < now() - make_interval(days => v_delivered_alert_retention_days)
    ) as delivered_alerts_to_delete;
end;
$$;

create or replace function public.admin_cleanup_resources(
  p_rate_limit_retention_days integer default 30,
  p_delivered_alert_retention_days integer default 30,
  p_confirm_apply boolean default false
)
returns table(
  deleted_rate_limits integer,
  deleted_delivered_alerts integer
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_rate_limit_retention_days integer;
  v_delivered_alert_retention_days integer;
  v_deleted_rate_limits integer := 0;
  v_deleted_delivered_alerts integer := 0;
begin
  perform public.require_admin_or_system('admin_cleanup_resources');

  if not coalesce(p_confirm_apply, false) then
    raise exception 'confirmation required: call admin_preview_resource_cleanup() and rerun with p_confirm_apply = true';
  end if;

  v_rate_limit_retention_days := public.validate_retention_days('rate limit', p_rate_limit_retention_days);
  v_delivered_alert_retention_days := public.validate_retention_days('delivered alert', p_delivered_alert_retention_days);

  delete from public.rate_limits rl
  where rl.updated_at < now() - make_interval(days => v_rate_limit_retention_days);

  get diagnostics v_deleted_rate_limits = row_count;

  delete from public.alert_outbox ao
  where ao.delivered_at is not null
    and ao.delivered_at < now() - make_interval(days => v_delivered_alert_retention_days);

  get diagnostics v_deleted_delivered_alerts = row_count;

  return query select v_deleted_rate_limits, v_deleted_delivered_alerts;
end;
$$;

create or replace function public.admin_recompute_user_costs(p_owner_id uuid default null)
returns table(recomputed_count integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_recomputed_count integer := 0;
begin
  perform public.require_admin_or_system('admin_recompute_user_costs');

  with target_owners as (
    select eu.owner_id
    from public.engine_usage eu
    where p_owner_id is null or eu.owner_id = p_owner_id
    union
    select uc.owner_id
    from public.user_costs uc
    where p_owner_id is null or uc.owner_id = p_owner_id
    union
    select p_owner_id
    where p_owner_id is not null
  ),
  aggregated as (
    select
      towner.owner_id,
      coalesce(sum(eu.cost_usd), 0)::numeric(18,6) as total_cost_usd
    from target_owners towner
    left join public.engine_usage eu on eu.owner_id = towner.owner_id
    group by towner.owner_id
  ),
  upserted as (
    insert into public.user_costs(owner_id, total_cost_usd, updated_at)
    select a.owner_id, a.total_cost_usd, now()
    from aggregated a
    on conflict (owner_id)
    do update set
      total_cost_usd = excluded.total_cost_usd,
      updated_at = now()
    returning owner_id
  )
  select count(*)::integer
    into v_recomputed_count
  from upserted;

  return query select v_recomputed_count;
end;
$$;

create or replace function public.admin_upsert_engine_registry(
  p_owner_id uuid,
  p_engine_name text,
  p_backend_url text,
  p_is_enabled boolean default true,
  p_metadata_patch jsonb default '{}'::jsonb
)
returns public.engine_registry
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_registry public.engine_registry;
begin
  perform public.require_admin_or_system('admin_upsert_engine_registry');

  if nullif(trim(coalesce(p_engine_name, '')), '') is null then
    raise exception 'engine_name is required';
  end if;

  if nullif(trim(coalesce(p_backend_url, '')), '') is null then
    raise exception 'backend_url is required';
  end if;

  insert into public.engine_registry(owner_id, engine_name, backend_url, is_enabled, metadata)
  values (
    p_owner_id,
    p_engine_name,
    p_backend_url,
    coalesce(p_is_enabled, true),
    coalesce(p_metadata_patch, '{}'::jsonb)
  )
  on conflict (owner_id, engine_name)
  do update set
    backend_url = excluded.backend_url,
    is_enabled = excluded.is_enabled,
    metadata = public.engine_registry.metadata || excluded.metadata,
    updated_at = now()
  returning * into v_registry;

  return v_registry;
end;
$$;

create materialized view if not exists monitor.engine_health as
with usage_rollup as (
  select
    eu.owner_id,
    eu.engine_name,
    count(*)::integer as usage_events,
    coalesce(sum(eu.units), 0)::numeric(18,4) as total_units,
    coalesce(sum(eu.cost_usd), 0)::numeric(18,6) as total_cost_usd,
    max(eu.created_at) as last_used_at
  from public.engine_usage eu
  group by eu.owner_id, eu.engine_name
)
select
  coalesce(er.owner_id, ur.owner_id) as owner_id,
  coalesce(er.engine_name, ur.engine_name) as engine_name,
  er.backend_url,
  coalesce(er.is_enabled, false) as is_enabled,
  coalesce(ur.usage_events, 0)::integer as usage_events,
  coalesce(ur.total_units, 0)::numeric(18,4) as total_units,
  coalesce(ur.total_cost_usd, 0)::numeric(18,6) as total_cost_usd,
  ur.last_used_at,
  case
    when coalesce(ur.usage_events, 0) = 0 then 'no-usage'
    when er.owner_id is null then 'unregistered'
    when coalesce(er.is_enabled, false) then 'active'
    else 'disabled'
  end as health_status,
  now() as refreshed_at
from public.engine_registry er
full outer join usage_rollup ur
  on ur.owner_id = er.owner_id
 and ur.engine_name = er.engine_name;

create unique index if not exists monitor_engine_health_owner_engine_idx
  on monitor.engine_health(owner_id, engine_name);
create index if not exists monitor_engine_health_status_idx
  on monitor.engine_health(health_status, owner_id);

comment on materialized view monitor.engine_health is
  'Operational engine health rollup. Zero-usage engines remain visible with health_status = ''no-usage'' to avoid NULL-only monitoring rows.';

do $$
declare
  v_definition text;
begin
  select lower(m.definition)
    into v_definition
  from pg_matviews m
  where m.schemaname = 'monitor'
    and m.matviewname = 'engine_health';

  if v_definition is null then
    raise exception 'monitor.engine_health must exist after this migration';
  end if;

  if position('usage_rollup' in v_definition) = 0
     or position('no-usage' in v_definition) = 0
     or position('full outer join' in v_definition) = 0 then
    raise exception 'monitor.engine_health exists with an unexpected definition; rebuild it manually before re-running this migration';
  end if;
end;
$$;

create materialized view if not exists monitor.world_risk as
with event_rollup as (
  select
    ce.world_id,
    count(*)::integer as event_count,
    count(*) filter (
      where ce.event_type in ('rollback', 'breach', 'drift', 'failure', 'incident')
    )::integer as risk_event_count,
    max(ce.created_at) as last_event_at
  from public.continuity_events ce
  group by ce.world_id
)
select
  w.id as world_id,
  w.owner_id,
  w.cluster_id,
  coalesce(er.event_count, 0)::integer as event_count,
  coalesce(er.risk_event_count, 0)::integer as risk_event_count,
  er.last_event_at,
  case
    when coalesce(er.event_count, 0) = 0 then 0::numeric(6,4)
    else round((coalesce(er.risk_event_count, 0)::numeric / nullif(er.event_count, 0)::numeric), 4)
  end as risk_score,
  case
    when coalesce(er.event_count, 0) = 0 then 'stable'
    when coalesce(er.risk_event_count, 0) = 0 then 'stable'
    when (coalesce(er.risk_event_count, 0)::numeric / nullif(er.event_count, 0)::numeric) >= 0.5000 then 'high'
    else 'elevated'
  end as risk_level,
  now() as refreshed_at
from public.worlds w
left join event_rollup er on er.world_id = w.id;

create unique index if not exists monitor_world_risk_world_idx
  on monitor.world_risk(world_id);
create index if not exists monitor_world_risk_level_idx
  on monitor.world_risk(risk_level, owner_id);

comment on materialized view monitor.world_risk is
  'World continuity risk snapshot. Worlds with zero events refresh to risk_score = 0 and risk_level = ''stable'' instead of surfacing NULL risk math.';

do $$
declare
  v_definition text;
begin
  select lower(m.definition)
    into v_definition
  from pg_matviews m
  where m.schemaname = 'monitor'
    and m.matviewname = 'world_risk';

  if v_definition is null then
    raise exception 'monitor.world_risk must exist after this migration';
  end if;

  if position('risk_event_count' in v_definition) = 0
     or position('incident' in v_definition) = 0
     or position('stable' in v_definition) = 0 then
    raise exception 'monitor.world_risk exists with an unexpected definition; rebuild it manually before re-running this migration';
  end if;
end;
$$;

create or replace function monitor.refresh_materialized_views()
returns table(view_name text, refreshed_at timestamptz)
language plpgsql
security definer
set search_path = monitor, public, auth, pg_temp
as $$
declare
  v_refreshed_at timestamptz := now();
begin
  perform public.require_admin_or_system('monitor.refresh_materialized_views');

  refresh materialized view monitor.engine_health;
  refresh materialized view monitor.world_risk;

  return query
  values
    ('monitor.engine_health', v_refreshed_at),
    ('monitor.world_risk', v_refreshed_at);
end;
$$;

create or replace function public.ensure_cron_job(
  p_job_name text,
  p_schedule text,
  p_command text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job record;
begin
  if not exists (
    select 1
    from pg_extension
    where extname = 'pg_cron'
  ) then
    return;
  end if;

  for v_job in
    select j.jobid
    from cron.job j
    where j.jobname = p_job_name
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  perform cron.schedule(p_job_name, p_schedule, p_command);
end;
$$;

create or replace function public.ensure_maintenance_cron_jobs()
returns table(job_name text, schedule text, command text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.require_admin_or_system('ensure_maintenance_cron_jobs');

  if not exists (
    select 1
    from pg_extension
    where extname = 'pg_cron'
  ) then
    raise notice 'pg_cron extension is not enabled; enable it in Supabase before maintenance jobs can be scheduled';
    return;
  end if;

  perform public.ensure_cron_job(
    'admin-maintenance-monthly-quota-reset',
    '0 0 1 * *',
    'select * from public.admin_reset_monthly_quotas();'
  );
  perform public.ensure_cron_job(
    'admin-maintenance-nightly-cleanup',
    '15 3 * * *',
    'select * from public.admin_cleanup_resources(30, 30, true);'
  );
  perform public.ensure_cron_job(
    'admin-maintenance-nightly-recompute-user-costs',
    '30 3 * * *',
    'select * from public.admin_recompute_user_costs();'
  );
  perform public.ensure_cron_job(
    'monitor-refresh-materialized-views',
    '0 * * * *',
    'select * from monitor.refresh_materialized_views();'
  );

  return query
  select j.jobname, j.schedule, j.command
  from cron.job j
  where j.jobname in (
    'admin-maintenance-monthly-quota-reset',
    'admin-maintenance-nightly-cleanup',
    'admin-maintenance-nightly-recompute-user-costs',
    'monitor-refresh-materialized-views'
  )
  order by j.jobname;
end;
$$;

grant usage on schema monitor to authenticated;
revoke all on function public.current_execution_is_system() from public;
revoke execute on function public.current_execution_is_system() from anon;
grant execute on function public.current_execution_is_system() to authenticated;
revoke all on function public.require_admin_or_system(text) from public;
revoke execute on function public.require_admin_or_system(text) from anon;
grant execute on function public.require_admin_or_system(text) to authenticated;
revoke all on function public.validate_retention_days(text, integer, integer) from public;
revoke execute on function public.validate_retention_days(text, integer, integer) from anon;
revoke all on function public.admin_reset_monthly_quotas(uuid) from public;
revoke execute on function public.admin_reset_monthly_quotas(uuid) from anon;
grant execute on function public.admin_reset_monthly_quotas(uuid) to authenticated;
revoke all on function public.admin_preview_resource_cleanup(integer, integer) from public;
revoke execute on function public.admin_preview_resource_cleanup(integer, integer) from anon;
grant execute on function public.admin_preview_resource_cleanup(integer, integer) to authenticated;
revoke all on function public.admin_cleanup_resources(integer, integer, boolean) from public;
revoke execute on function public.admin_cleanup_resources(integer, integer, boolean) from anon;
grant execute on function public.admin_cleanup_resources(integer, integer, boolean) to authenticated;
revoke all on function public.admin_recompute_user_costs(uuid) from public;
revoke execute on function public.admin_recompute_user_costs(uuid) from anon;
grant execute on function public.admin_recompute_user_costs(uuid) to authenticated;
revoke all on function public.admin_upsert_engine_registry(uuid, text, text, boolean, jsonb) from public;
revoke execute on function public.admin_upsert_engine_registry(uuid, text, text, boolean, jsonb) from anon;
grant execute on function public.admin_upsert_engine_registry(uuid, text, text, boolean, jsonb) to authenticated;
revoke all on function monitor.refresh_materialized_views() from public;
revoke execute on function monitor.refresh_materialized_views() from anon;
grant execute on function monitor.refresh_materialized_views() to authenticated;
revoke all on function public.ensure_cron_job(text, text, text) from public;
revoke execute on function public.ensure_cron_job(text, text, text) from anon, authenticated;
revoke all on function public.ensure_maintenance_cron_jobs() from public;
revoke execute on function public.ensure_maintenance_cron_jobs() from anon, authenticated;
grant execute on function public.ensure_maintenance_cron_jobs() to service_role;

comment on function public.current_execution_is_system() is
  'Returns true only when no JWT subject is present and the active database role is a trusted system role such as postgres or service_role; authenticated requests are therefore not reclassified as cron/system work.';
comment on function public.require_admin_or_system(text) is
  'Shared guard for admin-only maintenance routines. Interactive calls require user_profiles.role = admin; cron/system calls must run without auth.uid() under a trusted DB role.';
comment on function public.admin_cleanup_resources(integer, integer, boolean) is
  'Deletes only bounded stale rows after an explicit preview/confirmation flow. Retention arguments are validated with a minimum seven-day safety floor.';
comment on function public.ensure_maintenance_cron_jobs() is
  'Best-effort pg_cron scheduler for service/system use only. Enable the pg_cron extension in Supabase before invoking; re-running this helper unschedules matching names first so job names stay idempotent across redeploys.';
comment on function monitor.refresh_materialized_views() is
  'Refreshes monitoring materialized views with standard (non-concurrent) refreshes. Unique indexes support a future move to concurrent refreshes, but non-concurrent refresh keeps migration-time and cron execution behavior predictable.';
