-- Research-grade data collection foundation.
-- Adds a stable research pseudonym per user (joins use this, NOT user_id)
-- and four new tables: analytics_events, mood_pings, onboarding_quiz_responses,
-- research_admins. Plus an opt-in moodPing notification pref.

-- ─── Pseudonyms (safe two-step backfill) ───
ALTER TABLE users ADD COLUMN IF NOT EXISTS research_pseudonym UUID;
UPDATE users SET research_pseudonym = gen_random_uuid() WHERE research_pseudonym IS NULL;
ALTER TABLE users
  ALTER COLUMN research_pseudonym SET NOT NULL,
  ALTER COLUMN research_pseudonym SET DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS users_research_pseudonym_key
  ON users (research_pseudonym);

-- ─── Weekly-mood opt-in pref. Default OFF (opt-in via consent). ───
UPDATE users
   SET notification_prefs = jsonb_set(notification_prefs, '{moodPing}', 'false'::jsonb, TRUE)
 WHERE NOT notification_prefs ? 'moodPing';

-- ─── Lightweight interaction analytics ───
-- BIGSERIAL: events can be high-volume. We never index by uuid here; queries
-- are always (user_id, time) or (event_type, time).
CREATE TABLE IF NOT EXISTS analytics_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  properties  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_user_time   ON analytics_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_time  ON analytics_events (event_type, created_at DESC);

-- ─── Weekly mood ping ───
-- One row per user per ISO-week. UNIQUE constraint prevents double-submission.
CREATE TABLE IF NOT EXISTS mood_pings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_of     DATE NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_of)
);
CREATE INDEX IF NOT EXISTS idx_mood_pings_user_time
  ON mood_pings (user_id, week_of DESC);

-- ─── Onboarding quiz baseline ───
-- One row per user; rewritten if they re-do onboarding. Structured JSONB.
CREATE TABLE IF NOT EXISTS onboarding_quiz_responses (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answers     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Researcher portal admins ───
-- Separate table; NO foreign key to users. Distinct auth surface, distinct
-- credentials. Bootstrap with `npm run admin:create -- email password`.
CREATE TABLE IF NOT EXISTS research_admins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  display_name   TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at  TIMESTAMPTZ
);
