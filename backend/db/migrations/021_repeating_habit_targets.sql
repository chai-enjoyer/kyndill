ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS target_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE habits
  DROP CONSTRAINT IF EXISTS habits_target_count_check;

ALTER TABLE habits
  ADD CONSTRAINT habits_target_count_check
  CHECK (target_count BETWEEN 1 AND 24);

ALTER TABLE habit_completions
  ADD COLUMN IF NOT EXISTS completion_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS target_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE habit_completions
  DROP CONSTRAINT IF EXISTS habit_completions_completion_count_check,
  DROP CONSTRAINT IF EXISTS habit_completions_target_count_check;

ALTER TABLE habit_completions
  ADD CONSTRAINT habit_completions_completion_count_check
  CHECK (completion_count >= 1),
  ADD CONSTRAINT habit_completions_target_count_check
  CHECK (target_count BETWEEN 1 AND 24);
