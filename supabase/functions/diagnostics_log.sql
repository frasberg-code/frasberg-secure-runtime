create or replace function diagnostics_log(owner text, component text, payload jsonb)
returns void
language sql
as $$
  insert into diagnostics(owner_id, component, payload)
  values (owner, component, payload);
$$;
