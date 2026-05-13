import type { PoolClient } from 'pg';
import { SPRITE_BACKED_COSMETIC_NAMES } from './catalog';

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

interface DropRoll {
  type: 'consumable' | 'cosmetic';
  rarity: Rarity;
}

function rollDrop(streak: number): DropRoll | null {
  const safeStreak = Math.max(0, Math.floor(streak));
  const dropChance =
    0.34 +
    (safeStreak >= 3 ? 0.04 : 0) +
    (safeStreak >= 7 ? 0.04 : 0) +
    (safeStreak >= 14 ? 0.05 : 0) +
    (safeStreak >= 30 ? 0.05 : 0);

  if (Math.random() >= dropChance) return null;

  const roll = Math.random();
  if (roll < 0.62) return { type: 'consumable', rarity: 'common' };
  if (roll < 0.80) return { type: 'consumable', rarity: 'rare' };
  if (roll < 0.93) return { type: 'cosmetic', rarity: 'common' };
  if (roll < 0.985) return { type: 'cosmetic', rarity: 'rare' };
  return { type: 'cosmetic', rarity: 'legendary' };
}

export async function rollItemDrop(
  client: PoolClient,
  userId: string,
  habitCategory: string,
  streak: number,
): Promise<DroppedItem | null> {
  const drop = rollDrop(streak);
  if (!drop) return null;

  const item =
    drop.type === 'cosmetic'
      ? await pickCosmeticDrop(client, userId, drop.rarity)
      : await pickConsumableDrop(client, drop.rarity, habitCategory);
  if (!item) return null;

  await client.query(
    `INSERT INTO inventory (user_id, item_id, quantity)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, item_id)
     DO UPDATE SET quantity = inventory.quantity + 1`,
    [userId, item.id],
  );

  return item;
}

async function pickConsumableDrop(
  client: PoolClient,
  rarity: Rarity,
  habitCategory: string,
): Promise<DroppedItem | null> {
  const preferred = preferredConsumables(habitCategory);
  if (preferred.length > 0) {
    const item = await pickConsumableByRarity(client, rarity, preferred);
    if (item) return item;
  }
  return pickConsumableByRarity(client, rarity);
}

async function pickConsumableByRarity(
  client: PoolClient,
  rarity: Rarity,
  preferredNames?: string[],
): Promise<DroppedItem | null> {
  const values: unknown[] = [rarity];
  let nameClause = '';
  if (preferredNames && preferredNames.length > 0) {
    values.push(preferredNames);
    nameClause = 'AND name = ANY($2::text[])';
  }

  const { rows } = await client.query<DroppedItem>(
    `SELECT id, name, type, rarity, effect_stat, effect_amount, image_url, category
       FROM items
      WHERE type = 'consumable'
        AND rarity = $1
        ${nameClause}
      ORDER BY random()
      LIMIT 1`,
    values,
  );
  return rows[0] ?? null;
}

async function pickCosmeticDrop(
  client: PoolClient,
  userId: string,
  rarity: Rarity,
): Promise<DroppedItem | null> {
  const { rows } = await client.query<DroppedItem>(
    `SELECT i.id, i.name, i.type, i.rarity, i.effect_stat, i.effect_amount, i.image_url, i.category
       FROM items i
       LEFT JOIN inventory inv
         ON inv.user_id = $1 AND inv.item_id = i.id AND inv.quantity > 0
      WHERE i.type = 'cosmetic'
        AND i.rarity = $2
        AND i.name = ANY($3::text[])
        AND inv.item_id IS NULL
      ORDER BY random()
      LIMIT 1`,
    [userId, rarity, SPRITE_BACKED_COSMETIC_NAMES],
  );
  return rows[0] ?? null;
}

function preferredConsumables(category: string): string[] {
  switch (category) {
    case 'Health':
      return ['Apple', 'Carrot', 'Water'];
    case 'Productivity':
      return ['Coffee', 'Bread'];
    case 'Social':
      return ['Toy Ball', 'Apple'];
    case 'Learning':
      return ['Coffee', 'Bread'];
    case 'Wellness':
      return ['Water', 'Soap', 'Toy Ball'];
    default:
      return [];
  }
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
