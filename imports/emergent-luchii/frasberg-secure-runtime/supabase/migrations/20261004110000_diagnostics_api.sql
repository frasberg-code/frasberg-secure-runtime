create table if not exists public.diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 100),
  severity text not null check (severity in ('info', 'warning', 'error')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists diagnostic_events_owner_created_idx
  on public.diagnostic_events(owner_id, created_at desc, id desc);

alter table public.diagnostic_events enable row level security;
alter table public.diagnostic_events force row level security;

drop policy if exists diagnostic_events_owner_access on public.diagnostic_events;
create policy diagnostic_events_owner_access
on public.diagnostic_events
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

revoke all on public.diagnostic_events from anon, authenticated;

create or replace function public.rpc_record_diagnostic_event(
  p_event_type text,
  p_severity text,
  p_details jsonb default '{}'::jsonb
)
returns public.diagnostic_events
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.diagnostic_events;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_event_type is null or char_length(trim(p_event_type)) not between 1 and 100 then
    raise exception 'event type must contain between 1 and 100 characters' using errcode = '22023';
  end if;
  if p_severity is null or p_severity not in ('info', 'warning', 'error') then
    raise exception 'unsupported diagnostic severity' using errcode = '22023';
  end if;
  if jsonb_typeof(p_details) is distinct from 'object' then
    raise exception 'diagnostic details must be a JSON object' using errcode = '22023';
  end if;

  insert into public.diagnostic_events(owner_id, event_type, severity, details)
  values (auth.uid(), trim(p_event_type), p_severity, p_details)
  returning * into v_event;

  return v_event;
end;
$$;

create or replace function public.rpc_list_diagnostic_events(
  p_limit integer default 50,
  p_before timestamptz default null,
  p_before_id uuid default null
)
returns setof public.diagnostic_events
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

  return query
    select d.*
    from public.diagnostic_events d
    where d.owner_id = auth.uid()
      and (
        p_before is null
        or (d.created_at, d.id) < (p_before, p_before_id)
      )
    order by d.created_at desc, d.id desc
    limit p_limit;
end;
$$;

revoke all on function public.rpc_record_diagnostic_event(text, text, jsonb)
  from public, anon;
revoke all on function public.rpc_list_diagnostic_events(integer, timestamptz, uuid)
  from public, anon;
grant execute on function public.rpc_record_diagnostic_event(text, text, jsonb)
  to authenticated;
grant execute on function public.rpc_list_diagnostic_events(integer, timestamptz, uuid)
  to authenticated;
