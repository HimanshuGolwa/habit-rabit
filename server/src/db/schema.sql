-- ── HABIT RABIT DATABASE SCHEMA ─────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── REFRESH TOKENS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(512) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER PREFERENCES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_prefs (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  use_weather    BOOLEAN DEFAULT TRUE,
  use_time       BOOLEAN DEFAULT TRUE,
  remind_enabled BOOLEAN DEFAULT FALSE,
  remind_time    VARCHAR(5) DEFAULT '08:00',
  def_energy     VARCHAR(20),
  def_area       VARCHAR(100),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── CUSTOM AREAS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS areas (
  id         VARCHAR(100) NOT NULL,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      VARCHAR(50) NOT NULL,
  icon       TEXT,
  context    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- ── HABITS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id         VARCHAR(100) NOT NULL,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(10),
  area_id    VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- ── HABIT LOGS (one row per completed day) ────────────
CREATE TABLE IF NOT EXISTS habit_logs (
  habit_id   VARCHAR(100) NOT NULL,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date   DATE NOT NULL,
  PRIMARY KEY (habit_id, user_id, log_date)
);

-- ── HABIT NOTES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   VARCHAR(100) NOT NULL,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  energy     VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DAILY INTENTIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS intentions (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intention_date DATE NOT NULL,
  text           TEXT NOT NULL,
  PRIMARY KEY (user_id, intention_date)
);

-- ── INDEXES ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user  ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user      ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit     ON habit_logs(habit_id, user_id);
CREATE INDEX IF NOT EXISTS idx_habit_notes_habit    ON habit_notes(habit_id, user_id);
CREATE INDEX IF NOT EXISTS idx_intentions_user      ON intentions(user_id);
