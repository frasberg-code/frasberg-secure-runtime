-- Tier 12 secure runtime schema and RPCs
-- Admin access relies on user_profiles.role lookups (security definer),
-- not on untrusted JWT role claims.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  asset_type text not null check (asset_type in ('music', 'video', 'image', 'voice', 'stt', 'tts')),
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  engine_name text not null,
  state text not null check (state in ('queued', 'running', 'completed', 'failed')),
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engine_usage (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  engine_name text not null,
  units numeric(18,4) not null check (units >= 0),
  cost_usd numeric(18,6) not null check (cost_usd >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_costs (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  total_cost_usd numeric(18,6) not null default 0 check (total_cost_usd >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  cluster_id text not null,
  world_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, cluster_id)
);

create table if not exists public.continuity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.engine_registry (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  engine_name text not null,
  backend_url text not null,
  is_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, engine_name)
);

create table if not exists public.user_quotas (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  monthly_budget_usd numeric(18,6) not null check (monthly_budget_usd >= 0),
  soft_limit_usd numeric(18,6) not null check (soft_limit_usd >= 0),
  hard_limit_usd numeric(18,6) not null check (hard_limit_usd >= 0),
  updated_at timestamptz not null default now(),
  check (soft_limit_usd <= hard_limit_usd),
  check (monthly_budget_usd <= hard_limit_usd)
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  route_key text not null,
  window_started_at timestamptz not null,
  window_seconds integer not null check (window_seconds > 0),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  unique (owner_id, route_key, window_started_at, window_seconds)
);

-- Outbox table for alerting. Connect this to Supabase Database Webhooks / Edge
-- Functions or pg_net-based workers in deployment infrastructure.
create table if not exists public.alert_outbox (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
before update on public.jobs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_worlds_updated_at on public.worlds;
create trigger set_worlds_updated_at
before update on public.worlds
for each row execute procedure public.set_updated_at();

drop trigger if exists set_engine_registry_updated_at on public.engine_registry;
create trigger set_engine_registry_updated_at
before update on public.engine_registry
for each row execute procedure public.set_updated_at();

drop trigger if exists set_user_quotas_updated_at on public.user_quotas;
create trigger set_user_quotas_updated_at
before update on public.user_quotas
for each row execute procedure public.set_updated_at();

drop trigger if exists set_rate_limits_updated_at on public.rate_limits;
create trigger set_rate_limits_updated_at
before update on public.rate_limits
for each row execute procedure public.set_updated_at();

create or replace function public.current_user_is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public, auth, pg_temp
as $$
begin
  return exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  );
end;
$$;

grant execute on function public.current_user_is_admin() to authenticated;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'projects',
    'assets',
    'jobs',
    'engine_usage',
    'user_costs',
    'worlds',
    'continuity_events',
    'engine_registry',
    'user_quotas',
    'rate_limits',
    'alert_outbox'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);

    policy_name := format('%s_owner_read', table_name);
    execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    execute format(
      'create policy %I on public.%I for select using (owner_id = auth.uid() or public.current_user_is_admin())',
      policy_name,
      table_name
    );

    policy_name := format('%s_owner_write', table_name);
    execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    execute format(
      'create policy %I on public.%I for all using (owner_id = auth.uid() or public.current_user_is_admin()) with check (owner_id = auth.uid() or public.current_user_is_admin())',
      policy_name,
      table_name
    );
  end loop;
end;
$$;

alter table public.user_profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

drop policy if exists user_profiles_self_or_admin_select on public.user_profiles;
create policy user_profiles_self_or_admin_select
on public.user_profiles
for select
using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists user_profiles_self_or_admin_write on public.user_profiles;
create policy user_profiles_self_or_admin_write
on public.user_profiles
for all
using (user_id = auth.uid() or public.current_user_is_admin())
with check (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists audit_log_owner_or_admin_select on public.audit_log;
create policy audit_log_owner_or_admin_select
on public.audit_log
for select
using (owner_id = auth.uid() or public.current_user_is_admin());

drop policy if exists audit_log_actor_insert on public.audit_log;
create policy audit_log_actor_insert
on public.audit_log
for insert
with check (
  actor_id = auth.uid()
  and (owner_id = auth.uid() or public.current_user_is_admin())
);

create or replace function public.rpc_list_jobs(p_limit integer default 50)
returns setof public.jobs
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select *
  from public.jobs
  where owner_id = auth.uid() or public.current_user_is_admin()
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 500));
$$;

grant execute on function public.rpc_list_jobs(integer) to authenticated;

create or replace function public.rpc_get_job_detail(p_job_id uuid)
returns public.jobs
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select j.*
  from public.jobs j
  where j.id = p_job_id
    and (j.owner_id = auth.uid() or public.current_user_is_admin());
$$;

grant execute on function public.rpc_get_job_detail(uuid) to authenticated;

create or replace function public.rpc_log_engine_usage_and_increment_cost(
  p_owner_id uuid,
  p_job_id uuid,
  p_engine_name text,
  p_units numeric,
  p_cost_usd numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns public.engine_usage
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_usage public.engine_usage;
begin
  if p_owner_id <> auth.uid() and not public.current_user_is_admin() then
    raise exception 'forbidden';
  end if;

  if p_job_id is not null and not exists (
    select 1
    from public.jobs j
    where j.id = p_job_id
      and j.owner_id = p_owner_id
  ) then
    raise exception 'job ownership mismatch';
  end if;

  insert into public.engine_usage(owner_id, job_id, engine_name, units, cost_usd, metadata)
  values (p_owner_id, p_job_id, p_engine_name, greatest(p_units, 0), greatest(p_cost_usd, 0), coalesce(p_metadata, '{}'::jsonb))
  returning * into v_usage;

  insert into public.user_costs(owner_id, total_cost_usd, updated_at)
  values (p_owner_id, greatest(p_cost_usd, 0), now())
  on conflict (owner_id)
  do update set
    total_cost_usd = public.user_costs.total_cost_usd + excluded.total_cost_usd,
    updated_at = now();

  return v_usage;
end;
$$;

grant execute on function public.rpc_log_engine_usage_and_increment_cost(uuid, uuid, text, numeric, numeric, jsonb) to authenticated;

create or replace function public.rpc_cost_summary(p_owner_id uuid)
returns table(owner_id uuid, total_cost_usd numeric)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select uc.owner_id, uc.total_cost_usd
  from public.user_costs uc
  where uc.owner_id = p_owner_id
    and (uc.owner_id = auth.uid() or public.current_user_is_admin());
$$;

grant execute on function public.rpc_cost_summary(uuid) to authenticated;

create or replace function public.rpc_get_worlds_admin()
returns setof public.worlds
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select w.*
  from public.worlds w
  where public.current_user_is_admin()
  order by w.updated_at desc;
$$;

grant execute on function public.rpc_get_worlds_admin() to authenticated;

create or replace function public.rpc_record_continuity_event(
  p_owner_id uuid,
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
begin
  if p_owner_id <> auth.uid() and not public.current_user_is_admin() then
    raise exception 'forbidden';
  end if;

  if not exists (
    select 1
    from public.worlds w
    where w.id = p_world_id
      and w.owner_id = p_owner_id
  ) then
    raise exception 'world ownership mismatch';
  end if;

  insert into public.continuity_events(owner_id, world_id, event_type, payload)
  values (p_owner_id, p_world_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  returning * into v_event;

  return v_event;
end;
$$;

grant execute on function public.rpc_record_continuity_event(uuid, uuid, text, jsonb) to authenticated;

create or replace function public.rpc_list_continuity_events(p_world_id uuid)
returns setof public.continuity_events
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select ce.*
  from public.continuity_events ce
  where ce.world_id = p_world_id
    and (ce.owner_id = auth.uid() or public.current_user_is_admin())
  order by ce.created_at desc;
$$;

grant execute on function public.rpc_list_continuity_events(uuid) to authenticated;

create or replace function public.rpc_record_audit(
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
  if p_owner_id <> auth.uid() and not public.current_user_is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.audit_log(actor_id, owner_id, action, target, detail)
  values (auth.uid(), p_owner_id, p_action, p_target, coalesce(p_detail, '{}'::jsonb))
  returning * into v_record;

  return v_record;
end;
$$;

grant execute on function public.rpc_record_audit(uuid, text, text, jsonb) to authenticated;

create or replace function public.rpc_list_audit(p_owner_id uuid)
returns setof public.audit_log
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select al.*
  from public.audit_log al
  where al.owner_id = p_owner_id
    and (al.owner_id = auth.uid() or public.current_user_is_admin())
  order by al.created_at desc;
$$;

grant execute on function public.rpc_list_audit(uuid) to authenticated;

create or replace function public.rpc_check_quota(p_owner_id uuid)
returns table(
  owner_id uuid,
  total_cost_usd numeric,
  monthly_budget_usd numeric,
  soft_limit_usd numeric,
  hard_limit_usd numeric,
  within_hard_limit boolean
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select
    q.owner_id,
    coalesce(uc.total_cost_usd, 0)::numeric as total_cost_usd,
    q.monthly_budget_usd,
    q.soft_limit_usd,
    q.hard_limit_usd,
    coalesce(uc.total_cost_usd, 0) <= q.hard_limit_usd as within_hard_limit
  from public.user_quotas q
  left join public.user_costs uc on uc.owner_id = q.owner_id
  where q.owner_id = p_owner_id
    and (q.owner_id = auth.uid() or public.current_user_is_admin());
$$;

grant execute on function public.rpc_check_quota(uuid) to authenticated;

create or replace function public.rpc_increment_rate_limit(
  p_owner_id uuid,
  p_route_key text,
  p_window_seconds integer,
  p_window_started_at timestamptz default now()
)
returns public.rate_limits
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_limit public.rate_limits;
  v_window_seconds integer;
  v_window_start timestamptz;
begin
  if p_owner_id <> auth.uid() and not public.current_user_is_admin() then
    raise exception 'forbidden';
  end if;

  v_window_seconds := greatest(p_window_seconds, 1);
  v_window_start := to_timestamp(
    floor(extract(epoch from coalesce(p_window_started_at, now())) / v_window_seconds) * v_window_seconds
  );

  insert into public.rate_limits(owner_id, route_key, window_started_at, window_seconds, request_count)
  values (p_owner_id, p_route_key, v_window_start, v_window_seconds, 1)
  on conflict (owner_id, route_key, window_started_at, window_seconds)
  do update set
    request_count = public.rate_limits.request_count + 1,
    updated_at = now()
  returning * into v_limit;

  return v_limit;
end;
$$;

grant execute on function public.rpc_increment_rate_limit(uuid, text, integer, timestamptz) to authenticated;

create or replace function public.rpc_enqueue_alert(
  p_owner_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns public.alert_outbox
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_alert public.alert_outbox;
begin
  if p_owner_id <> auth.uid() and not public.current_user_is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.alert_outbox(owner_id, event_type, payload)
  values (p_owner_id, p_event_type, coalesce(p_payload, '{}'::jsonb))
  returning * into v_alert;

  return v_alert;
end;
$$;

grant execute on function public.rpc_enqueue_alert(uuid, text, jsonb) to authenticated;

create or replace view public.v_job_overview as
select
  j.id,
  j.owner_id,
  j.engine_name,
  j.state,
  j.created_at,
  j.updated_at,
  coalesce(eu.cost_usd, 0)::numeric as latest_cost_usd
from public.jobs j
left join lateral (
  select eu.cost_usd
  from public.engine_usage eu
  where eu.job_id = j.id
  order by eu.created_at desc
  limit 1
) eu on true;

comment on function public.current_user_is_admin() is
  'Security-definer admin check backed by user_profiles.role. Configure role assignment through trusted server-side flows.';
comment on function public.rpc_enqueue_alert(uuid, text, jsonb) is
  'Adds alert events to an outbox for Supabase Database Webhooks/Edge Functions or pg_net delivery workers.';
