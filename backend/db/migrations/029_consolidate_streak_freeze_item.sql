-- Three "Shield" rows (Spark/Ember/Hearth) were seeded in 011 but never
-- meaningfully differentiated: the freeze system uses streaks.freeze_count
-- with a uniform +1, and the regular shop only buys via buyStreakFreeze
-- (hardcoded price 35, no item lookup). The result was three visually
-- distinct SKUs that all did the same thing, surfacing as duplicates in the
-- wishlist picker and friend-gift modal.
--
-- This migration consolidates them into one canonical "Streak Freeze" item
-- while preserving any references that already exist in production.

-- Step 1: rename Spark Shield (the cheapest/canonical-priced one) to
-- "Streak Freeze". UUID stays put so existing inventory / gifts / wishlist
-- rows pointing at Spark Shield need no rewrite.
UPDATE items
   SET name = 'Streak Freeze',
       price = 35,
       effect_amount = 1
 WHERE name = 'Spark Shield';

-- Step 2a: gifts table has no unique constraint on item_id, simple update.
UPDATE gifts
   SET item_id = (SELECT id FROM items WHERE name = 'Streak Freeze')
 WHERE item_id IN (SELECT id FROM items WHERE name IN ('Ember Shield', 'Hearth Shield'));

-- Step 2b: inventory. UNIQUE(user_id, item_id) means we can't just UPDATE if
-- the user already holds the canonical. So:
--   - merge loser quantities into existing canonical rows
--   - insert a canonical row for users who held only losers
--   - delete the loser rows
UPDATE inventory canon
   SET quantity = canon.quantity + loser_sum.total
  FROM (
    SELECT inv.user_id, SUM(inv.quantity)::int AS total
      FROM inventory inv
      JOIN items i ON i.id = inv.item_id
     WHERE i.name IN ('Ember Shield', 'Hearth Shield')
     GROUP BY inv.user_id
  ) loser_sum
 WHERE canon.user_id = loser_sum.user_id
   AND canon.item_id = (SELECT id FROM items WHERE name = 'Streak Freeze');

INSERT INTO inventory (user_id, item_id, quantity)
SELECT inv.user_id,
       (SELECT id FROM items WHERE name = 'Streak Freeze'),
       SUM(inv.quantity)::int
  FROM inventory inv
  JOIN items i ON i.id = inv.item_id
 WHERE i.name IN ('Ember Shield', 'Hearth Shield')
   AND NOT EXISTS (
     SELECT 1 FROM inventory canon
      WHERE canon.user_id = inv.user_id
        AND canon.item_id = (SELECT id FROM items WHERE name = 'Streak Freeze')
   )
 GROUP BY inv.user_id;

DELETE FROM inventory
 WHERE item_id IN (SELECT id FROM items WHERE name IN ('Ember Shield', 'Hearth Shield'));

-- Step 2c: wishlists. UNIQUE(user_id, item_id) — same trick: update where the
-- canonical isn't already on that user's list, then delete the rest as dupes.
UPDATE user_wishlists w
   SET item_id = (SELECT id FROM items WHERE name = 'Streak Freeze')
 WHERE w.item_id IN (SELECT id FROM items WHERE name IN ('Ember Shield', 'Hearth Shield'))
   AND NOT EXISTS (
     SELECT 1 FROM user_wishlists w2
      WHERE w2.user_id = w.user_id
        AND w2.item_id = (SELECT id FROM items WHERE name = 'Streak Freeze')
   );

DELETE FROM user_wishlists
 WHERE item_id IN (SELECT id FROM items WHERE name IN ('Ember Shield', 'Hearth Shield'));

-- Step 3: drop the now-orphan SKUs.
DELETE FROM items
 WHERE name IN ('Ember Shield', 'Hearth Shield');
