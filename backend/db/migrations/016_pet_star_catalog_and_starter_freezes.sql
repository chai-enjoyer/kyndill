ALTER TABLE pets
  DROP CONSTRAINT IF EXISTS pets_species_check;

UPDATE pets
   SET species = 'star'
 WHERE species = 'blob';

ALTER TABLE pets
  ALTER COLUMN species SET DEFAULT 'star',
  ADD CONSTRAINT pets_species_check
  CHECK (species IN ('star', 'cube', 'sphere', 'pyramid'));

ALTER TABLE streaks
  ALTER COLUMN freeze_count SET DEFAULT 2;

UPDATE streaks
   SET freeze_count = 2
 WHERE freeze_count < 2;

CREATE OR REPLACE FUNCTION fn_init_user_resources()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pets (user_id, species, name)
  VALUES (NEW.id, 'star', 'Kyndill');

  INSERT INTO streaks (user_id, freeze_count)
  VALUES (NEW.id, 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE items
   SET name = 'Cylinder Hat',
       image_url = '/items/cylinder-hat.png',
       category = 'hat'
 WHERE name = 'Beanie Hat'
   AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Cylinder Hat');

UPDATE items
   SET name = 'Wizard Hat',
       image_url = '/items/wizard-hat.png',
       category = 'hat'
 WHERE name = 'Crown'
   AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Wizard Hat');

UPDATE items
   SET name = 'Sunglasses',
       image_url = '/items/sunglasses.png',
       category = 'glasses'
 WHERE name = 'Round Glasses'
   AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Sunglasses');

UPDATE items
   SET name = 'Bow Tie',
       image_url = '/items/bow-tie.png',
       category = 'scarf'
 WHERE name = 'Scarf'
   AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Bow Tie');

UPDATE items
   SET name = 'Medal',
       image_url = '/items/medal.png',
       category = 'badge'
 WHERE name = 'Star Badge'
   AND NOT EXISTS (SELECT 1 FROM items WHERE name = 'Medal');

DELETE FROM items
 WHERE name IN ('Flower', 'Beanie Hat', 'Crown', 'Round Glasses', 'Scarf', 'Star Badge');
