-- User-curated short wishlist of consumables and streak freezes. Friends see
-- it on the friend profile and can choose to gift those items. Capped at 3
-- entries per user via partial-unique-index trick (PK on (user_id, position)
-- with position in [1..3]) so the API stays simple.

CREATE TABLE IF NOT EXISTS user_wishlists (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position   SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 3),
  item_id    UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, position),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wishlists_item ON user_wishlists (item_id);
