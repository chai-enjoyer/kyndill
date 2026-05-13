ALTER TABLE users
  ALTER COLUMN coins SET DEFAULT 20;

UPDATE users u
   SET coins = 20
 WHERE u.coins < 20
   AND NOT EXISTS (
     SELECT 1
       FROM habit_completions hc
      WHERE hc.user_id = u.id
   )
   AND NOT EXISTS (
     SELECT 1
       FROM focus_sessions fs
      WHERE fs.user_id = u.id
   );

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
  END
WHERE name IN (
  'Carrot', 'Water', 'Apple', 'Bread', 'Soap', 'Toy Ball', 'Coffee', 'Fish',
  'Bow', 'Cylinder Hat', 'Bow Tie', 'Sunglasses', 'Medal', 'Wizard Hat',
  'Spark Shield', 'Ember Shield', 'Hearth Shield'
);
