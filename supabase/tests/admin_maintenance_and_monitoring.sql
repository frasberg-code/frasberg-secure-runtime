-- Run after applying migrations in a local Supabase/Postgres environment.
-- This validates admin-only maintenance guards, cron idempotency, zero-data
-- monitoring behavior, and refresh correctness.

begin;

create temp table test_ctx (
  admin_id uuid not null,
  member_id uuid not null,
  world_id uuid not null,
  cleanup_rate_limit_id uuid not null,
  fresh_rate_limit_id uuid not null,
  stale_alert_id uuid not null,
  fresh_alert_id uuid not null,
  engine_name text not null
) on commit drop;

insert into test_ctx
select
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  gen_random_uuid(),
  'engine-zero';

insert into auth.users (
  id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  email_confirmed_at,
  created_at,
  updated_at
)
select
  admin_id,
  'authenticated',
  'authenticated',
  'admin-' || admin_id::text || '@example.test',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  now()
from test_ctx
union all
select
  member_id,
  'authenticated',
  'authenticated',
  'member-' || member_id::text || '@example.test',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  now()
from test_ctx;

insert into public.user_profiles(user_id, role, display_name)
select admin_id, 'admin', 'Admin Test User'
from test_ctx
union all
select member_id, 'user', 'Member Test User'
from test_ctx;

insert into public.user_costs(owner_id, total_cost_usd, updated_at)
select member_id, 14.500000, now() - interval '10 days'
from test_ctx;

insert into public.worlds(id, owner_id, cluster_id, world_state)
select world_id, member_id, 'cluster-zero', '{"stage":"test"}'::jsonb
from test_ctx;

insert into public.engine_registry(owner_id, engine_name, backend_url, is_enabled, metadata)
select member_id, engine_name, 'https://runtime.example.internal/' || engine_name, true, '{"seeded_by":"sql_test"}'::jsonb
from test_ctx;

insert into public.rate_limits(id, owner_id, route_key, window_started_at, window_seconds, request_count, updated_at)
select cleanup_rate_limit_id, member_id, '/api/music', now() - interval '40 days', 60, 3, now() - interval '40 days'
from test_ctx
union all
select fresh_rate_limit_id, member_id, '/api/music', now() - interval '1 day', 60, 1, now() - interval '1 day'
from test_ctx;

insert into public.alert_outbox(id, owner_id, event_type, payload, created_at, delivered_at)
select stale_alert_id, member_id, 'quota-warning', '{"kind":"stale"}'::jsonb, now() - interval '45 days', now() - interval '40 days'
from test_ctx
union all
select fresh_alert_id, member_id, 'quota-warning', '{"kind":"fresh"}'::jsonb, now() - interval '2 days', now() - interval '1 day'
from test_ctx;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select member_id::text from test_ctx), true);

do $$
begin
  perform monitor.refresh_materialized_views();
  raise exception 'non-admin user must not execute monitor.refresh_materialized_views';
exception
  when insufficient_privilege then
    null;
  when others then
    if position('permission denied' in sqlerrm) = 0
       and position('system role required' in sqlerrm) = 0 then
      raise;
    end if;
end;
$$;

do $$
begin
  perform public.admin_reset_monthly_quotas((select member_id from test_ctx));
  raise exception 'non-admin user must not execute admin_reset_monthly_quotas';
exception
  when insufficient_privilege then
    null;
  when others then
    if position('admin privileges required' in sqlerrm) = 0 then
      raise;
    end if;
end;
$$;

select set_config('request.jwt.claim.sub', (select admin_id::text from test_ctx), true);

do $$
declare
  v_rate_limits_to_delete integer;
  v_delivered_alerts_to_delete integer;
  v_affected_count integer;
  v_deleted_rate_limits integer;
  v_deleted_delivered_alerts integer;
  v_registry_backend_url text;
  v_registry_enabled boolean;
  v_registry_metadata jsonb;
begin
  select p.rate_limits_to_delete, p.delivered_alerts_to_delete
    into v_rate_limits_to_delete, v_delivered_alerts_to_delete
  from public.admin_preview_resource_cleanup(30, 30) p;

  if v_rate_limits_to_delete <> 1 or v_delivered_alerts_to_delete <> 1 then
    raise exception 'unexpected cleanup preview counts';
  end if;

  begin
    perform public.admin_preview_resource_cleanup(6, 30);
    raise exception 'retention validation must reject values below seven days';
  exception
    when others then
      if position('at least 7 days' in sqlerrm) = 0 then
        raise;
      end if;
  end;

  select r.affected_count
    into v_affected_count
  from public.admin_reset_monthly_quotas((select member_id from test_ctx)) r;

  if v_affected_count <> 1 then
    raise exception 'quota reset should affect one row';
  end if;

  select c.deleted_rate_limits, c.deleted_delivered_alerts
    into v_deleted_rate_limits, v_deleted_delivered_alerts
  from public.admin_cleanup_resources(30, 30, true) c;

  if v_deleted_rate_limits <> 1 or v_deleted_delivered_alerts <> 1 then
    raise exception 'cleanup should delete exactly the stale rows';
  end if;

  perform public.admin_upsert_engine_registry(
    (select member_id from test_ctx),
    'engine-upsert',
    'https://runtime.example.internal/engine-upsert',
    true,
    '{"phase":"insert"}'::jsonb
  );

  perform public.admin_upsert_engine_registry(
    (select member_id from test_ctx),
    'engine-upsert',
    'https://runtime.example.internal/engine-upsert-v2',
    false,
    '{"phase":"update","updated_by":"sql_test"}'::jsonb
  );

  select er.backend_url, er.is_enabled, er.metadata
    into v_registry_backend_url, v_registry_enabled, v_registry_metadata
  from public.engine_registry er
  join test_ctx ctx on ctx.member_id = er.owner_id
  where er.engine_name = 'engine-upsert';

  if v_registry_backend_url <> 'https://runtime.example.internal/engine-upsert-v2'
     or v_registry_enabled is not false
     or coalesce(v_registry_metadata ->> 'phase', '') <> 'update'
     or coalesce(v_registry_metadata ->> 'updated_by', '') <> 'sql_test' then
    raise exception 'admin_upsert_engine_registry should cover insert and conflict-update paths';
  end if;
end;
$$;

select * from public.admin_recompute_user_costs((select member_id from test_ctx));
select * from monitor.refresh_materialized_views();

do $$
begin
  perform public.ensure_maintenance_cron_jobs();
  raise exception 'authenticated admin must not execute ensure_maintenance_cron_jobs';
exception
  when insufficient_privilege then
    null;
  when others then
    if position('permission denied' in sqlerrm) = 0
       and position('system role required' in sqlerrm) = 0 then
      raise;
    end if;
end;
$$;

reset role;

do $$
declare
  v_usage_events integer;
  v_health_status text;
  v_event_count integer;
  v_risk_score numeric;
  v_risk_level text;
  v_last_event_at timestamptz;
begin
  select eh.usage_events, eh.health_status
    into v_usage_events, v_health_status
  from monitor.engine_health eh
  join test_ctx ctx
    on ctx.member_id = eh.owner_id
   and ctx.engine_name = eh.engine_name;

  if v_usage_events <> 0 or v_health_status <> 'no-usage' then
    raise exception 'zero-usage engine health should be no-usage with zero events';
  end if;

  select wr.event_count, wr.risk_score, wr.risk_level, wr.last_event_at
    into v_event_count, v_risk_score, v_risk_level, v_last_event_at
  from monitor.world_risk wr
  join test_ctx ctx on ctx.world_id = wr.world_id;

  if v_event_count <> 0 or v_risk_score <> 0 or v_risk_level <> 'stable' or v_last_event_at is not null then
    raise exception 'zero-event world risk should refresh to score 0, stable, and null last_event_at';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select admin_id::text from test_ctx), true);

insert into public.engine_usage(owner_id, engine_name, units, cost_usd, metadata)
select member_id, engine_name, 5.0000, 2.500000, '{"source":"sql_test"}'::jsonb
from test_ctx;

insert into public.continuity_events(owner_id, world_id, event_type, payload)
select member_id, world_id, 'incident', '{"severity":"high"}'::jsonb
from test_ctx;

select * from public.admin_recompute_user_costs((select member_id from test_ctx));

reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select * from monitor.refresh_materialized_views();

reset role;

do $$
declare
  v_total_cost numeric;
  v_usage_events integer;
  v_total_units numeric;
  v_total_cost_usd numeric;
  v_event_count integer;
  v_risk_score numeric;
begin
  select uc.total_cost_usd
    into v_total_cost
  from public.user_costs uc
  join test_ctx ctx on ctx.member_id = uc.owner_id;

  if v_total_cost <> 2.500000 then
    raise exception 'recomputed user_costs should equal inserted engine usage cost';
  end if;

  select eh.usage_events, eh.total_units, eh.total_cost_usd
    into v_usage_events, v_total_units, v_total_cost_usd
  from monitor.engine_health eh
  join test_ctx ctx
    on ctx.member_id = eh.owner_id
   and ctx.engine_name = eh.engine_name;

  if v_usage_events <> 1 or v_total_units <> 5.0000 or v_total_cost_usd <> 2.500000 then
    raise exception 'engine_health refresh did not pick up new usage rows';
  end if;

  select wr.event_count, wr.risk_score
    into v_event_count, v_risk_score
  from monitor.world_risk wr
  join test_ctx ctx on ctx.world_id = wr.world_id;

  if v_event_count <> 1 or v_risk_score <= 0 then
    raise exception 'world_risk refresh did not pick up new continuity events';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', (select admin_id::text from test_ctx), true);

do $$
begin
  perform public.ensure_maintenance_cron_jobs();
  raise exception 'authenticated admin must not execute ensure_maintenance_cron_jobs';
exception
  when insufficient_privilege then
    null;
  when others then
    if position('permission denied' in sqlerrm) = 0
       and position('system role required' in sqlerrm) = 0 then
      raise;
    end if;
end;
$$;

reset role;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);

select * from public.ensure_maintenance_cron_jobs();
select * from public.ensure_maintenance_cron_jobs();

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (
      select 1
      from cron.job j
      where j.jobname in (
        'admin-maintenance-monthly-quota-reset',
        'admin-maintenance-nightly-cleanup',
        'admin-maintenance-nightly-recompute-user-costs',
        'monitor-refresh-materialized-views'
      )
      group by j.jobname
      having count(*) <> 1
    ) then
      raise exception 'pg_cron job names must remain idempotent across repeated ensure_maintenance_cron_jobs() calls';
    end if;
  end if;
end;
$$;

rollback;
