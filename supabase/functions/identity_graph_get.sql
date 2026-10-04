create or replace function identity_graph_get(owner text)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'nodes', (select node from identity_graph where owner_id = owner),
    'edges', (select edges from identity_graph where owner_id = owner)
  );
$$;
