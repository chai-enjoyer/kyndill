import type { PoolClient } from 'pg';

export type Rarity = 'common' | 'rare' | 'legendary';

export interface DroppedItem {
  id: string;
  name: string;
  type: 'cosmetic' | 'consumable' | 'streak_freeze';
  rarity: Rarity;
  effect_stat: string | null;
  effect_amount: number | null;
  image_url: string | null;
  category: string | null;
}

// Pure rarity roll: 3% legendary, 12% rare, 45% common, 40% none by default.
// Streak bonuses widen the windows: 14+ days adds +0.05 to rare; 30+ adds +0.02 to legendary.
function rollRarity(streak: number): Rarity | null {
  let legendaryThreshold = 0.03;
  let rareThreshold = 0.15;
  const commonThreshold = 0.6;

  if (streak >= 30) legendaryThreshold += 0.02;
  if (streak >= 14) rareThreshold += 0.05;

  const roll = Math.random();
  if (roll < legendaryThreshold) return 'legendary';
  if (roll < rareThreshold) return 'rare';
  if (roll < commonThreshold) return 'common';
  return null;
}

export async function rollItemDrop(
  client: PoolClient,
  userId: string,
  _habitCategory: string,
  streak: number,
): Promise<DroppedItem | null> {
  const rarity = rollRarity(streak);
  if (!rarity) return null;

  const { rows } = await client.query<DroppedItem>(
    `SELECT id, name, type, rarity, effect_stat, effect_amount, image_url, category
       FROM items
      WHERE rarity = $1
      ORDER BY random()
      LIMIT 1`,
    [rarity],
  );

  if (rows.length === 0) return null;
  const item = rows[0];

  await client.query(
    `INSERT INTO inventory (user_id, item_id, quantity)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, item_id)
     DO UPDATE SET quantity = inventory.quantity + 1`,
    [userId, item.id],
  );

  return item;
}

// Placeholders kept for future per-source reward flows; routes don't call them yet.
export async function awardForCompletion(_userId: string, _habitId: string): Promise<never> {
  throw new Error('rewardService.awardForCompletion not implemented');
}

export async function awardForFocusSession(_userId: string, _sessionId: string): Promise<never> {
  throw new Error('rewardService.awardForFocusSession not implemented');
}

export async function grantItem(
  _userId: string,
  _itemId: string,
  _quantity: number = 1,
): Promise<never> {
  throw new Error('rewardService.grantItem not implemented');
}
