create or replace function public.rpc_list_continuity_events_page(
  p_world_id uuid,
  p_limit integer default 50,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns setof public.continuity_events
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'limit must be between 1 and 100' using errcode = '22023';
  end if;
  if (p_before is null) <> (p_before_id is null) then
    raise exception 'both cursor values are required' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.worlds w
    where w.id = p_world_id
      and w.owner_id = auth.uid()
  ) then
    raise exception 'world access denied' using errcode = '42501';
  end if;

  return query
    select ce.*
    from public.continuity_events ce
    where ce.world_id = p_world_id
      and ce.owner_id = auth.uid()
      and (
        p_before is null
        or (ce.created_at, ce.id) < (p_before, p_before_id)
      )
    order by ce.created_at desc, ce.id desc
    limit p_limit;
end;
$$;

revoke all on function public.rpc_list_continuity_events_page(uuid, integer, timestamptz, uuid)
  from public, anon;
grant execute on function public.rpc_list_continuity_events_page(uuid, integer, timestamptz, uuid)
  to authenticated;

create or replace function public.rpc_get_continuity_state(p_world_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_state jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select coalesce(w.world_state -> 'continuity', '{}'::jsonb)
  into v_state
  from public.worlds w
  where w.id = p_world_id
    and w.owner_id = auth.uid();
  if not found then
    raise exception 'world access denied' using errcode = '42501';
  end if;

  return v_state;
end;
$$;

create or replace function public.rpc_update_continuity_state(
  p_world_id uuid,
  p_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_state jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_state) is distinct from 'object' then
    raise exception 'continuity state must be a JSON object' using errcode = '22023';
  end if;

  update public.worlds w
  set world_state = jsonb_set(
    coalesce(w.world_state, '{}'::jsonb),
    '{continuity}',
    p_state,
    true
  ),
  updated_at = now()
  where w.id = p_world_id
    and w.owner_id = auth.uid()
  returning w.world_state -> 'continuity' into v_state;
  if not found then
    raise exception 'world access denied' using errcode = '42501';
  end if;

  return v_state;
end;
$$;

revoke all on function public.rpc_get_continuity_state(uuid) from public, anon;
revoke all on function public.rpc_update_continuity_state(uuid, jsonb) from public, anon;
grant execute on function public.rpc_get_continuity_state(uuid) to authenticated;
grant execute on function public.rpc_update_continuity_state(uuid, jsonb) to authenticated;
