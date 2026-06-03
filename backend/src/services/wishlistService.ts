import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';

// A short list (max 3) of giftable items a user wants to receive. Visible to
// friends on the friend profile, where they can be sent through the existing
// gift flow.

export interface WishlistEntry {
  position: number;
  item_id: string;
  name: string;
  type: 'consumable' | 'streak_freeze';
  rarity: 'common' | 'rare' | 'legendary';
  image_url: string | null;
  effect_stat: string | null;
  effect_amount: number | null;
}

const WISHLIST_MAX = 3;

export async function getOwn(userId: string): Promise<WishlistEntry[]> {
  return query(userId);
}

export async function getForFriend(viewerId: string, friendId: string): Promise<WishlistEntry[]> {
  // Friendship is the access gate. We don't expose wishlists to strangers.
  const { rows } = await pool.query(
    `SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2`,
    [viewerId, friendId],
  );
  if (rows.length === 0) {
    throw new HttpError(404, 'NOT_FRIENDS', 'Wishlist is not available');
  }
  return query(friendId);
}

export async function set(userId: string, itemIds: string[]): Promise<WishlistEntry[]> {
  if (itemIds.length > WISHLIST_MAX) {
    throw new HttpError(400, 'WISHLIST_TOO_LONG', `Wishlist can hold at most ${WISHLIST_MAX} items`);
  }
  // De-dupe while preserving order - the position is determined by the input
  // order so the user controls priority.
  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const id of itemIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }

  if (ordered.length > 0) {
    const { rows: typeRows } = await pool.query<{ id: string; type: string }>(
      `SELECT id, type FROM items WHERE id = ANY($1::uuid[])`,
      [ordered],
    );
    if (typeRows.length !== ordered.length) {
      throw new HttpError(400, 'INVALID_ITEM', 'One or more items do not exist');
    }
    for (const row of typeRows) {
      if (row.type !== 'consumable' && row.type !== 'streak_freeze') {
        throw new HttpError(400, 'INVALID_ITEM', 'Only giftable items can be wishlisted');
      }
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM user_wishlists WHERE user_id = $1`, [userId]);
    for (let i = 0; i < ordered.length; i += 1) {
      await client.query(
        `INSERT INTO user_wishlists (user_id, position, item_id)
         VALUES ($1, $2, $3)`,
        [userId, i + 1, ordered[i]],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return query(userId);
}

async function query(userId: string): Promise<WishlistEntry[]> {
  const { rows } = await pool.query<WishlistEntry>(
    `SELECT w.position,
            w.item_id,
            i.name,
            i.type,
            i.rarity,
            i.image_url,
            i.effect_stat,
            i.effect_amount
       FROM user_wishlists w
       JOIN items i ON i.id = w.item_id
      WHERE w.user_id = $1
      ORDER BY w.position ASC`,
    [userId],
  );
  return rows;
}
