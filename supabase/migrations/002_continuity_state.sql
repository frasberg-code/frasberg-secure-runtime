create table continuity_state (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  state jsonb not null,
  updated_at timestamptz default now()
);

create index continuity_state_owner_idx on continuity_state(owner_id);
