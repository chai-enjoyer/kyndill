import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';

export interface FocusCompleteResult {
  session_id: string;
  coins_earned: number;
  total_focus_time: number;
}

export interface FocusStats {
  total_sessions: number;
  total_minutes: number;
  average_rating: number | null;
  sessions_this_week: number;
}

export async function complete(
  userId: string,
  durationMinutes: number,
  rating?: number,
): Promise<FocusCompleteResult> {
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 120) {
    throw new HttpError(400, 'INVALID_DURATION', 'duration_minutes must be an integer in 1..120');
  }
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new HttpError(400, 'INVALID_RATING', 'rating must be an integer in 1..5');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const coinsEarned = computeFocusCoins(durationMinutes);

    const { rows: inserted } = await client.query<{ id: string }>(
      `INSERT INTO focus_sessions (user_id, duration_minutes, rating)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, durationMinutes, rating ?? null],
    );

    await client.query(`UPDATE users SET coins = coins + $1 WHERE id = $2`, [coinsEarned, userId]);

    const { rows: totals } = await client.query<{ total: number }>(
      `SELECT COALESCE(SUM(duration_minutes), 0)::int AS total
         FROM focus_sessions WHERE user_id = $1`,
      [userId],
    );

    await client.query('COMMIT');
    return {
      session_id: inserted[0].id,
      coins_earned: coinsEarned,
      total_focus_time: totals[0].total,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Roughly one coin every two minutes, capped at 45 for a long session. The
// previous floor of 4 made every short session feel identical regardless of
// time invested.
function computeFocusCoins(durationMinutes: number): number {
  return Math.min(45, Math.max(1, Math.round(durationMinutes / 2)));
}

export async function rateSession(userId: string, sessionId: string, rating: number): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'INVALID_RATING', 'rating must be an integer in 1..5');
  }
  const { rowCount } = await pool.query(
    `UPDATE focus_sessions SET rating = $1 WHERE id = $2 AND user_id = $3`,
    [rating, sessionId, userId],
  );
  if (rowCount === 0) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Focus session not found');
  }
}

export async function getStats(userId: string): Promise<FocusStats> {
  const { rows } = await pool.query<{
    total_sessions: number;
    total_minutes: number;
    average_rating: string | null;
    sessions_this_week: number;
  }>(
    `SELECT COUNT(*)::int                                                              AS total_sessions,
            COALESCE(SUM(duration_minutes), 0)::int                                    AS total_minutes,
            AVG(rating) FILTER (WHERE rating IS NOT NULL)                              AS average_rating,
            COUNT(*) FILTER (WHERE completed_at >= NOW() - INTERVAL '7 days')::int     AS sessions_this_week
       FROM focus_sessions
      WHERE user_id = $1`,
    [userId],
  );
  const row = rows[0];
  return {
    total_sessions: row.total_sessions,
    total_minutes: row.total_minutes,
    average_rating: row.average_rating !== null ? Number(row.average_rating) : null,
    sessions_this_week: row.sessions_this_week,
  };
}
