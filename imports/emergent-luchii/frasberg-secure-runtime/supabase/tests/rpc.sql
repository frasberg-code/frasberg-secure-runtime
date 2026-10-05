-- Run after applying migrations in a local Supabase/Postgres environment.
-- Verifies core RPCs exist and use SECURITY DEFINER.

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'rpc_list_jobs',
    'rpc_get_job_detail',
    'rpc_log_engine_usage_and_increment_cost',
    'rpc_cost_summary',
    'rpc_get_worlds_admin',
    'rpc_record_continuity_event',
    'rpc_list_continuity_events',
    'rpc_record_audit',
    'rpc_list_audit',
    'rpc_check_quota',
    'rpc_increment_rate_limit',
    'rpc_enqueue_alert'
  ] loop
    if not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = fn
        and p.prosecdef
    ) then
      raise exception 'function % must exist as SECURITY DEFINER', fn;
    end if;
  end loop;
end;
$$;
