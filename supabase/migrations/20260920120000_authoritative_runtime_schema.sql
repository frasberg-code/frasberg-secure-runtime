-- Authoritative schema alignment for the current runtime contract.
-- This migration is additive/online-safe where possible and preserves legacy
-- columns that are still consumed by earlier monitoring migrations.

-- WorldGraph: normalize the persisted column names without changing UUID IDs.
alter table if exists public.worldgraph_definitions
  rename column definition_kind to kind;
alter table if exists public.worldgraph_definitions
  rename column document to definition;

-- Keep the accepted WorldGraph kinds explicit.
alter table if exists public.worldgraph_definitions
drop constraint if exists worldgraph_definitions_definition_kind_check;
alter table if exists public.worldgraph_definitions
add constraint worldgraph_definitions_kind_check
check (kind in ('game', 'app', 'site', 'experience'));

-- Generation jobs are distinct from the legacy jobs table. Do not rename or
-- overload jobs: callers use generation_jobs for the authoritative contract.
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('music', 'video', 'stt', 'tts', 'audio')),
  engine_name text not null,
  state text not null check (state in ('queued', 'running', 'completed', 'failed')),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb,
  cost_usd numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists generation_jobs_owner_created_idx
  on public.generation_jobs(owner_id, created_at desc);
create index if not exists generation_jobs_state_idx
  on public.generation_jobs(state, created_at desc);

alter table public.generation_jobs enable row level security;
alter table public.generation_jobs force row level security;
drop policy if exists generation_jobs_owner_read on public.generation_jobs;
create policy generation_jobs_owner_read on public.generation_jobs
for select using (owner_id = auth.uid() or public.current_user_is_admin());
drop policy if exists generation_jobs_owner_write on public.generation_jobs;
create policy generation_jobs_owner_write on public.generation_jobs
for all using (owner_id = auth.uid() or public.current_user_is_admin())
with check (owner_id = auth.uid() or public.current_user_is_admin());

-- Continuity: add the authoritative JSONB payload while retaining legacy
-- event_type/payload columns for already-deployed monitoring compatibility.
alter table if exists public.continuity_events
  add column if not exists continuity jsonb;
update public.continuity_events
set continuity = jsonb_build_object(
  'event_type', event_type,
  'payload', coalesce(payload, '{}'::jsonb)
)
where continuity is null;
alter table public.continuity_events
  alter column continuity set default '{}'::jsonb;
alter table public.continuity_events
  alter column continuity set not null;

create index if not exists continuity_events_owner_created_idx
  on public.continuity_events(owner_id, created_at desc);
create index if not exists continuity_events_world_created_idx
  on public.continuity_events(world_id, created_at desc);

-- Authoritative continuity RPC. Existing legacy RPCs remain available for
-- backwards compatibility, while new callers use the JSONB contract.
create or replace function public.record_authoritative_continuity_event(
  p_world_id uuid,
  p_continuity jsonb
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
  if p_continuity is null or jsonb_typeof(p_continuity) <> 'object' then
    raise exception 'continuity must be a JSON object';
  end if;
  insert into public.continuity_events(owner_id, world_id, continuity, event_type, payload)
  values (v_world_owner_id, p_world_id, p_continuity,
          coalesce(p_continuity ->> 'event_type', 'continuity'),
          coalesce(p_continuity -> 'payload', '{}'::jsonb))
  returning * into v_event;
  return v_event;
end;
$$;
revoke all on function public.record_authoritative_continuity_event(uuid, jsonb) from public;
grant execute on function public.record_authoritative_continuity_event(uuid, jsonb) to authenticated;

-- Generation-job owner-scoped RPCs.
create or replace function public.create_generation_job(
  p_domain text,
  p_engine_name text,
  p_request_payload jsonb
)
returns public.generation_jobs
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_job public.generation_jobs;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  insert into public.generation_jobs(owner_id, domain, engine_name, state, request_payload)
  values (auth.uid(), p_domain, p_engine_name, 'queued', coalesce(p_request_payload, '{}'::jsonb))
  returning * into v_job;
  return v_job;
end;
$$;

create or replace function public.get_generation_job(p_job_id uuid)
returns public.generation_jobs
language sql
security invoker
set search_path = public, auth, pg_temp
as $$
  select g.* from public.generation_jobs g
  where g.id = p_job_id
    and (g.owner_id = auth.uid() or public.current_user_is_admin());
$$;

create or replace function public.update_generation_job(
  p_job_id uuid,
  p_state text,
  p_response_payload jsonb default null,
  p_cost_usd numeric default null
)
returns public.generation_jobs
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_job public.generation_jobs;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  update public.generation_jobs g
  set state = p_state,
      response_payload = coalesce(p_response_payload, response_payload),
      cost_usd = coalesce(p_cost_usd, cost_usd),
      updated_at = now()
  where g.id = p_job_id
    and (g.owner_id = auth.uid() or public.current_user_is_admin())
  returning * into v_job;
  return v_job;
end;
$$;

revoke all on function public.create_generation_job(text, text, jsonb) from public;
revoke all on function public.get_generation_job(uuid) from public;
revoke all on function public.update_generation_job(uuid, text, jsonb, numeric) from public;
grant execute on function public.create_generation_job(text, text, jsonb) to authenticated;
grant execute on function public.get_generation_job(uuid) to authenticated;
grant execute on function public.update_generation_job(uuid, text, jsonb, numeric) to authenticated;
