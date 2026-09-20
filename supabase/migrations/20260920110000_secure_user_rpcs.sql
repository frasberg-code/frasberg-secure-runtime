-- Secure RPC surface for the existing Tier 12 schema.
-- This migration intentionally uses owner_id/cost_usd/event_type/payload and UUID
-- world identifiers from the canonical schema. It does not create a duplicate,
-- incompatible user_id/text-world schema or seed fabricated auth.users rows.

create or replace function public.get_user_jobs()
returns setof public.jobs
language sql
security invoker
set search_path = public, auth, pg_temp
as $$
  select j.*
  from public.jobs j
  where j.owner_id = auth.uid()
  order by j.created_at desc;
$$;

create or replace function public.get_job_details(p_job_id uuid)
returns public.jobs
language sql
security invoker
set search_path = public, auth, pg_temp
as $$
  select j.*
  from public.jobs j
  where j.id = p_job_id
    and j.owner_id = auth.uid();
$$;

create or replace function public.log_engine_usage(
  p_engine_name text,
  p_job_id uuid default null,
  p_units numeric default 0,
  p_cost_usd numeric default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns public.engine_usage
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_usage public.engine_usage;
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if nullif(trim(coalesce(p_engine_name, '')), '') is null then
    raise exception 'engine name is required';
  end if;
  if coalesce(p_units, 0) < 0 or coalesce(p_cost_usd, 0) < 0 then
    raise exception 'usage and cost cannot be negative';
  end if;
  if p_job_id is not null and not exists (
    select 1 from public.jobs j
    where j.id = p_job_id and j.owner_id = v_owner_id
  ) then
    raise exception 'job ownership mismatch' using errcode = '42501';
  end if;

  insert into public.engine_usage(owner_id, job_id, engine_name, units, cost_usd, metadata)
  values (v_owner_id, p_job_id, p_engine_name, p_units, p_cost_usd, coalesce(p_metadata, '{}'::jsonb))
  returning * into v_usage;

  insert into public.user_costs(owner_id, total_cost_usd, updated_at)
  values (v_owner_id, p_cost_usd, now())
  on conflict (owner_id) do update
    set total_cost_usd = public.user_costs.total_cost_usd + excluded.total_cost_usd,
        updated_at = now();
  return v_usage;
end;
$$;

create or replace function public.get_user_costs()
returns public.user_costs
language sql
security invoker
set search_path = public, auth, pg_temp
as $$
  select c.* from public.user_costs c where c.owner_id = auth.uid();
$$;

create or replace function public.get_engine_usage(p_engine_name text)
returns setof public.engine_usage
language sql
security invoker
set search_path = public, auth, pg_temp
as $$
  select u.* from public.engine_usage u
  where u.owner_id = auth.uid() and u.engine_name = p_engine_name
  order by u.created_at desc;
$$;

create or replace function public.get_world(p_world_id uuid)
returns public.worlds
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_world public.worlds;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin privileges required' using errcode = '42501';
  end if;
  select w.* into v_world from public.worlds w where w.id = p_world_id;
  return v_world;
end;
$$;

create or replace function public.list_worlds()
returns setof public.worlds
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'admin privileges required' using errcode = '42501';
  end if;
  return query select w.* from public.worlds w order by w.created_at desc;
end;
$$;

create or replace function public.record_continuity_event(
  p_world_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns public.continuity_events
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.continuity_events;
  v_owner_id uuid := auth.uid();
  v_world_owner_id uuid;
begin
  if v_owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select w.owner_id into v_world_owner_id from public.worlds w where w.id = p_world_id;
  if v_world_owner_id is null or (v_world_owner_id <> v_owner_id and not public.current_user_is_admin()) then
    raise exception 'world access denied' using errcode = '42501';
  end if;
  insert into public.continuity_events(owner_id, world_id, event_type, payload)
  values (v_world_owner_id, p_world_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  returning * into v_event;
  return v_event;
end;
$$;

create or replace function public.get_continuity_events(p_world_id uuid)
returns setof public.continuity_events
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not exists (
    select 1 from public.worlds w
    where w.id = p_world_id
      and (w.owner_id = auth.uid() or public.current_user_is_admin())
  ) then
    raise exception 'world access denied' using errcode = '42501';
  end if;
  return query
    select ce.* from public.continuity_events ce
    where ce.world_id = p_world_id
    order by ce.created_at desc;
end;
$$;

create or replace function public.audit(
  p_owner_id uuid,
  p_action text,
  p_target text,
  p_detail jsonb default '{}'::jsonb
)
returns public.audit_log
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_record public.audit_log;
begin
  if auth.uid() is null or (p_owner_id <> auth.uid() and not public.current_user_is_admin()) then
    raise exception 'audit access denied' using errcode = '42501';
  end if;
  insert into public.audit_log(actor_id, owner_id, action, target, detail)
  values (auth.uid(), p_owner_id, p_action, p_target, coalesce(p_detail, '{}'::jsonb))
  returning * into v_record;
  return v_record;
end;
$$;

create or replace function public.get_audit_log()
returns setof public.audit_log
language sql
security invoker
set search_path = public, auth, pg_temp
as $$
  select a.* from public.audit_log a
  where a.owner_id = auth.uid() or public.current_user_is_admin()
  order by a.created_at desc;
$$;

create or replace function public.check_quota(p_route_key text default null)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_cost numeric;
  v_hard_limit numeric;
begin
  if v_owner_id is null then return false; end if;
  select coalesce(c.total_cost_usd, 0), q.hard_limit_usd
    into v_cost, v_hard_limit
  from public.user_quotas q
  left join public.user_costs c on c.owner_id = q.owner_id
  where q.owner_id = v_owner_id;
  return v_hard_limit is null or v_cost <= v_hard_limit;
end;
$$;

create or replace function public.increment_rate_limit(p_route_key text)
returns public.rate_limits
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_limit public.rate_limits;
  v_owner_id uuid := auth.uid();
  v_start timestamptz;
  v_seconds integer := 60;
begin
  if v_owner_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  v_start := to_timestamp(floor(extract(epoch from now()) / v_seconds) * v_seconds);
  insert into public.rate_limits(owner_id, route_key, window_started_at, window_seconds, request_count)
  values (v_owner_id, p_route_key, v_start, v_seconds, 1)
  on conflict (owner_id, route_key, window_started_at, window_seconds)
  do update set request_count = public.rate_limits.request_count + 1, updated_at = now()
  returning * into v_limit;
  return v_limit;
end;
$$;

revoke all on function public.get_user_jobs() from public;
revoke all on function public.get_job_details(uuid) from public;
revoke all on function public.log_engine_usage(text, uuid, numeric, numeric, jsonb) from public;
revoke all on function public.get_user_costs() from public;
revoke all on function public.get_engine_usage(text) from public;
revoke all on function public.get_world(uuid) from public;
revoke all on function public.list_worlds() from public;
revoke all on function public.record_continuity_event(uuid, text, jsonb) from public;
revoke all on function public.get_continuity_events(uuid) from public;
revoke all on function public.audit(uuid, text, text, jsonb) from public;
revoke all on function public.get_audit_log() from public;
revoke all on function public.check_quota(text) from public;
revoke all on function public.increment_rate_limit(text) from public;
grant execute on function public.get_user_jobs() to authenticated;
grant execute on function public.get_job_details(uuid) to authenticated;
grant execute on function public.log_engine_usage(text, uuid, numeric, numeric, jsonb) to authenticated;
grant execute on function public.get_user_costs() to authenticated;
grant execute on function public.get_engine_usage(text) to authenticated;
grant execute on function public.get_world(uuid) to authenticated;
grant execute on function public.list_worlds() to authenticated;
grant execute on function public.record_continuity_event(uuid, text, jsonb) to authenticated;
grant execute on function public.get_continuity_events(uuid) to authenticated;
grant execute on function public.audit(uuid, text, text, jsonb) to authenticated;
grant execute on function public.get_audit_log() to authenticated;
grant execute on function public.check_quota(text) to authenticated;
grant execute on function public.increment_rate_limit(text) to authenticated;
