INSERT INTO items (name, type, rarity, price, effect_stat, effect_amount, image_url, category) VALUES
  ('Bow',          'cosmetic', 'common',     45, NULL, NULL, '/items/bow.png',          'accessory'),
  ('Cylinder Hat', 'cosmetic', 'common',     55, NULL, NULL, '/items/cylinder-hat.png', 'hat'),
  ('Bow Tie',      'cosmetic', 'common',     60, NULL, NULL, '/items/bow-tie.png',      'scarf'),
  ('Sunglasses',   'cosmetic', 'rare',       95, NULL, NULL, '/items/sunglasses.png',   'glasses'),
  ('Medal',        'cosmetic', 'rare',      120, NULL, NULL, '/items/medal.png',        'badge'),
  ('Wizard Hat',   'cosmetic', 'legendary', 260, NULL, NULL, '/items/wizard-hat.png',   'hat')
ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  rarity = EXCLUDED.rarity,
  price = EXCLUDED.price,
  effect_stat = EXCLUDED.effect_stat,
  effect_amount = EXCLUDED.effect_amount,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

DELETE FROM items
 WHERE type = 'cosmetic'
   AND name NOT IN ('Cylinder Hat', 'Wizard Hat', 'Bow', 'Sunglasses', 'Bow Tie', 'Medal');
