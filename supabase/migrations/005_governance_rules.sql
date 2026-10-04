create table governance_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  rule jsonb not null,
  created_at timestamptz default now()
);

create index governance_rules_owner_idx on governance_rules(owner_id);
