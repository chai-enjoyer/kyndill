CREATE TABLE habits (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  description            TEXT,
  category               TEXT NOT NULL
                         CHECK (category IN ('Health', 'Productivity', 'Social', 'Learning', 'Wellness')),
  frequency              TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  days_of_week           JSONB,
  completion_start_time  TIME,
  completion_end_time    TIME,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order             INTEGER NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    completion_start_time IS NULL
    OR completion_end_time IS NULL
    OR completion_start_time < completion_end_time
  )
);
