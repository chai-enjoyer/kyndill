ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT
    '{"friendRequests": true, "gifts": true, "focusReminders": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS research_consent BOOLEAN NOT NULL DEFAULT FALSE;
