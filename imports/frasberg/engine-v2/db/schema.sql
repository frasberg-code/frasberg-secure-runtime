-- Frasberg Engine v2 Metadata Database Schema
-- Multi-region Postgres / CockroachDB
-- Strongly consistent, WAL-archived, multi-region replicated

-- Main video tasks table
CREATE TABLE IF NOT EXISTS video_tasks (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL,
  project_id        TEXT NOT NULL,
  model             TEXT NOT NULL,
  region            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'queued',
  prompt            TEXT NOT NULL,
  duration          INT NOT NULL,
  ratio             TEXT NOT NULL,
  motion            TEXT NOT NULL,
  guidance_scale    REAL NOT NULL,
  seed              INT,
  output_format     TEXT NOT NULL,
  video_url         TEXT,
  error             JSONB,
  estimated_credits INT,
  actual_credits    INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_tasks_status_idx ON video_tasks (status);
CREATE INDEX IF NOT EXISTS video_tasks_user_id_idx ON video_tasks (user_id);
CREATE INDEX IF NOT EXISTS video_tasks_model_region_idx ON video_tasks (model, region);
CREATE INDEX IF NOT EXISTS video_tasks_created_at_idx ON video_tasks (created_at DESC);

-- Task event log
CREATE TABLE IF NOT EXISTS video_task_events (
  id         BIGSERIAL PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES video_tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_task_events_task_id_idx ON video_task_events (task_id);
CREATE INDEX IF NOT EXISTS video_task_events_created_at_idx ON video_task_events (created_at DESC);

-- Billing events
CREATE TABLE IF NOT EXISTS billing_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    TEXT NOT NULL,
  project_id TEXT NOT NULL,
  task_id    TEXT,
  event_type TEXT NOT NULL,
  credits    INT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_user_id_idx ON billing_events (user_id);
CREATE INDEX IF NOT EXISTS billing_events_task_id_idx ON billing_events (task_id);
CREATE INDEX IF NOT EXISTS billing_events_created_at_idx ON billing_events (created_at DESC);

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  project_id TEXT NOT NULL,
  hashed_key TEXT NOT NULL,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS api_keys_project_id_idx ON api_keys (project_id);

-- Webhook events (for retry logic)
CREATE TABLE IF NOT EXISTS webhook_events (
  id              BIGSERIAL PRIMARY KEY,
  task_id         TEXT NOT NULL REFERENCES video_tasks(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  webhook_url     TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB,
  status          TEXT NOT NULL DEFAULT 'pending',
  retry_count     INT DEFAULT 0,
  last_error      TEXT,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_events_task_id_idx ON webhook_events (task_id);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON webhook_events (status);
CREATE INDEX IF NOT EXISTS webhook_events_next_retry_at_idx ON webhook_events (next_retry_at);

-- GPU nodes registry
CREATE TABLE IF NOT EXISTS gpu_nodes (
  id              TEXT PRIMARY KEY,
  region          TEXT NOT NULL,
  gpu_class       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'healthy',
  gpu_utilization REAL,
  active_tasks    INT DEFAULT 0,
  last_heartbeat  TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gpu_nodes_region_idx ON gpu_nodes (region);
CREATE INDEX IF NOT EXISTS gpu_nodes_status_idx ON gpu_nodes (status);

-- Autoscaler history
CREATE TABLE IF NOT EXISTS autoscaler_events (
  id              BIGSERIAL PRIMARY KEY,
  region          TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  node_count      INT,
  queue_depth     INT,
  avg_wait_time   INT,
  gpu_utilization REAL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS autoscaler_events_region_idx ON autoscaler_events (region);
CREATE INDEX IF NOT EXISTS autoscaler_events_created_at_idx ON autoscaler_events (created_at DESC);
