import type { PoolClient } from 'pg';

export interface PetCompletionEffect {
  total_habits_completed: number;
  health: number;
  stage: number;
  is_fainted: boolean;
}

// Called during habit completion, inside the same transaction. Bumps the
// completion counter (the BEFORE UPDATE trigger updates stage), ratchets
// health upward toward `streak * 5` (capped at 100), and clears `is_fainted`
// when the resulting health is positive.
//
// Note: this ratchet differs from a literal "set health = MIN(streak*5, 100)"
// because the latter drops a new user's pet to 5/100 on the very first
// completion, which clashes with PRODUCT.md's "recoverable, not catastrophic"
// principle. The cron-driven daily decay (still pending) is the counter-force
// that lets `streak * 5` reassert itself as the ceiling over time.
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

// Remaining functions stay placeholders; will be filled in later prompts.
export async function getForUser(_userId: string): Promise<never> {
  throw new Error('petService.getForUser not implemented');
}

export async function applyConsumable(_userId: string, _itemId: string): Promise<never> {
  throw new Error('petService.applyConsumable not implemented');
}

export async function decayStats(_userId: string): Promise<never> {
  throw new Error('petService.decayStats not implemented');
}

export async function rename(_userId: string, _name: string): Promise<never> {
  throw new Error('petService.rename not implemented');
}
