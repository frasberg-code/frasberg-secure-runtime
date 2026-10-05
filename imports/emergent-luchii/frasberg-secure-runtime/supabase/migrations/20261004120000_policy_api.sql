create table if not exists public.user_policies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  meaning_threshold double precision not null
    check (meaning_threshold between 0 and 1),
  risk_threshold double precision not null
    check (risk_threshold between 0 and 1),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create index if not exists user_policies_owner_enabled_idx
  on public.user_policies(owner_id, enabled, name);

alter table public.user_policies enable row level security;
alter table public.user_policies force row level security;

drop policy if exists user_policies_owner_access on public.user_policies;
create policy user_policies_owner_access
on public.user_policies
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

revoke all on public.user_policies from anon, authenticated;

create or replace function public.rpc_list_user_policies()
returns setof public.user_policies
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  return query
    select p.*
    from public.user_policies p
    where p.owner_id = auth.uid()
    order by p.name, p.id;
end;
$$;

create or replace function public.rpc_upsert_user_policy(
  p_id uuid,
  p_name text,
  p_meaning_threshold double precision,
  p_risk_threshold double precision,
  p_enabled boolean
)
returns public.user_policies
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_policy public.user_policies;
  v_name text := trim(coalesce(p_name, ''));
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(v_name) not between 1 and 100 then
    raise exception 'policy name must contain between 1 and 100 characters' using errcode = '22023';
  end if;
  if p_meaning_threshold is null or p_meaning_threshold not between 0 and 1
    or p_risk_threshold is null or p_risk_threshold not between 0 and 1 then
    raise exception 'policy thresholds must be between 0 and 1' using errcode = '22023';
  end if;
  if p_enabled is null then
    raise exception 'enabled must be provided' using errcode = '22023';
  end if;

  insert into public.user_policies(
    id, owner_id, name, meaning_threshold, risk_threshold, enabled
  )
  values (
    coalesce(p_id, gen_random_uuid()),
    auth.uid(),
    v_name,
    p_meaning_threshold,
    p_risk_threshold,
    p_enabled
  )
  on conflict (id) do update
    set name = excluded.name,
        meaning_threshold = excluded.meaning_threshold,
        risk_threshold = excluded.risk_threshold,
        enabled = excluded.enabled,
        updated_at = now()
    where public.user_policies.owner_id = auth.uid()
  returning * into v_policy;

  if not found then
    raise exception 'policy access denied' using errcode = '42501';
  end if;
  return v_policy;
end;
$$;

create or replace function public.rpc_delete_user_policy(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_rows bigint;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  delete from public.user_policies p
  where p.id = p_id and p.owner_id = auth.uid();
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function public.rpc_enforce_user_policies(
  p_meaning_score double precision,
  p_risk_profile double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_meaning_score is null or p_meaning_score not between 0 and 1
    or p_risk_profile is null or p_risk_profile not between 0 and 1 then
    raise exception 'scores must be between 0 and 1' using errcode = '22023';
  end if;

  with evaluated as (
    select
      p.id,
      p.name,
      array_remove(array[
        case when p_meaning_score < p.meaning_threshold
          then 'meaning-below-threshold' end,
        case when p_risk_profile > p.risk_threshold
          then 'risk-above-threshold' end
      ], null) as violations
    from public.user_policies p
    where p.owner_id = auth.uid() and p.enabled
  )
  select jsonb_build_object(
    'allowed', coalesce(bool_and(cardinality(e.violations) = 0), true),
    'policiesEvaluated', count(*),
    'violations', coalesce(
      jsonb_agg(jsonb_build_object(
        'policyId', e.id,
        'name', e.name,
        'violations', to_jsonb(e.violations)
      )) filter (where cardinality(e.violations) > 0),
      '[]'::jsonb
    )
  )
  into v_result
  from evaluated e;

  return v_result;
end;
$$;

revoke all on function public.rpc_list_user_policies() from public, anon;
revoke all on function public.rpc_upsert_user_policy(uuid, text, double precision, double precision, boolean)
  from public, anon;
revoke all on function public.rpc_delete_user_policy(uuid) from public, anon;
revoke all on function public.rpc_enforce_user_policies(double precision, double precision)
  from public, anon;
grant execute on function public.rpc_list_user_policies() to authenticated;
grant execute on function public.rpc_upsert_user_policy(uuid, text, double precision, double precision, boolean)
  to authenticated;
grant execute on function public.rpc_delete_user_policy(uuid) to authenticated;
grant execute on function public.rpc_enforce_user_policies(double precision, double precision)
  to authenticated;
