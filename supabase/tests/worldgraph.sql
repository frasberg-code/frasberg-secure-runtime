-- Run after applying migrations in a local Supabase/Postgres environment.
-- Verifies WorldGraph RLS and SECURITY DEFINER RPC contracts.

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'rpc_create_worldgraph_definition',
    'rpc_get_worldgraph_definition',
    'rpc_update_worldgraph_definition',
    'rpc_delete_worldgraph_definition',
    'rpc_list_worldgraph_definitions'
  ] loop
    if not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = fn
        and p.prosecdef
    ) then
      raise exception 'function % must exist as SECURITY DEFINER', fn;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'worldgraph_definitions'
      and policyname = 'worldgraph_definitions_owner_read'
  ) then
    raise exception 'worldgraph_definitions_owner_read policy missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'worldgraph_definitions'
      and policyname = 'worldgraph_definitions_owner_write'
  ) then
    raise exception 'worldgraph_definitions_owner_write policy missing';
  end if;
end;
$$;
