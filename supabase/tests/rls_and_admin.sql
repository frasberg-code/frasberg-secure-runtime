-- Run after applying migrations in a local Supabase/Postgres environment.
-- This verifies that admin checks and RLS policies are present and security-definer.

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'current_user_is_admin'
      and p.prosecdef
  ) then
    raise exception 'current_user_is_admin() must exist as security definer';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_owner_read'
  ) then
    raise exception 'projects_owner_read policy missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'user_profiles_self_or_admin_select'
  ) then
    raise exception 'user_profiles_self_or_admin_select policy missing';
  end if;
end;
$$;
