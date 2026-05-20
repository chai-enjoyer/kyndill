-- Daily reminder for users with incomplete habits.
-- `reminder_hour` is the local-time hour (0-23) when the nudge should fire;
-- NULL means "no daily reminder". `reminder_timezone` is an IANA name
-- captured from the client (defaults to UTC for legacy rows).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reminder_hour      SMALLINT CHECK (reminder_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS reminder_timezone  TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS last_reminder_sent DATE;

-- New reminder preference toggle. Existing users get the default on; turning
-- the toggle off keeps the row but suppresses delivery in cron + push filter.
UPDATE users
   SET notification_prefs = jsonb_set(
     notification_prefs,
     '{dailyReminder}',
     'true'::jsonb,
     TRUE
   )
 WHERE NOT notification_prefs ? 'dailyReminder';
