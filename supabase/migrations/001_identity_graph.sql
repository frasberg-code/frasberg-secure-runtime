create table identity_graph (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  node jsonb not null,
  edges jsonb not null,
  created_at timestamptz default now()
);

create index identity_graph_owner_idx on identity_graph(owner_id);
