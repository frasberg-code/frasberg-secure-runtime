-- Authoritative Frasberg Secure Runtime schema
-- Owner-scoped worldgraph, generation jobs, continuity events
-- and materialized view refresh wrapper.

CREATE TABLE IF NOT EXISTS worldgraph_definitions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users (id),
  name           text NOT NULL,
  kind           text NOT NULL,
  schema_version text NOT NULL,
  definition     jsonb NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES auth.users (id),
  domain          text NOT NULL,
  engine_name     text NOT NULL,
  state           text NOT NULL,
  request_payload jsonb NOT NULL,
  response_payload jsonb,
  cost_usd        numeric(10,2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS continuity_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users (id),
  world_id   uuid NOT NULL REFERENCES worldgraph_definitions (id),
  continuity jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SCHEMA IF NOT EXISTS monitor;

CREATE OR REPLACE FUNCTION monitor.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Example refresh order; real materialized views should be kept in dependency order.
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_worldgraph_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_generation_costs;
END;
$$;
