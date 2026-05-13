CREATE TABLE IF NOT EXISTS feedback_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id    UUID REFERENCES habits(id) ON DELETE SET NULL,
  context     TEXT NOT NULL,
  mood        TEXT,
  rating      SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_events_user_created
  ON feedback_events(user_id, created_at DESC);
