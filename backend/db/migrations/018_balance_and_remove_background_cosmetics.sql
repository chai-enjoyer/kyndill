UPDATE items SET
  price = CASE name
    WHEN 'Carrot' THEN 6
    WHEN 'Water' THEN 7
    WHEN 'Apple' THEN 10
    WHEN 'Bread' THEN 16
    WHEN 'Soap' THEN 18
    WHEN 'Toy Ball' THEN 18
    WHEN 'Coffee' THEN 22
    WHEN 'Fish' THEN 32
    WHEN 'Bow' THEN 45
    WHEN 'Cylinder Hat' THEN 55
    WHEN 'Bow Tie' THEN 60
    WHEN 'Sunglasses' THEN 95
    WHEN 'Medal' THEN 120
    WHEN 'Wizard Hat' THEN 260
    WHEN 'Spark Shield' THEN 35
    WHEN 'Ember Shield' THEN 95
    WHEN 'Hearth Shield' THEN 180
    ELSE price
  END,
  effect_amount = CASE name
    WHEN 'Carrot' THEN 10
    WHEN 'Water' THEN 18
    WHEN 'Apple' THEN 18
    WHEN 'Bread' THEN 30
    WHEN 'Soap' THEN 35
    WHEN 'Toy Ball' THEN 30
    WHEN 'Coffee' THEN 28
    WHEN 'Fish' THEN 45
    ELSE effect_amount
  END
WHERE name IN (
  'Carrot', 'Water', 'Apple', 'Bread', 'Soap', 'Toy Ball', 'Coffee', 'Fish',
  'Bow', 'Cylinder Hat', 'Bow Tie', 'Sunglasses', 'Medal', 'Wizard Hat',
  'Spark Shield', 'Ember Shield', 'Hearth Shield'
);

DELETE FROM equipped_cosmetics
 WHERE slot = 'background';

DELETE FROM inventory inv
 USING items i
 WHERE inv.item_id = i.id
   AND i.type = 'cosmetic'
   AND i.category = 'background';

DELETE FROM items
 WHERE type = 'cosmetic'
   AND category = 'background';

ALTER TABLE equipped_cosmetics
  DROP CONSTRAINT IF EXISTS equipped_cosmetics_slot_check;

ALTER TABLE equipped_cosmetics
  ADD CONSTRAINT equipped_cosmetics_slot_check
  CHECK (slot IN ('hat', 'accessory', 'glasses', 'scarf', 'badge', 'charm'));
