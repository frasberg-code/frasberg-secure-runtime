-- Canonical runtime contract reconciliation.
-- No seed data, no credentials, no JWT secrets, no service-role keys.

create extension if not exists pgcrypto;

-- worldgraph_definitions: normalize to authoritative contract
do $$
begin
  if to_regclass('public.worldgraph_definitions') is null then
    create table public.worldgraph_definitions (
      id uuid primary key default gen_random_uuid(),
      owner_id uuid not null references auth.users(id) on delete cascade,
      name text not null,
      kind text not null check (kind in ('game', 'app', 'site', 'experience')),
      schema_version text not null,
      definition jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  else
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'worldgraph_definitions'
        and column_name = 'definition_kind'
    ) and not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'worldgraph_definitions'
        and column_name = 'kind'
    ) then
      alter table public.worldgraph_definitions rename column definition_kind to kind;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'worldgraph_definitions'
        and column_name = 'document'
    ) and not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'worldgraph_definitions'
        and column_name = 'definition'
    ) then
      alter table public.worldgraph_definitions rename column document to definition;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'worldgraph_definitions'
        and column_name = 'kind'
    ) then
      alter table public.worldgraph_definitions
        drop constraint if exists worldgraph_definitions_definition_kind_check;

      alter table public.worldgraph_definitions
        drop constraint if exists worldgraph_definitions_kind_check;

      alter table public.worldgraph_definitions
        add constraint worldgraph_definitions_kind_check
        check (kind in ('game', 'app', 'site', 'experience'));
    end if;
  end if;
end $$;

create index if not exists worldgraph_definitions_owner_updated_idx
  on public.worldgraph_definitions(owner_id, updated_at desc);

-- generation_jobs: authoritative contract
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

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'generation_jobs'
      and column_name = 'engine'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'generation_jobs'
      and column_name = 'engine_name'
  ) then
    alter table public.generation_jobs rename column engine to engine_name;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'generation_jobs'
      and column_name = 'cost'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'generation_jobs'
      and column_name = 'cost_usd'
  ) then
    alter table public.generation_jobs rename column cost to cost_usd;
  end if;
end $$;

alter table public.generation_jobs
  alter column cost_usd type numeric(10,2)
  using cost_usd::numeric(10,2);

create index if not exists generation_jobs_owner_created_idx
  on public.generation_jobs(owner_id, created_at desc);

-- continuity_events: canonical JSONB payload
create table if not exists public.continuity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  world_id uuid not null references public.worldgraph_definitions(id) on delete cascade,
  continuity jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'continuity_events'
      and column_name = 'continuity'
      and (
        select data_type
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'continuity_events'
          and column_name = 'continuity'
      ) = 'text'
  ) then
    alter table public.continuity_events
      alter column continuity type jsonb using continuity::jsonb;
  end if;
end $$;

create index if not exists continuity_events_owner_created_idx
  on public.continuity_events(owner_id, created_at desc);

create index if not exists continuity_events_world_created_idx
  on public.continuity_events(world_id, created_at desc);

-- RLS
alter table public.worldgraph_definitions enable row level security;
alter table public.worldgraph_definitions force row level security;
alter table public.generation_jobs enable row level security;
alter table public.generation_jobs force row level security;
alter table public.continuity_events enable row level security;
alter table public.continuity_events force row level security;

drop policy if exists worldgraph_definitions_owner_access on public.worldgraph_definitions;
create policy worldgraph_definitions_owner_access
  on public.worldgraph_definitions
  for all
  using (owner_id = auth.uid() or public.current_user_is_admin())
  with check (owner_id = auth.uid() or public.current_user_is_admin());

drop policy if exists generation_jobs_owner_access on public.generation_jobs;
create policy generation_jobs_owner_access
  on public.generation_jobs
  for all
  using (owner_id = auth.uid() or public.current_user_is_admin())
  with check (owner_id = auth.uid() or public.current_user_is_admin());

drop policy if exists continuity_events_owner_access on public.continuity_events;
create policy continuity_events_owner_access
  on public.continuity_events
  for all
  using (owner_id = auth.uid() or public.current_user_is_admin())
  with check (owner_id = auth.uid() or public.current_user_is_admin());

-- Canonical refresh wrapper remains the only refresh path
comment on function monitor.refresh_materialized_views() is
  'Canonical refresh orchestration. Direct refresh calls are not part of the runtime contract.';
