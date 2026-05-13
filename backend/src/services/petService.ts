import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';
import { isSpriteBackedCosmetic } from './catalog';

const PET_STAT_COLUMNS = ['health', 'happiness', 'hunger', 'energy', 'cleanliness'] as const;
type PetStat = (typeof PET_STAT_COLUMNS)[number];
const ALLOWED_STATS: ReadonlySet<string> = new Set(PET_STAT_COLUMNS);

export const EQUIP_SLOTS = [
  'hat',
  'accessory',
  'glasses',
  'scarf',
  'badge',
  'charm',
] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export const PET_SPECIES = ['star', 'cube', 'sphere', 'pyramid'] as const;
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
  last_decay_at: string;
  initialized_at: string | null;
  created_at: string;
}

type PetHealthStats = Pick<PetRow, 'happiness' | 'hunger' | 'energy' | 'cleanliness'>;

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
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  stage: number;
  is_fainted: boolean;
}

const PET_COLUMNS = `
  id, user_id, species, name, health, happiness, hunger, energy, cleanliness,
  stage, total_habits_completed, is_fainted, last_decay_at, initialized_at, created_at
`;

// ============================================================
// Read full state with equipped cosmetics
// ============================================================

export async function getFullState(userId: string): Promise<PetFullState> {
  await applyPassiveDecay(userId);

  const { rows: pets } = await pool.query<PetRow>(
    `SELECT ${PET_COLUMNS} FROM pets WHERE user_id = $1`,
    [userId],
  );
  if (pets.length === 0) {
    throw new HttpError(404, 'PET_NOT_FOUND', 'Pet does not exist');
  }

  const { rows: streakRows } = await pool.query<{ current_streak: number }>(
    `SELECT current_streak FROM streaks WHERE user_id = $1`,
    [userId],
  );
  const streak = streakRows[0]?.current_streak ?? 0;

  const health = derivePetHealth(streak, pets[0]);
  if (health !== pets[0].health) {
    await pool.query(`UPDATE pets SET health = $2 WHERE user_id = $1`, [userId, health]);
  }

  return { ...pets[0], health, equipped: await getEquipped(userId) };
}

export async function applyPassiveDecay(userId: string): Promise<void> {
  const { rows } = await pool.query<{ elapsed_days: number }>(
    `SELECT FLOOR(EXTRACT(EPOCH FROM (NOW() - last_decay_at)) / 86400)::int AS elapsed_days
       FROM pets
      WHERE user_id = $1`,
    [userId],
  );
  const elapsedDays = rows[0]?.elapsed_days ?? 0;
  if (elapsedDays <= 0) return;

  const days = Math.min(elapsedDays, 7);
  const hungerDrop = days * 6;
  const energyDrop = days * 5;
  const cleanlinessDrop = days * 4;
  const happinessDrop = days * 3;

  const { rows: updatedRows } = await pool.query<PetRow>(
    `UPDATE pets
        SET hunger = GREATEST(0, hunger - $2),
            energy = GREATEST(0, energy - $3),
            cleanliness = GREATEST(0, cleanliness - $4),
            happiness = GREATEST(0, happiness - $5),
            is_fainted = CASE
              WHEN GREATEST(0, hunger - $2) = 0 OR GREATEST(0, energy - $3) = 0 THEN TRUE
              ELSE is_fainted
            END,
            last_decay_at = NOW()
      WHERE user_id = $1
      RETURNING ${PET_COLUMNS}`,
    [userId, hungerDrop, energyDrop, cleanlinessDrop, happinessDrop],
  );
  if (updatedRows.length === 0) return;

  const streak = await getCurrentStreak(userId);
  const health = derivePetHealth(streak, updatedRows[0]);
  await pool.query(
    `UPDATE pets
        SET health = $2,
            is_fainted = CASE
              WHEN $3 THEN TRUE
              ELSE is_fainted
            END
      WHERE user_id = $1`,
    [userId, health, updatedRows[0].hunger <= 0 || updatedRows[0].energy <= 0 || health <= 0],
  );
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
      WHERE ec.user_id = $1
        AND ec.slot = ANY($2::text[])`,
    [userId, EQUIP_SLOTS],
  );

  const equipped: EquippedMap = {};
  for (const row of rows) {
    if (!isSpriteBackedCosmetic(row.name)) continue;
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

export async function rename(userId: string, name: string): Promise<PetRow> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 20) {
    throw new HttpError(400, 'INVALID_NAME', 'Name must be 1..20 characters');
  }

  const { rows } = await pool.query<PetRow>(
    `UPDATE pets
        SET name = $1
      WHERE user_id = $2
      RETURNING ${PET_COLUMNS}`,
    [trimmed, userId],
  );

  if (rows.length === 0) {
    throw new HttpError(404, 'PET_NOT_FOUND', 'Pet does not exist');
  }

  return rows[0];
}

// ============================================================
// Feed (consume a consumable from inventory)
// ============================================================

export async function feed(userId: string, itemId: string): Promise<PetRow> {
  await applyPassiveDecay(userId);

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
    let { rows: petRows } = await client.query<PetRow>(
      // Safe interpolation: `stat` is validated against the hardcoded whitelist above.
      `UPDATE pets
          SET ${stat} = LEAST(${stat} + $1, 100),
              last_decay_at = NOW()
        WHERE user_id = $2
        RETURNING ${PET_COLUMNS}`,
      [inv.effect_amount, userId],
    );
    if (petRows.length === 0) {
      throw new Error(`Pet not found for user ${userId}`);
    }

    const streak = await getCurrentStreak(userId, client);
    const health = derivePetHealth(streak, petRows[0]);
    const shouldFaint = petRows[0].hunger <= 0 || petRows[0].energy <= 0 || health <= 0;
    const shouldRevive = !shouldFaint && petRows[0].hunger > 0 && petRows[0].energy > 0 && health >= 25;
    const syncedPet = await client.query<PetRow>(
      `UPDATE pets
          SET health = $2,
              is_fainted = CASE
                WHEN $3 THEN TRUE
                WHEN $4 THEN FALSE
                ELSE is_fainted
              END
        WHERE user_id = $1
        RETURNING ${PET_COLUMNS}`,
      [userId, health, shouldFaint, shouldRevive],
    );
    petRows = syncedPet.rows;

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
    name: string;
    quantity: number;
  }>(
    `SELECT i.type, i.category, i.name, inv.quantity
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
  if (!isSpriteBackedCosmetic(item.name)) {
    throw new HttpError(400, 'COSMETIC_UNAVAILABLE', 'That cosmetic does not have delivered art');
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
// nudges care stats, then recomputes health from streak + care state.
// Completion should feel good, but it also spends a little energy/food so
// consumables have a real purpose.
export async function applyHabitCompletionEffects(
  client: PoolClient,
  userId: string,
  currentStreak: number,
  habitCategory: string,
): Promise<PetCompletionEffect> {
  const deltas = completionStatDeltas(habitCategory);

  const { rows } = await client.query<PetCompletionEffect>(
    `UPDATE pets
        SET total_habits_completed = total_habits_completed + 1,
            happiness = LEAST(100, GREATEST(0, happiness + $2)),
            hunger = LEAST(100, GREATEST(0, hunger + $3)),
            energy = LEAST(100, GREATEST(0, energy + $4)),
            cleanliness = LEAST(100, GREATEST(0, cleanliness + $5)),
            last_decay_at = NOW()
      WHERE user_id = $1
      RETURNING total_habits_completed, health, happiness, hunger, energy, cleanliness, stage, is_fainted`,
    [userId, deltas.happiness, deltas.hunger, deltas.energy, deltas.cleanliness],
  );

  if (rows.length === 0) {
    throw new Error(`Pet not found for user ${userId}`);
  }

  const health = derivePetHealth(currentStreak, rows[0]);
  const shouldFaint = rows[0].hunger <= 0 || rows[0].energy <= 0 || health <= 0;
  const shouldRevive = !shouldFaint && health >= 25;
  const synced = await client.query<PetCompletionEffect>(
    `UPDATE pets
        SET health = $2,
            is_fainted = CASE
              WHEN $3 THEN TRUE
              WHEN $4 THEN FALSE
              ELSE is_fainted
            END
      WHERE user_id = $1
      RETURNING total_habits_completed, health, happiness, hunger, energy, cleanliness, stage, is_fainted`,
    [userId, health, shouldFaint, shouldRevive],
  );

  return synced.rows[0];
}

export function derivePetHealth(currentStreak: number, stats: PetHealthStats): number {
  const safeStreak = Math.max(0, Math.floor(currentStreak));
  const careAverage = (stats.happiness + stats.hunger + stats.energy + stats.cleanliness) / 4;
  const streakScore = Math.min(100, safeStreak * 12);
  const consistencyBonus = Math.min(12, safeStreak * 2);
  return Math.round(Math.min(100, Math.max(0, careAverage * 0.55 + streakScore * 0.35 + consistencyBonus)));
}

export function deriveStreakHealth(currentStreak: number, stats?: PetHealthStats): number {
  if (stats) return derivePetHealth(currentStreak, stats);
  const safeStreak = Math.max(0, Math.floor(currentStreak));
  return Math.min(100, safeStreak * 12);
}

async function getCurrentStreak(userId: string, client: PoolClient | typeof pool = pool): Promise<number> {
  const { rows } = await client.query<{ current_streak: number }>(
    `SELECT current_streak FROM streaks WHERE user_id = $1`,
    [userId],
  );
  return rows[0]?.current_streak ?? 0;
}

function completionStatDeltas(category: string): Record<Exclude<PetStat, 'health'>, number> {
  const base = { happiness: 4, hunger: -5, energy: -4, cleanliness: -3 };
  switch (category) {
    case 'Health':
      return { ...base, energy: -2, cleanliness: 1 };
    case 'Productivity':
      return { ...base, happiness: 5, energy: -6 };
    case 'Social':
      return { ...base, happiness: 9, hunger: -6 };
    case 'Learning':
      return { ...base, happiness: 6, energy: -6 };
    case 'Wellness':
      return { ...base, happiness: 7, energy: 0, cleanliness: 0 };
    default:
      return base;
  }
}

export async function decayStats(userId: string): Promise<void> {
  await applyPassiveDecay(userId);
}
