-- ── Frasberg Carjack — PostgreSQL schema ──────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS player_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(32) NOT NULL UNIQUE,
  email         VARCHAR(255) UNIQUE,
  password_hash TEXT,
  display_name  VARCHAR(64),
  money         BIGINT NOT NULL DEFAULT 0,
  xp            BIGINT NOT NULL DEFAULT 0,
  level         INT    NOT NULL DEFAULT 1,
  total_carjacks INT   NOT NULL DEFAULT 0,
  total_missions INT   NOT NULL DEFAULT 0,
  banned        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS save_slots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  slot       SMALLINT NOT NULL DEFAULT 0,
  data       JSONB NOT NULL DEFAULT '{}',
  version    INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, slot)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID REFERENCES player_profiles(id) ON DELETE SET NULL,
  room_id     VARCHAR(64) NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  score       BIGINT NOT NULL DEFAULT 0,
  carjacks    INT NOT NULL DEFAULT 0,
  missions_completed INT NOT NULL DEFAULT 0,
  max_wanted_level   SMALLINT NOT NULL DEFAULT 0,
  client_type VARCHAR(16) NOT NULL DEFAULT 'web'  -- web | desktop | mobile
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id         BIGSERIAL PRIMARY KEY,
  player_id  UUID REFERENCES player_profiles(id) ON DELETE CASCADE,
  player_name VARCHAR(64) NOT NULL,
  score      BIGINT NOT NULL,
  stats      JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_player   ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_room     ON game_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_saves_player      ON save_slots(player_id);

CREATE OR REPLACE VIEW leaderboard_global AS
  SELECT player_name, MAX(score) AS best_score, COUNT(*) AS runs
  FROM leaderboard_entries
  GROUP BY player_name
  ORDER BY best_score DESC
  LIMIT 100;
