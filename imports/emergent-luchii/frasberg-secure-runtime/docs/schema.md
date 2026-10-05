# Frasberg Secure Runtime — Authoritative Schema Reference

## Core tables

### `worldgraph_definitions`

Stores validated world definitions owned by authenticated users.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID (PK)` | `DEFAULT gen_random_uuid()` |
| `owner_id` | `UUID` | References `auth.users(id)` |
| `name` | `TEXT` | World name |
| `kind` | `TEXT` | `game`, `experience`, etc. |
| `schema_version` | `TEXT` | Semantic version |
| `definition` | `JSONB` | Validated worldgraph schema |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` |

### `generation_jobs`

Tracks generation requests submitted through Gateway → Engine.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID (PK)` | `DEFAULT gen_random_uuid()` |
| `owner_id` | `UUID` | Authenticated user |
| `domain` | `TEXT` | `music`, `video`, `stt`, etc. |
| `engine_name` | `TEXT` | Engine identifier |
| `state` | `TEXT` | `queued`, `running`, `completed`, `failed` |
| `request_payload` | `JSONB` | Input |
| `response_payload` | `JSONB` | Output |
| `cost_usd` | `NUMERIC(10,2)` | Billing |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` |

### `continuity_events`

Stores continuity simulation results.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `UUID (PK)` | `DEFAULT gen_random_uuid()` |
| `owner_id` | `UUID` | Authenticated user |
| `world_id` | `UUID` | References `worldgraph_definitions(id)` |
| `continuity` | `JSONB` | Simulation payload |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` |

## Materialized view refresh

`monitor.refresh_materialized_views()` is the canonical wrapper for safe MV refreshes.

Requirements:

- Handles ordering
- Uses advisory locks where needed
- Prevents concurrent refresh collisions
- Keeps CI and production behavior consistent

## Migration diff (old → new)

### Ownership

```sql
user_id -> owner_id
```

### World IDs

```sql
TEXT / SERIAL -> UUID DEFAULT gen_random_uuid()
```

### Engine field

```sql
engine -> engine_name
```

### Cost field

```sql
cost -> cost_usd NUMERIC(10,2)
```

### Continuity payload

```sql
TEXT -> JSONB
```

### Materialized view refresh

```sql
REFRESH MATERIALIZED VIEW ...
->
SELECT monitor.refresh_materialized_views();
```

## Seeds

This repository must not create:

- Seed users
- Seed credentials
- JWT secrets
- Service-role keys
- Engine secrets

## Safe SQL snippet pack

### `worldgraph_definitions`

```sql
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
```

### `generation_jobs`

```sql
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
```

### `continuity_events`

```sql
CREATE TABLE IF NOT EXISTS continuity_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users (id),
  world_id   uuid NOT NULL REFERENCES worldgraph_definitions (id),
  continuity jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Materialized view refresh wrapper

```sql
CREATE SCHEMA IF NOT EXISTS monitor;

CREATE OR REPLACE FUNCTION monitor.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_worldgraph_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_generation_costs;
END;
$$;
```

## Runtime boundary checklist

### Gateway

- Validates JWT (`sub`, `iss`, `aud`, `exp`)
- Rejects client-claimed roles
- Uses a server-side role store
- Routes:
  - `/v1/generate/*` → `EngineAdapter`
  - `/v1/worldgraph` → `WorldGraphService`
- Enforces owner scoping

### Engine

- Accepts jobs only from Gateway
- Writes `generation_jobs`
- Emits `JSONB` payloads
- Uses `engine_name`, not `engine`
- Computes `cost_usd`

### WorldGraph

- Validates world definitions
- Performs CRUD with owner scoping
- Uses UUID IDs
- Uses `JSONB` definitions
- Emits audit records

## Supabase migration file

Create `supabase/migrations/20260920_authoritative_schema.sql`:

```sql
-- worldgraph_definitions
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

-- generation_jobs
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

-- continuity_events
CREATE TABLE IF NOT EXISTS continuity_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users (id),
  world_id   uuid NOT NULL REFERENCES worldgraph_definitions (id),
  continuity jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- MV refresh wrapper
CREATE SCHEMA IF NOT EXISTS monitor;

CREATE OR REPLACE FUNCTION monitor.refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_worldgraph_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_generation_costs;
END;
$$;
```

## README note

```md
## Authoritative schema and runtime boundaries

This repository implements the Frasberg secure runtime, gateway, and worldgraph engine with the following authoritative schema:

- `worldgraph_definitions`
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `owner_id uuid NOT NULL REFERENCES auth.users(id)`
  - `name text NOT NULL`
  - `kind text NOT NULL`
  - `schema_version text NOT NULL`
  - `definition jsonb NOT NULL`
  - `created_at timestamptz NOT NULL DEFAULT now()`
  - `updated_at timestamptz NOT NULL DEFAULT now()`

- `generation_jobs`
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `owner_id uuid NOT NULL`
  - `domain text NOT NULL`
  - `engine_name text NOT NULL`
  - `state text NOT NULL`
  - `request_payload jsonb NOT NULL`
  - `response_payload jsonb`
  - `cost_usd numeric(10,2)`
  - `created_at timestamptz NOT NULL DEFAULT now()`
  - `updated_at timestamptz NOT NULL DEFAULT now()`

- `continuity_events`
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `owner_id uuid NOT NULL`
  - `world_id uuid NOT NULL REFERENCES worldgraph_definitions(id)`
  - `continuity jsonb NOT NULL`
  - `created_at timestamptz NOT NULL DEFAULT now()`

Materialized views are refreshed via:

```sql
SELECT monitor.refresh_materialized_views();
```

No seed users, credentials, JWT secrets, service-role keys, or engine secrets are created by this repository.

Runtime boundaries:

- Gateway validates JWT, enforces roles, and routes `/v1/generate/*` and `/v1/worldgraph`.
- Engine accepts jobs from Gateway only, writes `generation_jobs`, and computes `cost_usd`.
- WorldGraph validates and persists world definitions, scoped by `owner_id`, and emits audit records.
```

## Supabase test database bootstrap

```sql
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
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_worldgraph_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_generation_costs;
END;
$$;
```

## Runtime architecture overview

- Client: sends authenticated HTTP requests with JWT bearer tokens.
- Gateway server:
  - validates JWT (`sub`, `iss`, `aud`, `exp`)
  - enforces role checks
  - exposes `/v1/generate/:domain` and `/v1/worldgraph`
  - writes audit records
- Engine layer:
  - implements `EngineAdapter.submitJob(domain, payload)`
  - persists `generation_jobs` using `engine_name` and `cost_usd`
  - emits outputs for music, video, etc.
- WorldGraph service:
  - validates definitions
  - persists to `worldgraph_definitions`
  - enforces `owner_id` scoping
  - emits audit actions
- Database (Supabase/Postgres):
  - hosts schema tables
  - enforces foreign keys and RLS
  - exposes `monitor.refresh_materialized_views()`
- Observability / audit:
  - gateway and worldgraph write audit records
  - materialized views are refreshed via `monitor.refresh_materialized_views()`

## Summary

This is the authoritative, owner-scoped, UUID-based runtime schema for Frasberg Secure Runtime. It intentionally avoids seed users, secrets, and default credentials and keeps runtime boundaries explicit between Gateway, Engine, and WorldGraph.
