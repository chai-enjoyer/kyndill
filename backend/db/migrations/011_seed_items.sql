-- Seed catalogue: 8 consumables, 6 sprite-backed cosmetics, 3 streak freezes (17 total).
-- ON CONFLICT DO NOTHING keeps the file safe to run more than once.

INSERT INTO items (name, type, rarity, price, effect_stat, effect_amount, image_url, category) VALUES
  ('Carrot',            'consumable', 'common',  6, 'hunger',       10, '/items/carrot.svg',        NULL),
  ('Water',             'consumable', 'common',  7, 'cleanliness',  18, '/items/water.svg',         NULL),
  ('Apple',             'consumable', 'common', 10, 'hunger',       18, '/items/apple.svg',         NULL),
  ('Bread',             'consumable', 'common', 16, 'hunger',       30, '/items/bread.svg',         NULL),
  ('Soap',              'consumable', 'common', 18, 'cleanliness',  35, '/items/soap.svg',          NULL),
  ('Toy Ball',          'consumable', 'common', 18, 'happiness',    30, '/items/toy-ball.svg',      NULL),
  ('Coffee',            'consumable', 'rare',   22, 'energy',       28, '/items/coffee.svg',        NULL),
  ('Fish',              'consumable', 'rare',   32, 'hunger',       45, '/items/fish.svg',          NULL),

  ('Bow',               'cosmetic',   'common',  45, NULL, NULL, '/items/bow.png',                  'accessory'),
  ('Cylinder Hat',      'cosmetic',   'common',  55, NULL, NULL, '/items/cylinder-hat.png',         'hat'),
  ('Bow Tie',           'cosmetic',   'common',  60, NULL, NULL, '/items/bow-tie.png',              'scarf'),
  ('Sunglasses',        'cosmetic',   'rare',    95, NULL, NULL, '/items/sunglasses.png',           'glasses'),
  ('Medal',             'cosmetic',   'rare',   120, NULL, NULL, '/items/medal.png',                'badge'),
  ('Wizard Hat',        'cosmetic',   'legendary', 260, NULL, NULL, '/items/wizard-hat.png',        'hat'),

  ('Spark Shield',      'streak_freeze', 'common',  35, 'streak_freeze_days', 1, '/items/spark-shield.svg',  NULL),
  ('Ember Shield',      'streak_freeze', 'common',  95, 'streak_freeze_days', 3, '/items/ember-shield.svg',  NULL),
  ('Hearth Shield',     'streak_freeze', 'common', 180, 'streak_freeze_days', 7, '/items/hearth-shield.svg', NULL)
ON CONFLICT (name) DO NOTHING;
