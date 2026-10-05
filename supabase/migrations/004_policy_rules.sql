create table policy_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  rule jsonb not null,
  created_at timestamptz default now()
);

create index policy_rules_owner_idx on policy_rules(owner_id);
