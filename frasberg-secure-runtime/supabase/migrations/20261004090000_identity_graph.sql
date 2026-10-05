create table if not exists public.identity_graph (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  node jsonb not null default '[]'::jsonb check (jsonb_typeof(node) = 'array'),
  edges jsonb not null default '[]'::jsonb check (jsonb_typeof(edges) = 'array'),
  updated_at timestamptz not null default now()
);

alter table public.identity_graph enable row level security;
alter table public.identity_graph force row level security;

drop policy if exists identity_graph_owner_access on public.identity_graph;
create policy identity_graph_owner_access
on public.identity_graph
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

revoke all on public.identity_graph from anon, authenticated;

create or replace function public.rpc_get_identity_graph()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_graph jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'node', g.node,
    'edges', g.edges,
    'updatedAt', g.updated_at
  )
  into v_graph
  from public.identity_graph g
  where g.owner_id = auth.uid();

  return coalesce(
    v_graph,
    jsonb_build_object('node', '[]'::jsonb, 'edges', '[]'::jsonb)
  );
end;
$$;

create or replace function public.rpc_upsert_identity_graph(
  p_node jsonb,
  p_edges jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_graph public.identity_graph;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_node) is distinct from 'array'
    or jsonb_typeof(p_edges) is distinct from 'array' then
    raise exception 'node and edges must be JSON arrays' using errcode = '22023';
  end if;

  insert into public.identity_graph(owner_id, node, edges, updated_at)
  values (auth.uid(), p_node, p_edges, now())
  on conflict (owner_id) do update
    set node = excluded.node,
        edges = excluded.edges,
        updated_at = excluded.updated_at
  returning * into v_graph;

  return jsonb_build_object(
    'node', v_graph.node,
    'edges', v_graph.edges,
    'updatedAt', v_graph.updated_at
  );
end;
$$;

revoke all on function public.rpc_get_identity_graph() from public, anon;
revoke all on function public.rpc_upsert_identity_graph(jsonb, jsonb) from public, anon;
grant execute on function public.rpc_get_identity_graph() to authenticated;
grant execute on function public.rpc_upsert_identity_graph(jsonb, jsonb) to authenticated;
