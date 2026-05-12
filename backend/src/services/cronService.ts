import cron from 'node-cron';
import { pool } from '../db/pool';

let started = false;

export function startCronJobs(): void {
  if (started) return;
  started = true;

  // Daily rollover at 00:00 UTC. Recalculates streak/pet state for users whose
  // last completion was before today. Per-user transaction means one bad row
  // doesn't abort the whole sweep.
  cron.schedule(
    '0 0 * * *',
    () => {
      runDailyRollover().catch((err) => {
        console.error('[cron] daily rollover failed:', err);
      });
    },
    { timezone: 'UTC' },
  );
}

interface CandidateRow {
  id: string;
  current_streak: number;
  freeze_count: number;
  last_completion_date: string;
}

export async function runDailyRollover(): Promise<void> {
  const start = Date.now();

  const { rows: users } = await pool.query<CandidateRow>(
    `SELECT u.id,
            s.current_streak,
            s.freeze_count,
            to_char(s.last_completion_date, 'YYYY-MM-DD') AS last_completion_date
       FROM users u
       JOIN streaks s ON s.user_id = u.id
      WHERE s.last_completion_date IS NOT NULL
        AND s.last_completion_date < CURRENT_DATE`,
  );

  const todayMs = startOfUtcToday();
  let intact = 0;
  let frozen = 0;
  let reset = 0;
  let fainted = 0;
  let failed = 0;

  for (const user of users) {
    const lastMs = Date.parse(`${user.last_completion_date}T00:00:00Z`);
    const gapDays = Math.round((todayMs - lastMs) / 86_400_000);

    let newStreak = user.current_streak;
    let newFreeze = user.freeze_count;
    let action: 'intact' | 'frozen' | 'reset' = 'intact';

    if (gapDays > 1) {
      if (user.freeze_count > 0) {
        newFreeze = user.freeze_count - 1;
        action = 'frozen';
      } else {
        newStreak = 0;
        action = 'reset';
      }
    }

    const newHealth = Math.min(100, Math.max(0, newStreak * 5));
    const willFaint = newHealth === 0;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (action !== 'intact') {
        await client.query(
          `UPDATE streaks SET current_streak = $1, freeze_count = $2 WHERE user_id = $3`,
          [newStreak, newFreeze, user.id],
        );
        await client.query(`UPDATE users SET streak_current = $1 WHERE id = $2`, [
          newStreak,
          user.id,
        ]);
      }

      await client.query(
        `UPDATE pets SET health = $1, is_fainted = $2 WHERE user_id = $3`,
        [newHealth, willFaint, user.id],
      );

      await client.query('COMMIT');

      if (action === 'frozen') frozen += 1;
      else if (action === 'reset') reset += 1;
      else intact += 1;
      if (willFaint) fainted += 1;
    } catch (err) {
      await client.query('ROLLBACK');
      failed += 1;
      console.error(`[cron] failed for user ${user.id}:`, err);
    } finally {
      client.release();
    }
  }

  const ms = Date.now() - start;
  console.log(
    `[cron] daily rollover: ${users.length} candidates, ` +
      `${intact} intact, ${frozen} frozen, ${reset} reset, ` +
      `${fainted} fainted, ${failed} failed, ${ms}ms`,
  );
}

function startOfUtcToday(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
