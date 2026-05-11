CREATE TABLE items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  type           TEXT NOT NULL CHECK (type IN ('cosmetic', 'consumable', 'streak_freeze')),
  rarity         TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'legendary')),
  price          INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  effect_stat    TEXT,
  effect_amount  INTEGER,
  image_url      TEXT,
  category       TEXT
);

CREATE TABLE inventory (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id   UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity  INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE equipped_cosmetics (
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id  UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  slot     TEXT NOT NULL CHECK (slot IN ('hat', 'accessory', 'background')),
  PRIMARY KEY (user_id, slot)
);
