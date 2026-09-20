-- Minimal schema bootstrap for an ephemeral PostgreSQL validation database.
-- This creates no users, credentials, JWT secrets, or provider keys.

create extension if not exists pgcrypto;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);

create table if not exists public.worldgraph_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  kind text not null,
  schema_version text not null,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  domain text not null,
  engine_name text not null,
  state text not null check (state in ('queued', 'running', 'completed', 'failed')),
  request_payload jsonb not null,
  response_payload jsonb,
  cost_usd numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.continuity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  world_id uuid not null references public.worldgraph_definitions(id),
  continuity jsonb not null,
  created_at timestamptz not null default now()
);

create schema if not exists monitor;
create or replace function monitor.refresh_materialized_views()
returns void language plpgsql as $$
begin
  -- The ephemeral bootstrap has no materialized views to refresh.
  return;
end;
$$;
