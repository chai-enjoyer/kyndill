CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT,
  display_name          TEXT NOT NULL,
  username              TEXT NOT NULL UNIQUE,
  bio                   TEXT,
  avatar_url            TEXT,
  level                 INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp                    INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  coins                 INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  streak_current        INTEGER NOT NULL DEFAULT 0 CHECK (streak_current >= 0),
  streak_longest        INTEGER NOT NULL DEFAULT 0 CHECK (streak_longest >= 0),
  last_completion_date  DATE,
  visibility            TEXT NOT NULL DEFAULT 'private'
                        CHECK (visibility IN ('public', 'friends', 'private')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
