CREATE TABLE pets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  species                 TEXT NOT NULL DEFAULT 'blob'
                          CHECK (species IN ('blob', 'cube', 'sphere', 'pyramid')),
  name                    TEXT NOT NULL DEFAULT 'Kyndill',
  health                  INTEGER NOT NULL DEFAULT 100 CHECK (health BETWEEN 0 AND 100),
  happiness               INTEGER NOT NULL DEFAULT 100 CHECK (happiness BETWEEN 0 AND 100),
  hunger                  INTEGER NOT NULL DEFAULT 100 CHECK (hunger BETWEEN 0 AND 100),
  energy                  INTEGER NOT NULL DEFAULT 100 CHECK (energy BETWEEN 0 AND 100),
  cleanliness             INTEGER NOT NULL DEFAULT 100 CHECK (cleanliness BETWEEN 0 AND 100),
  stage                   SMALLINT NOT NULL DEFAULT 1 CHECK (stage IN (1, 2, 3)),
  total_habits_completed  INTEGER NOT NULL DEFAULT 0 CHECK (total_habits_completed >= 0),
  is_fainted              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
