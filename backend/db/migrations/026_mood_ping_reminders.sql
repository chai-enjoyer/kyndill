-- Tracks the last calendar date a weekly mood-ping push was delivered, so
-- the hourly cron tick can't double-fire across timezones or restarts.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_mood_ping_sent DATE;
