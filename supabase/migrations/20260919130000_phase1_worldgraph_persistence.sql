-- Phase 1 WorldGraph persistence for games/apps/sites.
-- Uses owner-scoped RLS plus SECURITY DEFINER RPCs so application code can use
-- authenticated Supabase RPC calls instead of direct table access.

create table if not exists public.worldgraph_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  definition_kind text not null check (definition_kind in ('game', 'app', 'site')),
  name text not null,
  schema_version text not null,
  document jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists worldgraph_definitions_owner_updated_idx
  on public.worldgraph_definitions(owner_id, updated_at desc);
create index if not exists worldgraph_definitions_kind_idx
  on public.worldgraph_definitions(definition_kind, owner_id);

drop trigger if exists set_worldgraph_definitions_updated_at on public.worldgraph_definitions;
create trigger set_worldgraph_definitions_updated_at
before update on public.worldgraph_definitions
for each row execute procedure public.set_updated_at();

alter table public.worldgraph_definitions enable row level security;
alter table public.worldgraph_definitions force row level security;

drop policy if exists worldgraph_definitions_owner_read on public.worldgraph_definitions;
create policy worldgraph_definitions_owner_read
on public.worldgraph_definitions
for select
using (owner_id = auth.uid() or public.current_user_is_admin());

drop policy if exists worldgraph_definitions_owner_write on public.worldgraph_definitions;
create policy worldgraph_definitions_owner_write
on public.worldgraph_definitions
for all
using (owner_id = auth.uid() or public.current_user_is_admin())
with check (owner_id = auth.uid() or public.current_user_is_admin());

create or replace function public.rpc_create_worldgraph_definition(p_definition jsonb)
returns public.worldgraph_definitions
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_record public.worldgraph_definitions;
  v_name text;
  v_kind text;
  v_schema_version text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  v_name := nullif(trim(coalesce(p_definition ->> 'name', '')), '');
  v_kind := nullif(trim(coalesce(p_definition ->> 'kind', '')), '');
  v_schema_version := nullif(trim(coalesce(p_definition -> 'metadata' ->> 'schemaVersion', '')), '');

  if v_name is null then
    raise exception 'document.name is required';
  end if;
  if v_kind not in ('game', 'app', 'site') then
    raise exception 'document.kind must be one of: game, app, site';
  end if;
  if v_schema_version is null then
    raise exception 'document.metadata.schemaVersion is required';
  end if;

  insert into public.worldgraph_definitions(owner_id, definition_kind, name, schema_version, document)
  values (auth.uid(), v_kind, v_name, v_schema_version, coalesce(p_definition, '{}'::jsonb))
  returning * into v_record;

  return v_record;
end;
$$;

grant execute on function public.rpc_create_worldgraph_definition(jsonb) to authenticated;

create or replace function public.rpc_get_worldgraph_definition(p_definition_id uuid)
returns public.worldgraph_definitions
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select d.*
  from public.worldgraph_definitions d
  where d.id = p_definition_id
    and (d.owner_id = auth.uid() or public.current_user_is_admin());
$$;

grant execute on function public.rpc_get_worldgraph_definition(uuid) to authenticated;

create or replace function public.rpc_update_worldgraph_definition(
  p_definition_id uuid,
  p_definition jsonb
)
returns public.worldgraph_definitions
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_record public.worldgraph_definitions;
  v_name text;
  v_kind text;
  v_schema_version text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  v_name := nullif(trim(coalesce(p_definition ->> 'name', '')), '');
  v_kind := nullif(trim(coalesce(p_definition ->> 'kind', '')), '');
  v_schema_version := nullif(trim(coalesce(p_definition -> 'metadata' ->> 'schemaVersion', '')), '');

  if v_name is null then
    raise exception 'document.name is required';
  end if;
  if v_kind not in ('game', 'app', 'site') then
    raise exception 'document.kind must be one of: game, app, site';
  end if;
  if v_schema_version is null then
    raise exception 'document.metadata.schemaVersion is required';
  end if;

  update public.worldgraph_definitions d
     set definition_kind = v_kind,
         name = v_name,
         schema_version = v_schema_version,
         document = coalesce(p_definition, '{}'::jsonb),
         updated_at = now()
   where d.id = p_definition_id
     and (d.owner_id = auth.uid() or public.current_user_is_admin())
  returning * into v_record;

  return v_record;
end;
$$;

grant execute on function public.rpc_update_worldgraph_definition(uuid, jsonb) to authenticated;

create or replace function public.rpc_delete_worldgraph_definition(p_definition_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_deleted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  delete from public.worldgraph_definitions d
   where d.id = p_definition_id
     and (d.owner_id = auth.uid() or public.current_user_is_admin());

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count > 0;
end;
$$;

grant execute on function public.rpc_delete_worldgraph_definition(uuid) to authenticated;

create or replace function public.rpc_list_worldgraph_definitions(
  p_limit integer default 20,
  p_offset integer default 0
)
returns table(
  id uuid,
  owner_id uuid,
  definition_kind text,
  name text,
  schema_version text,
  document jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  with filtered as (
    select d.*
    from public.worldgraph_definitions d
    where d.owner_id = auth.uid()
    order by d.updated_at desc, d.id desc
    limit greatest(1, least(coalesce(p_limit, 20), 100))
    offset greatest(coalesce(p_offset, 0), 0)
  ),
  counted as (
    select count(*)::bigint as total_count
    from public.worldgraph_definitions d
    where d.owner_id = auth.uid()
  )
  select
    f.id,
    f.owner_id,
    f.definition_kind,
    f.name,
    f.schema_version,
    f.document,
    f.created_at,
    f.updated_at,
    c.total_count
  from filtered f
  cross join counted c;
$$;

grant execute on function public.rpc_list_worldgraph_definitions(integer, integer) to authenticated;

comment on table public.worldgraph_definitions is
  'Persistent WorldGraph definitions for games, apps, and sites. Application code should access rows through authenticated RPCs rather than direct table queries.';
comment on function public.rpc_create_worldgraph_definition(jsonb) is
  'Creates an owner-scoped WorldGraph definition from a validated JSON schema document.';
comment on function public.rpc_list_worldgraph_definitions(integer, integer) is
  'Lists only the authenticated owner''s WorldGraph definitions with offset pagination and total_count metadata.';
