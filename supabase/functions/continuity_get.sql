create or replace function continuity_get(owner text)
returns jsonb
language sql
as $$
  select state from continuity_state where owner_id = owner;
$$;
