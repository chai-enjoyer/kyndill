ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS last_decay_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE pets
   SET last_decay_at = created_at
 WHERE last_decay_at IS NULL;
