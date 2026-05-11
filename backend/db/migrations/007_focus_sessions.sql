CREATE TABLE focus_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0),
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rating            SMALLINT CHECK (rating BETWEEN 1 AND 5)
);
