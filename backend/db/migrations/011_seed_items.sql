-- Seed catalogue: 8 consumables, 9 cosmetics, 3 streak freezes (20 total).
-- ON CONFLICT DO NOTHING keeps the file safe to run more than once.

INSERT INTO items (name, type, rarity, price, effect_stat, effect_amount, image_url, category) VALUES
  ('Apple',             'consumable', 'common', 10, 'hunger',       15, '/items/apple.svg',         NULL),
  ('Bread',             'consumable', 'common', 20, 'hunger',       25, '/items/bread.svg',         NULL),
  ('Fish',              'consumable', 'rare',   60, 'hunger',       35, '/items/fish.svg',          NULL),
  ('Carrot',            'consumable', 'common',  5, 'hunger',       10, '/items/carrot.svg',        NULL),
  ('Water',             'consumable', 'common',  8, 'cleanliness',  15, '/items/water.svg',         NULL),
  ('Coffee',            'consumable', 'rare',   50, 'energy',       30, '/items/coffee.svg',        NULL),
  ('Soap',              'consumable', 'common', 25, 'cleanliness',  30, '/items/soap.svg',          NULL),
  ('Toy Ball',          'consumable', 'common', 30, 'happiness',    25, '/items/toy-ball.svg',      NULL),

  ('Beanie Hat',        'cosmetic',   'common',  50, NULL, NULL, '/items/beanie-hat.svg',           'hat'),
  ('Crown',             'cosmetic',   'legendary', 500, NULL, NULL, '/items/crown.svg',             'hat'),
  ('Bow',               'cosmetic',   'common',  40, NULL, NULL, '/items/bow.svg',                  'accessory'),
  ('Round Glasses',     'cosmetic',   'rare',   100, NULL, NULL, '/items/round-glasses.svg',        'glasses'),
  ('Flower',            'cosmetic',   'common',  30, NULL, NULL, '/items/flower.svg',               'accessory'),
  ('Scarf',             'cosmetic',   'common',  50, NULL, NULL, '/items/scarf.svg',                'scarf'),
  ('Star Badge',        'cosmetic',   'rare',   150, NULL, NULL, '/items/star-badge.svg',           'badge'),
  ('Clouds Background', 'cosmetic',   'common',  80, NULL, NULL, '/items/clouds-bg.svg',            'background'),
  ('Hearts Background', 'cosmetic',   'rare',   150, NULL, NULL, '/items/hearts-bg.svg',            'background'),

  ('Spark Shield',      'streak_freeze', 'common',  50, 'streak_freeze_days', 1, '/items/spark-shield.svg',  NULL),
  ('Ember Shield',      'streak_freeze', 'common', 150, 'streak_freeze_days', 3, '/items/ember-shield.svg',  NULL),
  ('Hearth Shield',     'streak_freeze', 'common', 400, 'streak_freeze_days', 7, '/items/hearth-shield.svg', NULL)
ON CONFLICT (name) DO NOTHING;
