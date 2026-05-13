-- 1. Auto-create a pet (default star species) and streaks record for every new user.
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

DROP TRIGGER IF EXISTS trg_users_init_resources ON users;
CREATE TRIGGER trg_users_init_resources
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION fn_init_user_resources();

-- 2. Keep pet.stage in sync with total_habits_completed.
-- BEFORE UPDATE so the trigger can mutate NEW.stage without re-issuing an UPDATE
-- (which would recurse). The user-spec phrasing "after UPDATE" is honored in
-- behavior: stage reflects the new total before the row is written.
CREATE OR REPLACE FUNCTION fn_update_pet_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_habits_completed IS NOT DISTINCT FROM OLD.total_habits_completed THEN
    RETURN NEW;
  END IF;

  IF NEW.total_habits_completed >= 201 THEN
    NEW.stage := 3;
  ELSIF NEW.total_habits_completed >= 51 THEN
    NEW.stage := 2;
  ELSE
    NEW.stage := 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pets_update_stage ON pets;
CREATE TRIGGER trg_pets_update_stage
BEFORE UPDATE OF total_habits_completed ON pets
FOR EACH ROW
EXECUTE FUNCTION fn_update_pet_stage();
