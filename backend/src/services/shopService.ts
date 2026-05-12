import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';

export const STREAK_FREEZE_PRICE = 50;
export const STREAK_FREEZE_MAX = 3;

export interface ShopItem {
  id: string;
  name: string;
  type: 'cosmetic' | 'consumable' | 'streak_freeze';
  rarity: 'common' | 'rare' | 'legendary';
  price: number;
  effect_stat: string | null;
  effect_amount: number | null;
  image_url: string | null;
  category: string | null;
}

export interface ShopCosmetic extends ShopItem {
  owned: boolean;
}

export interface ShopListing {
  coins: number;
  freeze_count: number;
  items: {
    consumable: ShopItem[];
    cosmetic: ShopCosmetic[];
    streak_freeze: ShopItem[];
  };
}

export async function listShop(userId: string): Promise<ShopListing> {
  const [{ rows: items }, { rows: userRows }, { rows: ownedRows }, { rows: streakRows }] = await Promise.all([
    pool.query<ShopItem>(
      `SELECT id, name, type, rarity, price, effect_stat, effect_amount, image_url, category
         FROM items
        ORDER BY type ASC, price ASC, name ASC`,
    ),
    pool.query<{ coins: number }>(`SELECT coins FROM users WHERE id = $1`, [userId]),
    pool.query<{ item_id: string }>(
      `SELECT DISTINCT item_id FROM inventory WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{ freeze_count: number }>(
      `SELECT freeze_count FROM streaks WHERE user_id = $1`,
      [userId],
    ),
  ]);

  if (userRows.length === 0) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User does not exist');
  }

  const owned = new Set(ownedRows.map((r) => r.item_id));
  const listing: ShopListing = {
    coins: userRows[0].coins,
    freeze_count: streakRows[0]?.freeze_count ?? 0,
    items: { consumable: [], cosmetic: [], streak_freeze: [] },
  };

  for (const item of items) {
    if (item.type === 'cosmetic') {
      listing.items.cosmetic.push({ ...item, owned: owned.has(item.id) });
    } else if (item.type === 'consumable') {
      listing.items.consumable.push(item);
    } else {
      listing.items.streak_freeze.push(item);
    }
  }

  return listing;
}

export interface PurchaseResult {
  new_coin_balance: number;
  item: ShopItem;
}

export async function purchaseItem(userId: string, itemId: string): Promise<PurchaseResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: itemRows } = await client.query<ShopItem>(
      `SELECT id, name, type, rarity, price, effect_stat, effect_amount, image_url, category
         FROM items WHERE id = $1`,
      [itemId],
    );
    if (itemRows.length === 0) {
      throw new HttpError(404, 'ITEM_NOT_FOUND', 'Item does not exist');
    }
    const item = itemRows[0];

    const { rows: userRows } = await client.query<{ coins: number }>(
      `SELECT coins FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (userRows.length === 0) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User does not exist');
    }

    const currentCoins = userRows[0].coins;
    if (currentCoins < item.price) {
      throw new HttpError(
        402,
        'INSUFFICIENT_COINS',
        `Need ${item.price} coins; current balance is ${currentCoins}`,
      );
    }

    const newCoins = currentCoins - item.price;
    await client.query(`UPDATE users SET coins = $1 WHERE id = $2`, [newCoins, userId]);

    await client.query(
      `INSERT INTO inventory (user_id, item_id, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, item_id)
       DO UPDATE SET quantity = inventory.quantity + 1`,
      [userId, itemId],
    );

    await client.query('COMMIT');
    return { new_coin_balance: newCoins, item };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface BuyFreezeResult {
  new_freeze_count: number;
  new_coin_balance: number;
}

export async function buyStreakFreeze(userId: string): Promise<BuyFreezeResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query<{ coins: number }>(
      `SELECT coins FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (userRows.length === 0) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'User does not exist');
    }
    const currentCoins = userRows[0].coins;

    const { rows: streakRows } = await client.query<{ freeze_count: number }>(
      `SELECT freeze_count FROM streaks WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    if (streakRows.length === 0) {
      throw new Error(`Streaks row missing for user ${userId}`);
    }
    const currentFreeze = streakRows[0].freeze_count;

    if (currentFreeze >= STREAK_FREEZE_MAX) {
      throw new HttpError(
        409,
        'FREEZE_LIMIT_REACHED',
        `You already have the maximum of ${STREAK_FREEZE_MAX} streak freezes`,
      );
    }
    if (currentCoins < STREAK_FREEZE_PRICE) {
      throw new HttpError(
        402,
        'INSUFFICIENT_COINS',
        `Need ${STREAK_FREEZE_PRICE} coins; current balance is ${currentCoins}`,
      );
    }

    const newCoins = currentCoins - STREAK_FREEZE_PRICE;
    const newFreeze = currentFreeze + 1;

    await client.query(`UPDATE users SET coins = $1 WHERE id = $2`, [newCoins, userId]);
    await client.query(
      `UPDATE streaks SET freeze_count = $1 WHERE user_id = $2`,
      [newFreeze, userId],
    );

    await client.query('COMMIT');
    return { new_freeze_count: newFreeze, new_coin_balance: newCoins };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
