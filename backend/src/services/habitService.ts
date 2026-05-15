import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';
import { emitToUser } from '../socket/socketHandler';
import { emitActivityUpdated, recordActivity } from './activityService';
import { sendNotificationPush } from './notificationsService';
import { applyHabitCompletionEffects } from './petService';
import { rollItemDrop, type DroppedItem } from './rewardService';
import type { PoolClient } from 'pg';

// ============================================================
// Types
// ============================================================

export type HabitCategory = 'Health' | 'Productivity' | 'Social' | 'Learning' | 'Wellness';
export type HabitFrequency = 'daily' | 'weekly';

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  frequency: HabitFrequency;
  days_of_week: number[] | null;
  completion_start_time: string | null;
  completion_end_time: string | null;
  target_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface HabitWithStatus extends HabitRow {
  completed_today: boolean;
  completed_count: number;
  today_target_count: number;
  current_streak: number;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  target_count?: number;
  days_of_week?: number[];
  completion_start_time?: string;
  completion_end_time?: string;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string | null;
  category?: HabitCategory;
  frequency?: HabitFrequency;
  target_count?: number;
  days_of_week?: number[];
  completion_start_time?: string | null;
  completion_end_time?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface CompleteResult {
  xp_earned: number;
  coins_earned: number;
  new_streak: number;
  longest_streak: number;
  item_dropped: DroppedItem | null;
  leveled_up: boolean;
  new_level: number;
  pet_health: number;
  pet_happiness: number;
  pet_hunger: number;
  pet_energy: number;
  pet_cleanliness: number;
  pet_total_habits_completed: number;
  pet_is_fainted: boolean;
  completed_count: number;
  target_count: number;
  completed_today: boolean;
}

export interface CompletionHistoryEntry {
  id: string;
  completed_on: string;
  completed_at: string;
  completion_count: number;
  target_count: number;
  xp_earned: number;
  coins_earned: number;
}

const HABIT_COLUMNS = `
  id, user_id, name, description, category, frequency, days_of_week,
  to_char(completion_start_time, 'HH24:MI:SS') AS completion_start_time,
  to_char(completion_end_time,   'HH24:MI:SS') AS completion_end_time,
  target_count, is_active, sort_order, created_at
`;

// ============================================================
// List today's habits with completion + streak info
// ============================================================

export async function listForToday(userId: string): Promise<HabitWithStatus[]> {
  const today = new Date();
  const todayStr = toIsoDate(today);
  const weekday = today.getUTCDay();

  const { rows: habits } = await pool.query<HabitRow>(
    `SELECT ${HABIT_COLUMNS}
       FROM habits
      WHERE user_id = $1 AND is_active = TRUE
      ORDER BY sort_order ASC, created_at ASC`,
    [userId],
  );

  const todayHabits = habits.filter((h) => isExpectedOnWeekday(h, weekday));
  if (todayHabits.length === 0) return [];

  const habitIds = todayHabits.map((h) => h.id);
  const { rows: completions } = await pool.query<{
    habit_id: string;
    completed_on: string;
    completion_count: number;
    target_count: number;
  }>(
    `SELECT habit_id,
            completed_on::text AS completed_on,
            completion_count,
            target_count
       FROM habit_completions
      WHERE user_id = $1
        AND habit_id = ANY($2::uuid[])
        AND completed_on >= (CURRENT_DATE - INTERVAL '90 days')`,
    [userId, habitIds],
  );

  const byHabit = new Map<string, Set<string>>();
  const todayProgress = new Map<string, { completion_count: number; target_count: number }>();
  for (const row of completions) {
    if (row.completion_count >= row.target_count) {
      let set = byHabit.get(row.habit_id);
      if (!set) {
        set = new Set<string>();
        byHabit.set(row.habit_id, set);
      }
      set.add(row.completed_on);
    }
    if (row.completed_on === todayStr) {
      todayProgress.set(row.habit_id, {
        completion_count: row.completion_count,
        target_count: row.target_count,
      });
    }
  }

  return todayHabits.map((habit) => {
    const dates = byHabit.get(habit.id) ?? new Set<string>();
    const progress = todayProgress.get(habit.id);
    const todayTarget = progress?.target_count ?? habit.target_count;
    const completedCount = progress?.completion_count ?? 0;
    return {
      ...habit,
      completed_today: completedCount >= todayTarget,
      completed_count: completedCount,
      today_target_count: todayTarget,
      current_streak: computeHabitStreak(habit, dates, today),
    };
  });
}

export async function listAll(userId: string): Promise<HabitWithStatus[]> {
  const today = new Date();
  const todayStr = toIsoDate(today);

  const { rows: habits } = await pool.query<HabitRow>(
    `SELECT ${HABIT_COLUMNS}
       FROM habits
      WHERE user_id = $1
      ORDER BY sort_order ASC, created_at ASC`,
    [userId],
  );
  if (habits.length === 0) return [];

  const habitIds = habits.map((h) => h.id);
  const { rows: completions } = await pool.query<{
    habit_id: string;
    completed_on: string;
    completion_count: number;
    target_count: number;
  }>(
    `SELECT habit_id,
            completed_on::text AS completed_on,
            completion_count,
            target_count
       FROM habit_completions
      WHERE user_id = $1
        AND habit_id = ANY($2::uuid[])
        AND completed_on >= (CURRENT_DATE - INTERVAL '365 days')`,
    [userId, habitIds],
  );

  const byHabit = new Map<string, Set<string>>();
  const todayProgress = new Map<string, { completion_count: number; target_count: number }>();
  for (const row of completions) {
    if (row.completion_count >= row.target_count) {
      let set = byHabit.get(row.habit_id);
      if (!set) {
        set = new Set<string>();
        byHabit.set(row.habit_id, set);
      }
      set.add(row.completed_on);
    }
    if (row.completed_on === todayStr) {
      todayProgress.set(row.habit_id, {
        completion_count: row.completion_count,
        target_count: row.target_count,
      });
    }
  }

  return habits.map((habit) => {
    const dates = byHabit.get(habit.id) ?? new Set<string>();
    const progress = todayProgress.get(habit.id);
    const todayTarget = progress?.target_count ?? habit.target_count;
    const completedCount = progress?.completion_count ?? 0;
    return {
      ...habit,
      completed_today: completedCount >= todayTarget,
      completed_count: completedCount,
      today_target_count: todayTarget,
      current_streak: computeHabitStreak(habit, dates, today),
    };
  });
}

function computeHabitStreak(habit: HabitRow, completionDates: Set<string>, today: Date): number {
  const cursor = new Date(today);
  if (!completionDates.has(toIsoDate(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const expected = isExpectedOnWeekday(habit, cursor.getUTCDay());
    if (!expected) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }
    if (completionDates.has(toIsoDate(cursor))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function isExpectedOnWeekday(habit: HabitRow, weekday: number): boolean {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') {
    return Array.isArray(habit.days_of_week) && habit.days_of_week.includes(weekday);
  }
  return false;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ============================================================
// Create
// ============================================================

export async function create(userId: string, input: CreateHabitInput): Promise<HabitRow> {
  const { rows } = await pool.query<HabitRow>(
    `INSERT INTO habits
       (user_id, name, description, category, frequency, days_of_week,
        completion_start_time, completion_end_time, target_count)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::time, $8::time, $9)
     RETURNING ${HABIT_COLUMNS}`,
    [
      userId,
      input.name,
      input.description ?? null,
      input.category,
      input.frequency,
      input.days_of_week ? JSON.stringify(input.days_of_week) : null,
      input.completion_start_time ?? null,
      input.completion_end_time ?? null,
      input.target_count ?? 1,
    ],
  );
  return rows[0];
}

// ============================================================
// Update
// ============================================================

export async function update(
  userId: string,
  habitId: string,
  input: UpdateHabitInput,
): Promise<HabitRow> {
  await getOwned(userId, habitId);

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${i++}`);
    values.push(input.description);
  }
  if (input.category !== undefined) {
    sets.push(`category = $${i++}`);
    values.push(input.category);
  }
  if (input.frequency !== undefined) {
    sets.push(`frequency = $${i++}`);
    values.push(input.frequency);
  }
  if (input.target_count !== undefined) {
    sets.push(`target_count = $${i++}`);
    values.push(input.target_count);
  }
  if (input.days_of_week !== undefined) {
    sets.push(`days_of_week = $${i++}::jsonb`);
    values.push(JSON.stringify(input.days_of_week));
  }
  if (input.completion_start_time !== undefined) {
    sets.push(`completion_start_time = $${i++}::time`);
    values.push(input.completion_start_time);
  }
  if (input.completion_end_time !== undefined) {
    sets.push(`completion_end_time = $${i++}::time`);
    values.push(input.completion_end_time);
  }
  if (input.is_active !== undefined) {
    sets.push(`is_active = $${i++}`);
    values.push(input.is_active);
  }
  if (input.sort_order !== undefined) {
    sets.push(`sort_order = $${i++}`);
    values.push(input.sort_order);
  }

  if (sets.length === 0) {
    return getOwned(userId, habitId);
  }

  values.push(habitId);
  values.push(userId);

  const { rows } = await pool.query<HabitRow>(
    `UPDATE habits SET ${sets.join(', ')}
      WHERE id = $${i++} AND user_id = $${i}
     RETURNING ${HABIT_COLUMNS}`,
    values,
  );
  return rows[0];
}

// ============================================================
// Delete
// ============================================================

export async function archive(userId: string, habitId: string): Promise<void> {
  const { rowCount } = await pool.query(
    `DELETE FROM habits WHERE id = $1 AND user_id = $2`,
    [habitId, userId],
  );
  if (rowCount === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Habit not found');
  }
}

// ============================================================
// Reorder
// ============================================================

export async function reorder(
  userId: string,
  entries: { id: string; sort_order: number }[],
): Promise<void> {
  if (entries.length === 0) return;

  const ids = entries.map((e) => e.id);
  const orders = entries.map((e) => e.sort_order);

  const { rows: owned } = await pool.query<{ id: string }>(
    `SELECT id FROM habits WHERE id = ANY($1::uuid[]) AND user_id = $2`,
    [ids, userId],
  );
  if (owned.length !== ids.length) {
    throw new HttpError(404, 'NOT_FOUND', 'One or more habits not found or not owned');
  }

  await pool.query(
    `UPDATE habits SET sort_order = u.sort_order
       FROM (SELECT UNNEST($1::uuid[]) AS id, UNNEST($2::int[]) AS sort_order) AS u
      WHERE habits.id = u.id AND habits.user_id = $3`,
    [ids, orders, userId],
  );
}

// ============================================================
// Complete (the transactional core)
// ============================================================

export async function complete(userId: string, habitId: string): Promise<CompleteResult> {
  const habit = await getOwned(userId, habitId);

  const today = toIsoDate(new Date());
  const configuredTarget = normalizeTargetCount(habit.target_count);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: completionRows } = await client.query<{
      id: string;
      completion_count: number;
      target_count: number;
    }>(
      `SELECT id, completion_count, target_count
         FROM habit_completions
        WHERE habit_id = $1
          AND user_id = $2
          AND completed_on = $3::date
        FOR UPDATE`,
      [habitId, userId, today],
    );
    const existingCompletion = completionRows[0] ?? null;
    const targetCount = normalizeTargetCount(existingCompletion?.target_count ?? configuredTarget);
    const currentCount = existingCompletion?.completion_count ?? 0;
    if (currentCount >= targetCount) {
      throw new HttpError(409, 'ALREADY_COMPLETED', 'Habit already completed today');
    }
    const nextCount = Math.min(targetCount, currentCount + 1);
    const completedToday = nextCount >= targetCount;

    // Streak state (locked for the duration of the tx).
    const { rows: streakRows } = await client.query<{
      current_streak: number;
      longest_streak: number;
      freeze_count: number;
      last_completion_date: string | null;
    }>(
      `SELECT current_streak, longest_streak, freeze_count,
              to_char(last_completion_date, 'YYYY-MM-DD') AS last_completion_date
         FROM streaks WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    if (streakRows.length === 0) {
      throw new Error('Streaks row missing for user');
    }
    const s = streakRows[0];

    if (!completedToday) {
      try {
        if (existingCompletion) {
          await client.query(
            `UPDATE habit_completions
                SET completion_count = $1,
                    completed_at = NOW()
              WHERE id = $2`,
            [nextCount, existingCompletion.id],
          );
        } else {
          await client.query(
            `INSERT INTO habit_completions
               (habit_id, user_id, completed_on, completion_count, target_count, xp_earned, coins_earned)
             VALUES ($1, $2, $3::date, $4, $5, 0, 0)`,
            [habitId, userId, today, nextCount, targetCount],
          );
        }
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new HttpError(409, 'PROGRESS_CONFLICT', 'Progress was already logged. Try again.');
        }
        throw err;
      }

      const pet = await getPetSnapshot(client, userId);
      const { rows: currentUserRows } = await client.query<{ level: number }>(
        `SELECT level FROM users WHERE id = $1`,
        [userId],
      );
      if (currentUserRows.length === 0) throw new Error('User not found');

      await client.query('COMMIT');
      return {
        xp_earned: 0,
        coins_earned: 0,
        new_streak: s.current_streak,
        longest_streak: s.longest_streak,
        item_dropped: null,
        leveled_up: false,
        new_level: currentUserRows[0].level,
        pet_health: pet.health,
        pet_happiness: pet.happiness,
        pet_hunger: pet.hunger,
        pet_energy: pet.energy,
        pet_cleanliness: pet.cleanliness,
        pet_total_habits_completed: pet.total_habits_completed,
        pet_is_fainted: pet.is_fainted,
        completed_count: nextCount,
        target_count: targetCount,
        completed_today: false,
      };
    }

    // Compute new streak.
    let newStreak: number;
    let newFreezeCount = s.freeze_count;
    if (s.last_completion_date === null) {
      newStreak = 1;
    } else {
      const lastMs = Date.parse(`${s.last_completion_date}T00:00:00Z`);
      const todayMs = Date.parse(`${today}T00:00:00Z`);
      const diffDays = Math.round((todayMs - lastMs) / 86_400_000);

      if (diffDays === 0) {
        // A different habit was already completed today; the user-wide streak
        // doesn't bump again. (Per-habit duplicate is blocked by step 2.)
        newStreak = s.current_streak;
      } else if (diffDays === 1) {
        newStreak = s.current_streak + 1;
      } else if (s.freeze_count > 0) {
        newStreak = s.current_streak;
        newFreezeCount = s.freeze_count - 1;
      } else {
        newStreak = 1;
      }
    }
    const newLongest = Math.max(s.longest_streak, newStreak);

    await client.query(
      `UPDATE streaks
          SET current_streak = $1,
              longest_streak = $2,
              freeze_count = $3,
              last_completion_date = $4::date
        WHERE user_id = $5`,
      [newStreak, newLongest, newFreezeCount, today, userId],
    );

    const xpEarned = computeHabitXp(newStreak, habit.frequency);
    const coinsEarned = computeHabitCoins(newStreak, habit.frequency);

    if (existingCompletion) {
      await client.query(
        `UPDATE habit_completions
            SET completion_count = $1,
                completed_at = NOW(),
                xp_earned = $2,
                coins_earned = $3
          WHERE id = $4`,
        [nextCount, xpEarned, coinsEarned, existingCompletion.id],
      );
    } else {
      try {
        await client.query(
          `INSERT INTO habit_completions
             (habit_id, user_id, completed_on, completion_count, target_count, xp_earned, coins_earned)
           VALUES ($1, $2, $3::date, $4, $5, $6, $7)`,
          [habitId, userId, today, nextCount, targetCount, xpEarned, coinsEarned],
        );
      } catch (err) {
        // Concurrent duplicate completion (UNIQUE habit_id, user_id, completed_on).
        if (isUniqueViolation(err)) {
          throw new HttpError(409, 'ALREADY_COMPLETED', 'Habit already completed today');
        }
        throw err;
      }
    }

    const itemDropped = await rollItemDrop(client, userId, habit.category, newStreak);

    // User row update + level recompute.
    const { rows: userRows } = await client.query<{ xp: number; level: number }>(
      `SELECT xp, level FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (userRows.length === 0) throw new Error('User not found');

    const oldUser = userRows[0];
    const newXp = oldUser.xp + xpEarned;
    let newLevel = oldUser.level;
    let leveledUp = false;
    while (newXp >= 100 * newLevel * newLevel) {
      newLevel += 1;
      leveledUp = true;
    }

    await client.query(
      `UPDATE users
          SET xp = $1,
              level = $2,
              coins = coins + $3,
              streak_current = $4,
              streak_longest = $5,
              last_completion_date = $6::date
        WHERE id = $7`,
      [newXp, newLevel, coinsEarned, newStreak, newLongest, today, userId],
    );

    const pet = await applyHabitCompletionEffects(client, userId, newStreak, habit.category);

    const itemDropContent = itemDropped ? `You found ${itemDropped.name}` : null;
    if (itemDropped) {
      await client.query(
        `INSERT INTO notifications (user_id, type, content, metadata)
         VALUES ($1, 'item_drop', $2, $3::jsonb)`,
        [
          userId,
          itemDropContent,
          JSON.stringify({
            item_id: itemDropped.id,
            item_name: itemDropped.name,
            item_type: itemDropped.type,
            rarity: itemDropped.rarity,
          }),
        ],
      );
    }

    const levelUpContent = leveledUp ? `You reached Level ${newLevel}` : null;
    if (leveledUp) {
      await client.query(
        `INSERT INTO notifications (user_id, type, content, metadata)
         VALUES ($1, 'level_up', $2, $3::jsonb)`,
        [
          userId,
          levelUpContent,
          JSON.stringify({ new_level: newLevel }),
        ],
      );
    }

    await recordActivity(client, userId, 'habit_completed', {
      habit_id: habitId,
      habit_name: habit.name,
      category: habit.category,
      new_streak: newStreak,
      completed_count: nextCount,
      target_count: targetCount,
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      item_dropped: itemDropped
        ? {
            item_id: itemDropped.id,
            item_name: itemDropped.name,
            item_type: itemDropped.type,
            rarity: itemDropped.rarity,
          }
        : null,
    });

    if (leveledUp) {
      await recordActivity(client, userId, 'level_up', {
        new_level: newLevel,
        xp: newXp,
      });
    }

    await client.query('COMMIT');

    try {
      await emitActivityUpdated(userId);
    } catch (err) {
      console.error('activity_updated emit failed:', err);
    }

    if (leveledUp) {
      emitToUser(userId, 'level_up', { new_level: newLevel });
      void sendNotificationPush(userId, 'level_up', levelUpContent ?? `You reached Level ${newLevel}`).catch((err) => {
        console.error('level_up push failed:', err);
      });
    }
    if (itemDropped) {
      emitToUser(userId, 'item_dropped', {
        item_id: itemDropped.id,
        item_name: itemDropped.name,
        rarity: itemDropped.rarity,
      });
      void sendNotificationPush(userId, 'item_drop', itemDropContent ?? `You found ${itemDropped.name}`).catch((err) => {
        console.error('item_drop push failed:', err);
      });
    }

    // Best-effort fanout to friends; failures don't roll back the completion.
    try {
      const { rows: friends } = await pool.query<{ friend_id: string }>(
        'SELECT friend_id FROM friends WHERE user_id = $1',
        [userId],
      );
      for (const f of friends) {
        emitToUser(f.friend_id, 'habit_completed', {
          user_id: userId,
          habit_id: habitId,
          habit_name: habit.name,
          new_streak: newStreak,
          leveled_up: leveledUp,
        });
      }
    } catch (err) {
      console.error('habit_completed emit failed:', err);
    }

    return {
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      new_streak: newStreak,
      longest_streak: newLongest,
      item_dropped: itemDropped,
      leveled_up: leveledUp,
      new_level: newLevel,
      pet_health: pet.health,
      pet_happiness: pet.happiness,
      pet_hunger: pet.hunger,
      pet_energy: pet.energy,
      pet_cleanliness: pet.cleanliness,
      pet_total_habits_completed: pet.total_habits_completed,
      pet_is_fainted: pet.is_fainted,
      completed_count: nextCount,
      target_count: targetCount,
      completed_today: true,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================
// History
// ============================================================

export async function getHistory(
  userId: string,
  habitId: string,
): Promise<CompletionHistoryEntry[]> {
  await getOwned(userId, habitId);
  const { rows } = await pool.query<CompletionHistoryEntry>(
    `SELECT id,
            to_char(completed_on, 'YYYY-MM-DD') AS completed_on,
            completed_at,
            completion_count,
            target_count,
            xp_earned,
            coins_earned
      FROM habit_completions
      WHERE habit_id = $1 AND user_id = $2
      ORDER BY completed_on DESC, completed_at DESC
      LIMIT 30`,
    [habitId, userId],
  );
  return rows;
}

// ============================================================
// Helpers
// ============================================================

async function getOwned(userId: string, habitId: string): Promise<HabitRow> {
  const { rows } = await pool.query<HabitRow>(
    `SELECT ${HABIT_COLUMNS}
       FROM habits
      WHERE id = $1 AND user_id = $2`,
    [habitId, userId],
  );
  if (rows.length === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Habit not found');
  }
  return rows[0];
}

async function getPetSnapshot(client: PoolClient, userId: string): Promise<{
  health: number;
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
  total_habits_completed: number;
  is_fainted: boolean;
}> {
  const { rows } = await client.query<{
    health: number;
    happiness: number;
    hunger: number;
    energy: number;
    cleanliness: number;
    total_habits_completed: number;
    is_fainted: boolean;
  }>(
    `SELECT health, happiness, hunger, energy, cleanliness, total_habits_completed, is_fainted
       FROM pets
      WHERE user_id = $1`,
    [userId],
  );
  if (rows.length === 0) throw new Error('Pet not found');
  return rows[0];
}

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  return (err as { code?: string }).code === '23505';
}

function normalizeTargetCount(value: number): number {
  return Math.min(24, Math.max(1, Math.floor(value)));
}

function computeHabitXp(streak: number, frequency: HabitFrequency): number {
  const safeStreak = Math.max(0, Math.floor(streak));
  const cadenceBonus = frequency === 'weekly' ? 5 : 0;
  const streakBonus = Math.min(18, Math.floor(safeStreak / 2));
  const milestoneBonus = safeStreak > 0 && safeStreak % 7 === 0 ? 6 : 0;
  return 12 + cadenceBonus + streakBonus + milestoneBonus;
}

function computeHabitCoins(streak: number, frequency: HabitFrequency): number {
  const safeStreak = Math.max(0, Math.floor(streak));
  const cadenceBonus = frequency === 'weekly' ? 4 : 0;
  const streakBonus = Math.min(8, Math.floor(safeStreak / 3));
  const milestoneBonus = safeStreak > 0 && safeStreak % 7 === 0 ? 5 : 0;
  return 7 + cadenceBonus + streakBonus + milestoneBonus;
}
