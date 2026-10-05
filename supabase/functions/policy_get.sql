create or replace function policy_get(owner text)
returns jsonb
language sql
as $$
  select jsonb_agg(rule) from policy_rules where owner_id = owner;
$$;
