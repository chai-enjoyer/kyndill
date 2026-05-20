import { pool } from '../db/pool';

export interface MoodPingStatus {
  due: boolean;
  week_of: string; // YYYY-MM-DD of the Monday of the current ISO-week
  last_submitted_week: string | null;
}

export interface MoodPingInput {
  rating: number;
  note?: string;
}

export async function getStatus(userId: string): Promise<MoodPingStatus> {
  const consentRow = await pool.query<{ research_consent: boolean; mood_ping_opt: boolean }>(
    `SELECT u.research_consent,
            COALESCE((u.notification_prefs->>'moodPing')::boolean, FALSE) AS mood_ping_opt
       FROM users u WHERE u.id = $1`,
    [userId],
  );
  const consent = consentRow.rows[0];
  const weekOf = isoWeekMondayUtc(new Date());

  if (!consent?.research_consent || !consent.mood_ping_opt) {
    return { due: false, week_of: weekOf, last_submitted_week: null };
  }

  const lastRow = await pool.query<{ week_of: string }>(
    `SELECT to_char(week_of, 'YYYY-MM-DD') AS week_of
       FROM mood_pings
      WHERE user_id = $1
      ORDER BY week_of DESC
      LIMIT 1`,
    [userId],
  );
  const last = lastRow.rows[0]?.week_of ?? null;
  return { due: last !== weekOf, week_of: weekOf, last_submitted_week: last };
}

export async function submit(userId: string, input: MoodPingInput): Promise<void> {
  const weekOf = isoWeekMondayUtc(new Date());
  await pool.query(
    `INSERT INTO mood_pings (user_id, week_of, rating, note)
     VALUES ($1, $2::date, $3, $4)
     ON CONFLICT (user_id, week_of)
     DO UPDATE SET rating = EXCLUDED.rating, note = EXCLUDED.note`,
    [userId, weekOf, input.rating, input.note?.trim() ? input.note.trim() : null],
  );
}

// Monday of the current ISO-week, UTC. We deliberately ignore the user's
// local timezone here — research data needs a stable anchor across users.
function isoWeekMondayUtc(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // getUTCDay: 0 (Sun) .. 6 (Sat). ISO Monday is index 1.
  const day = d.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
