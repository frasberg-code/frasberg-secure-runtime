do $$
declare
  v_function text;
begin
  if not (
    select c.relrowsecurity and c.relforcerowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'user_policies'
  ) then
    raise exception 'user_policies must have enabled and forced row-level security';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_policies'
      and policyname = 'user_policies_owner_access'
      and position('owner_id' in qual) > 0
      and position('auth.uid()' in qual) > 0
      and position('owner_id' in with_check) > 0
      and position('auth.uid()' in with_check) > 0
  ) then
    raise exception 'user policy owner policy is missing or not owner-scoped';
  end if;

  foreach v_function in array array[
    'rpc_list_user_policies',
    'rpc_upsert_user_policy',
    'rpc_delete_user_policy',
    'rpc_enforce_user_policies'
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
end;
$$;
