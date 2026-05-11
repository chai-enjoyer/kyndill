ALTER TABLE users
  ADD COLUMN oauth_provider TEXT,
  ADD COLUMN oauth_id       TEXT;

ALTER TABLE users
  ADD CONSTRAINT users_oauth_provider_check
    CHECK (oauth_provider IS NULL OR oauth_provider IN ('google'));

-- Composite UNIQUE: NULLs are distinct in Postgres unique constraints, so
-- local-credentials accounts (both columns NULL) coexist freely; only filled
-- OAuth pairs are constrained to be unique.
ALTER TABLE users
  ADD CONSTRAINT users_oauth_unique UNIQUE (oauth_provider, oauth_id);
