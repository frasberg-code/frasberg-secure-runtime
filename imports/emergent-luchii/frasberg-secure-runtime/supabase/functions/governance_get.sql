create or replace function governance_get(owner text)
returns jsonb
language sql
as $$
  select jsonb_agg(rule) from governance_rules where owner_id = owner;
$$;
