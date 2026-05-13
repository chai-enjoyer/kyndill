CREATE TABLE habit_completions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id      UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_on  DATE NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_count INTEGER NOT NULL DEFAULT 1 CHECK (completion_count >= 1),
  target_count  INTEGER NOT NULL DEFAULT 1 CHECK (target_count BETWEEN 1 AND 24),
  xp_earned     INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  coins_earned  INTEGER NOT NULL DEFAULT 0 CHECK (coins_earned >= 0),
  UNIQUE (habit_id, user_id, completed_on)
);

CREATE TABLE streaks (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak        INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak        INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  freeze_count          SMALLINT NOT NULL DEFAULT 2 CHECK (freeze_count BETWEEN 0 AND 3),
  last_completion_date  DATE
);
