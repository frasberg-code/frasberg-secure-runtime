create or replace function continuity_update(owner text, new_state jsonb)
returns void
language sql
as $$
  update continuity_state
  set state = new_state, updated_at = now()
  where owner_id = owner;
$$;
