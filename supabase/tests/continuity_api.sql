do $$
declare
  v_function text;
begin
  foreach v_function in array array[
    'rpc_list_continuity_events_page',
    'rpc_get_continuity_state',
    'rpc_update_continuity_state'
  ] loop
    if not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = v_function
        and p.prosecdef
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
        and not has_function_privilege('anon', p.oid, 'EXECUTE')
        and position('auth.uid()' in pg_get_functiondef(p.oid)) > 0
    ) then
      raise exception 'function % must be owner-scoped and authenticated-only', v_function;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rpc_list_continuity_events_page'
      and position('p_limit > 100' in pg_get_functiondef(p.oid)) > 0
  ) then
    raise exception 'continuity event page size must be bounded';
  end if;
end;
$$;
