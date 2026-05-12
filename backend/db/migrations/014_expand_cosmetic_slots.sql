ALTER TABLE equipped_cosmetics
  DROP CONSTRAINT IF EXISTS equipped_cosmetics_slot_check;

ALTER TABLE equipped_cosmetics
  ADD CONSTRAINT equipped_cosmetics_slot_check
  CHECK (slot IN ('hat', 'accessory', 'background', 'glasses', 'scarf', 'badge', 'charm'));

UPDATE items SET category = 'glasses' WHERE name = 'Round Glasses';
UPDATE items SET category = 'scarf' WHERE name = 'Scarf';
UPDATE items SET category = 'badge' WHERE name = 'Star Badge';
