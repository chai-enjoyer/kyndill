import { pool } from '../db/pool';
import { isSpriteBackedCosmetic } from './catalog';

export interface InventoryEntry {
  id: string;
  name: string;
  type: 'cosmetic' | 'consumable' | 'streak_freeze';
  rarity: 'common' | 'rare' | 'legendary';
  price: number;
  effect_stat: string | null;
  effect_amount: number | null;
  image_url: string | null;
  category: string | null;
  quantity: number;
  equipped_slot: string | null;
}

export interface InventoryListing {
  consumables: InventoryEntry[];
  cosmetics: InventoryEntry[];
  streak_freezes: InventoryEntry[];
}

export async function listForUser(userId: string): Promise<InventoryListing> {
  const { rows } = await pool.query<InventoryEntry>(
    `SELECT i.id, i.name, i.type, i.rarity, i.price, i.effect_stat, i.effect_amount,
            i.image_url, i.category, inv.quantity, ec.slot AS equipped_slot
       FROM inventory inv
       JOIN items i ON i.id = inv.item_id
  LEFT JOIN equipped_cosmetics ec
         ON ec.user_id = inv.user_id AND ec.item_id = inv.item_id
      WHERE inv.user_id = $1
      ORDER BY i.type ASC, i.rarity DESC, i.name ASC`,
    [userId],
  );

  const listing: InventoryListing = {
    consumables: [],
    cosmetics: [],
    streak_freezes: [],
  };

  for (const entry of rows) {
    if (entry.type === 'consumable') listing.consumables.push(entry);
    else if (entry.type === 'cosmetic' && isSpriteBackedCosmetic(entry.name)) listing.cosmetics.push(entry);
    else if (entry.type === 'streak_freeze') listing.streak_freezes.push(entry);
  }

  return listing;
}
