-- Operational monitoring views and guarded pg_cron jobs.
-- This migration is compatible with the preceding Tier 12 monitoring migration.
-- It retains monitor.refresh_materialized_views() as a function because that
-- object already exists as a function in the preceding migration.

create schema if not exists admin;
create schema if not exists monitor;

create or replace procedure admin.recompute_engine_health()
language plpgsql
security definer
set search_path = public, monitor, admin, pg_temp
as $$
begin
  perform public.require_system_execution('admin.recompute_engine_health');
  refresh materialized view monitor.engine_health;
end;
$$;

create or replace procedure admin.recompute_user_costs()
language plpgsql
security definer
set search_path = public, monitor, admin, pg_temp
as $$
begin
  perform public.require_system_execution('admin.recompute_user_costs');
  perform public.admin_recompute_user_costs();
end;
$$;

create or replace procedure admin.purge_old_jobs(p_retention_days integer default 30)
language plpgsql
security definer
set search_path = public, monitor, admin, pg_temp
as $$
begin
  perform public.require_system_execution('admin.purge_old_jobs');
  perform public.validate_retention_days('jobs', p_retention_days);
  delete from public.jobs
   where created_at < now() - make_interval(days => p_retention_days);
end;
$$;

create or replace procedure admin.purge_audit_logs(p_retention_days integer default 90)
language plpgsql
security definer
set search_path = public, monitor, admin, pg_temp
as $$
begin
  perform public.require_system_execution('admin.purge_audit_logs');
  perform public.validate_retention_days('audit log', p_retention_days);
  delete from public.audit_log
   where created_at < now() - make_interval(days => p_retention_days);
end;
$$;

create or replace procedure admin.reset_rate_limits()
language plpgsql
security definer
set search_path = public, monitor, admin, pg_temp
as $$
begin
  perform public.require_system_execution('admin.reset_rate_limits');
  delete from public.rate_limits
   where window_started_at + make_interval(secs => window_seconds) <= now();
end;
$$;

create or replace procedure admin.recompute_world_risk()
language plpgsql
security definer
set search_path = public, monitor, admin, pg_temp
as $$
begin
  perform public.require_system_execution('admin.recompute_world_risk');
  refresh materialized view monitor.world_risk;
end;
$$;

drop materialized view if exists monitor.engine_usage_daily;
create materialized view monitor.engine_usage_daily as
select
  owner_id,
  engine_name as engine,
  date_trunc('day', created_at) as day,
  count(*)::integer as total_jobs,
  coalesce(sum(units), 0)::numeric(18,4) as total_units,
  coalesce(sum(cost_usd), 0)::numeric(18,6) as total_cost,
  coalesce(avg(cost_usd), 0)::numeric(18,6) as avg_cost
from public.engine_usage
group by owner_id, engine_name, date_trunc('day', created_at)
with no data;
create unique index monitor_engine_usage_daily_key
  on monitor.engine_usage_daily(owner_id, engine, day);

drop materialized view if exists monitor.user_costs_daily;
create materialized view monitor.user_costs_daily as
select
  owner_id,
  date_trunc('day', created_at) as day,
  coalesce(sum(cost_usd), 0)::numeric(18,6) as total_cost,
  count(*)::integer as jobs
from public.engine_usage
group by owner_id, date_trunc('day', created_at)
with no data;
create unique index monitor_user_costs_daily_key
  on monitor.user_costs_daily(owner_id, day);

drop materialized view if exists monitor.system_load_hourly;
create materialized view monitor.system_load_hourly as
select
  date_trunc('hour', j.created_at) as hour,
  count(distinct j.id)::integer as jobs,
  coalesce(sum(eu.cost_usd), 0)::numeric(18,6) as total_cost
from public.jobs j
left join public.engine_usage eu on eu.job_id = j.id
group by date_trunc('hour', j.created_at)
with no data;
create unique index monitor_system_load_hourly_key
  on monitor.system_load_hourly(hour);

drop materialized view if exists monitor.high_risk_worlds_cached;
create materialized view monitor.high_risk_worlds_cached as
select
  w.id,
  coalesce(w.world_state ->> 'label', w.cluster_id) as label,
  coalesce((w.world_state ->> 'risk_profile')::numeric, 0)::numeric(6,4) as risk_profile,
  coalesce((w.world_state ->> 'meaning_score')::numeric, 0)::numeric(6,4) as meaning_score,
  w.world_state ->> 'continuity_arc' as continuity_arc,
  coalesce(w.world_state -> 'tags', '[]'::jsonb) as tags,
  w.created_at
from public.worlds w
where coalesce((w.world_state ->> 'risk_profile')::numeric, 0) > 0.7
with no data;
create unique index monitor_high_risk_worlds_cached_key
  on monitor.high_risk_worlds_cached(id);
create index monitor_high_risk_worlds_cached_risk_idx
  on monitor.high_risk_worlds_cached(risk_profile);

drop materialized view if exists monitor.continuity_events_recent;
create materialized view monitor.continuity_events_recent as
select
  ce.world_id,
  ce.payload ->> 'from_arc' as from_arc,
  ce.payload ->> 'to_arc' as to_arc,
  nullif(ce.payload ->> 'meaning_score', '')::numeric as meaning_score,
  nullif(ce.payload ->> 'risk_profile', '')::numeric as risk_profile,
  ce.created_at
from public.continuity_events ce
where ce.created_at > now() - interval '7 days'
with no data;
create unique index monitor_continuity_events_recent_key
  on monitor.continuity_events_recent(world_id, created_at);

-- Preserve the function signature established by the prior migration.
create or replace function monitor.refresh_materialized_views()
returns table(view_name text, refreshed_at timestamptz)
language plpgsql
security definer
set search_path = monitor, public, admin, pg_temp
as $$
declare
  v_refreshed_at timestamptz := now();
begin
  perform public.require_system_execution('monitor.refresh_materialized_views');
  refresh materialized view monitor.engine_health;
  refresh materialized view monitor.world_risk;
  refresh materialized view monitor.engine_usage_daily;
  refresh materialized view monitor.user_costs_daily;
  refresh materialized view monitor.system_load_hourly;
  refresh materialized view monitor.high_risk_worlds_cached;
  refresh materialized view monitor.continuity_events_recent;
  return query
  values
    ('monitor.engine_health', v_refreshed_at),
    ('monitor.world_risk', v_refreshed_at),
    ('monitor.engine_usage_daily', v_refreshed_at),
    ('monitor.user_costs_daily', v_refreshed_at),
    ('monitor.system_load_hourly', v_refreshed_at),
    ('monitor.high_risk_worlds_cached', v_refreshed_at),
    ('monitor.continuity_events_recent', v_refreshed_at);
end;
$$;

create or replace procedure admin.install_monitoring_cron_jobs()
language plpgsql
security definer
set search_path = public, monitor, admin, pg_temp
as $$
declare
  v_job record;
begin
  perform public.require_system_execution('admin.install_monitoring_cron_jobs');
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron is not enabled; monitoring jobs were not installed';
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('admin.monitoring-cron-jobs', 0));
  for v_job in
    select jobid from cron.job where jobname in (
      'recompute-engine-health-every-5m', 'recompute-user-costs-hourly',
      'purge-old-jobs-daily', 'purge-audit-logs-weekly', 'reset-rate-limits-minutely',
      'recompute-world-risk-every-10m', 'refresh-materialized-views-every-10m'
    )
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  perform cron.schedule('recompute-engine-health-every-5m', '*/5 * * * *', 'call admin.recompute_engine_health();');
  perform cron.schedule('recompute-user-costs-hourly', '0 * * * *', 'call admin.recompute_user_costs();');
  perform cron.schedule('purge-old-jobs-daily', '15 3 * * *', 'call admin.purge_old_jobs(30);');
  perform cron.schedule('purge-audit-logs-weekly', '0 4 * * 0', 'call admin.purge_audit_logs(90);');
  perform cron.schedule('reset-rate-limits-minutely', '* * * * *', 'call admin.reset_rate_limits();');
  perform cron.schedule('recompute-world-risk-every-10m', '*/10 * * * *', 'call admin.recompute_world_risk();');
  perform cron.schedule('refresh-materialized-views-every-10m', '*/10 * * * *', 'select * from monitor.refresh_materialized_views();');
end;
$$;

revoke all on schema admin from public, anon, authenticated;
grant usage on schema admin to postgres, service_role;
revoke all on schema monitor from public, anon, authenticated;
grant usage on schema monitor to postgres, service_role;
revoke all on function monitor.refresh_materialized_views() from public;
revoke execute on function monitor.refresh_materialized_views() from anon, authenticated;
grant execute on function monitor.refresh_materialized_views() to service_role;
revoke all on procedure admin.install_monitoring_cron_jobs() from public;
grant execute on procedure admin.install_monitoring_cron_jobs() to service_role;

refresh materialized view monitor.engine_usage_daily;
refresh materialized view monitor.user_costs_daily;
refresh materialized view monitor.system_load_hourly;
refresh materialized view monitor.high_risk_worlds_cached;
refresh materialized view monitor.continuity_events_recent;

call admin.install_monitoring_cron_jobs();
