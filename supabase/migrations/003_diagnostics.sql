create table diagnostics (
  id uuid primary key default gen_random_uuid(),
  owner_id text,
  component text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create index diagnostics_owner_idx on diagnostics(owner_id);
create index diagnostics_component_idx on diagnostics(component);
