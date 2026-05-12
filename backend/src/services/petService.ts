import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';

const PET_STAT_COLUMNS = ['health', 'happiness', 'hunger', 'energy', 'cleanliness'] as const;
type PetStat = (typeof PET_STAT_COLUMNS)[number];
const ALLOWED_STATS: ReadonlySet<string> = new Set(PET_STAT_COLUMNS);

export const EQUIP_SLOTS = [
  'hat',
  'accessory',
  'background',
  'glasses',
  'scarf',
  'badge',
  'charm',
] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export const PET_SPECIES = ['blob', 'cube', 'sphere', 'pyramid'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export interface PetRow {
  id: string;
  user_id: string;
  species: PetSpecies;
  name: string;
  health: number;
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  stage: number;
  total_habits_completed: number;
  is_fainted: boolean;
  initialized_at: string | null;
  created_at: string;
}

export interface EquippedItem {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  image_url: string | null;
}

export type EquippedMap = Partial<Record<EquipSlot, EquippedItem>>;

export interface PetFullState extends PetRow {
  equipped: EquippedMap;
}

export interface PetCompletionEffect {
  total_habits_completed: number;
  health: number;
  stage: number;
  is_fainted: boolean;
}

const PET_COLUMNS = `
  id, user_id, species, name, health, happiness, hunger, energy, cleanliness,
  stage, total_habits_completed, is_fainted, initialized_at, created_at
`;

// ============================================================
// Read full state with equipped cosmetics
// ============================================================

export async function getFullState(userId: string): Promise<PetFullState> {
  const { rows: pets } = await pool.query<PetRow>(
    `SELECT ${PET_COLUMNS} FROM pets WHERE user_id = $1`,
    [userId],
  );
  if (pets.length === 0) {
    throw new HttpError(404, 'PET_NOT_FOUND', 'Pet does not exist');
  }

  return { ...pets[0], equipped: await getEquipped(userId) };
}

async function getEquipped(userId: string): Promise<EquippedMap> {
  const { rows } = await pool.query<{
    slot: EquipSlot;
    item_id: string;
    name: string;
    rarity: 'common' | 'rare' | 'legendary';
    image_url: string | null;
  }>(
    `SELECT ec.slot, ec.item_id, i.name, i.rarity, i.image_url
       FROM equipped_cosmetics ec
       JOIN items i ON i.id = ec.item_id
      WHERE ec.user_id = $1`,
    [userId],
  );

  const equipped: EquippedMap = {};
  for (const row of rows) {
    equipped[row.slot] = {
      id: row.item_id,
      name: row.name,
      rarity: row.rarity,
      image_url: row.image_url,
    };
  }
  return equipped;
}

// ============================================================
// Initialize: pick a species and name; marks onboarding complete.
// Idempotent guard: 409 if already initialized.
// ============================================================

export async function initialize(
  userId: string,
  species: PetSpecies,
  name: string,
): Promise<PetRow> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 20) {
    throw new HttpError(400, 'INVALID_NAME', 'Name must be 1..20 characters');
  }

  const { rows } = await pool.query<PetRow>(
    `UPDATE pets
        SET species = $1,
            name = $2,
            initialized_at = NOW()
      WHERE user_id = $3 AND initialized_at IS NULL
      RETURNING ${PET_COLUMNS}`,
    [species, trimmed, userId],
  );

  if (rows.length === 0) {
    const { rows: existing } = await pool.query<{ initialized_at: string | null }>(
      `SELECT initialized_at FROM pets WHERE user_id = $1`,
      [userId],
    );
    if (existing.length === 0) {
      throw new HttpError(404, 'PET_NOT_FOUND', 'Pet does not exist');
    }
    throw new HttpError(409, 'ALREADY_INITIALIZED', 'Pet has already been initialized');
  }

  return rows[0];
}

// ============================================================
// Feed (consume a consumable from inventory)
// ============================================================

export async function feed(userId: string, itemId: string): Promise<PetRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: invRows } = await client.query<{
      quantity: number;
      type: string;
      effect_stat: string | null;
      effect_amount: number | null;
    }>(
      `SELECT inv.quantity, i.type, i.effect_stat, i.effect_amount
         FROM inventory inv
         JOIN items i ON i.id = inv.item_id
        WHERE inv.user_id = $1 AND inv.item_id = $2
        FOR UPDATE OF inv`,
      [userId, itemId],
    );

    if (invRows.length === 0 || invRows[0].quantity < 1) {
      throw new HttpError(404, 'NOT_IN_INVENTORY', 'Item not in inventory');
    }

    const inv = invRows[0];
    if (inv.type !== 'consumable') {
      throw new HttpError(400, 'NOT_CONSUMABLE', 'Item is not a consumable');
    }
    if (!inv.effect_stat || inv.effect_amount === null) {
      throw new HttpError(400, 'INVALID_ITEM', 'Consumable is missing effect data');
    }
    if (!ALLOWED_STATS.has(inv.effect_stat)) {
      throw new HttpError(
        400,
        'INVALID_ITEM',
        `Consumable affects '${inv.effect_stat}', which is not a pet stat`,
      );
    }

    const stat = inv.effect_stat as PetStat;
    const { rows: petRows } = await client.query<PetRow>(
      // Safe interpolation: `stat` is validated against the hardcoded whitelist above.
      `UPDATE pets
          SET ${stat} = LEAST(${stat} + $1, 100)
        WHERE user_id = $2
        RETURNING ${PET_COLUMNS}`,
      [inv.effect_amount, userId],
    );
    if (petRows.length === 0) {
      throw new Error(`Pet not found for user ${userId}`);
    }

    if (inv.quantity === 1) {
      await client.query(`DELETE FROM inventory WHERE user_id = $1 AND item_id = $2`, [
        userId,
        itemId,
      ]);
    } else {
      await client.query(
        `UPDATE inventory SET quantity = quantity - 1
          WHERE user_id = $1 AND item_id = $2`,
        [userId, itemId],
      );
    }

    await client.query('COMMIT');
    return petRows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================
// Equip / Unequip cosmetics
// ============================================================

export async function equip(userId: string, itemId: string): Promise<EquippedMap> {
  const { rows } = await pool.query<{
    type: string;
    category: string | null;
    quantity: number;
  }>(
    `SELECT i.type, i.category, inv.quantity
       FROM inventory inv
       JOIN items i ON i.id = inv.item_id
      WHERE inv.user_id = $1 AND inv.item_id = $2`,
    [userId, itemId],
  );

  if (rows.length === 0 || rows[0].quantity < 1) {
    throw new HttpError(404, 'NOT_IN_INVENTORY', 'Item not in inventory');
  }

  const item = rows[0];
  if (item.type !== 'cosmetic') {
    throw new HttpError(400, 'NOT_COSMETIC', 'Item is not a cosmetic');
  }
  if (!item.category || !(EQUIP_SLOTS as readonly string[]).includes(item.category)) {
    throw new HttpError(400, 'INVALID_SLOT', 'Cosmetic does not specify a valid slot');
  }

  await pool.query(
    `INSERT INTO equipped_cosmetics (user_id, slot, item_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, slot)
     DO UPDATE SET item_id = EXCLUDED.item_id`,
    [userId, item.category, itemId],
  );

  return getEquipped(userId);
}

export async function unequip(userId: string, slot: EquipSlot): Promise<void> {
  await pool.query(`DELETE FROM equipped_cosmetics WHERE user_id = $1 AND slot = $2`, [
    userId,
    slot,
  ]);
}

// ============================================================
// Called during habit completion (see habitService.complete)
// ============================================================

// Bumps the completion counter (the BEFORE UPDATE trigger updates stage),
// ratchets health upward toward `streak * 5` (capped at 100), and clears
// `is_fainted` when the resulting health is positive.
export async function applyHabitCompletionEffects(
  client: PoolClient,
  userId: string,
  currentStreak: number,
): Promise<PetCompletionEffect> {
  const target = Math.min(100, Math.max(0, currentStreak * 5));

  const { rows } = await client.query<PetCompletionEffect>(
    `UPDATE pets
        SET total_habits_completed = total_habits_completed + 1,
            health = LEAST(100, GREATEST(health, $2)),
            is_fainted = CASE
              WHEN is_fainted AND LEAST(100, GREATEST(health, $2)) > 0 THEN FALSE
              ELSE is_fainted
            END
      WHERE user_id = $1
      RETURNING total_habits_completed, health, stage, is_fainted`,
    [userId, target],
  );

  if (rows.length === 0) {
    throw new Error(`Pet not found for user ${userId}`);
  }
  return rows[0];
}

// Remaining placeholders kept for later prompts.
export async function decayStats(_userId: string): Promise<never> {
  throw new Error('petService.decayStats not implemented');
}

export async function rename(_userId: string, _name: string): Promise<never> {
  throw new Error('petService.rename not implemented');
}
