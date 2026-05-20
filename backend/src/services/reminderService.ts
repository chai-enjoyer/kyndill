import { pool } from '../db/pool';
import { sendPushToUser } from './pushService';

interface ReminderCandidate {
  id: string;
  reminder_hour: number;
  reminder_timezone: string;
  display_name: string;
  last_reminder_sent: string | null;
}

interface PendingHabit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  days_of_week: number[] | null;
  target_count: number;
  done_today: number;
  created_on: string;
}

// Gentle evening lines. Kyndill voice: tender, steady, considered. The lede
// changes a little so the same time on the same device doesn't read like a
// robot. No emoji decoration, no exclamation marks.
const REMINDER_LINES = [
  (count: number) => `Two minutes is enough. Still ${count} habit${count === 1 ? '' : 's'} to light.`,
  (count: number) => `Your pet is waiting. ${count} small flame${count === 1 ? '' : 's'} left for today.`,
  (count: number) => `Tonight, just one would count. ${count} habit${count === 1 ? '' : 's'} still open.`,
  (count: number) => `A quick check-in keeps the light on. ${count} to go.`,
];

export async function runHourlyReminderTick(now: Date = new Date()): Promise<void> {
  const start = Date.now();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const { rows: users } = await pool.query<ReminderCandidate>(
    `SELECT u.id,
            u.reminder_hour,
            u.reminder_timezone,
            u.display_name,
            to_char(u.last_reminder_sent, 'YYYY-MM-DD') AS last_reminder_sent
       FROM users u
      WHERE u.reminder_hour IS NOT NULL
        AND COALESCE((u.notification_prefs->>'dailyReminder')::boolean, TRUE) = TRUE
        AND EXISTS (
          SELECT 1 FROM push_subscriptions p WHERE p.user_id = u.id
        )`,
  );

  for (const user of users) {
    try {
      const local = localNowFor(user.reminder_timezone, now);
      // Fire when local clock has just crossed the target hour.
      if (local.hour !== user.reminder_hour) {
        skipped += 1;
        continue;
      }
      if (user.last_reminder_sent === local.dateIso) {
        skipped += 1;
        continue;
      }

      const pending = await getPendingHabits(user.id, local.dateIso, local.weekday);
      if (pending.length === 0) {
        skipped += 1;
        continue;
      }

      const lineMaker = REMINDER_LINES[Math.floor(Math.random() * REMINDER_LINES.length)];
      const body = lineMaker(pending.length);

      await sendPushToUser(
        user.id,
        {
          title: 'Kyndill',
          body,
          url: '/',
          tag: 'daily_reminder',
        },
        'daily_reminder',
      );

      await pool.query(
        `UPDATE users SET last_reminder_sent = $1::date WHERE id = $2`,
        [local.dateIso, user.id],
      );

      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`[reminder] failed for user ${user.id}:`, err);
    }
  }

  const ms = Date.now() - start;
  console.log(
    `[reminder] tick: ${users.length} candidates, ${sent} sent, ${skipped} skipped, ${failed} failed, ${ms}ms`,
  );
}

async function getPendingHabits(
  userId: string,
  dateIso: string,
  weekday: number,
): Promise<PendingHabit[]> {
  const { rows } = await pool.query<PendingHabit>(
    `SELECT h.id,
            h.name,
            h.frequency,
            CASE
              WHEN jsonb_typeof(h.days_of_week) = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(h.days_of_week)::int)
              ELSE NULL
            END AS days_of_week,
            h.target_count,
            COALESCE(c.completion_count, 0) AS done_today,
            to_char(h.created_at, 'YYYY-MM-DD') AS created_on
       FROM habits h
       LEFT JOIN habit_completions c
              ON c.habit_id = h.id
             AND c.user_id = h.user_id
             AND c.completed_on = $2::date
      WHERE h.user_id = $1
        AND h.is_active = TRUE`,
    [userId, dateIso],
  );

  return rows.filter((habit) => {
    if (habit.created_on > dateIso) return false;
    if (habit.frequency === 'weekly') {
      if (!Array.isArray(habit.days_of_week) || !habit.days_of_week.includes(weekday)) return false;
    }
    return habit.done_today < habit.target_count;
  });
}

interface LocalNow {
  dateIso: string;
  hour: number;
  weekday: number;
}

function localNowFor(timezone: string, instant: Date): LocalNow {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      weekday: 'short',
    }).formatToParts(instant);

    const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const dateIso = `${lookup.year}-${lookup.month}-${lookup.day}`;
    const hour = Number(lookup.hour === '24' ? '00' : lookup.hour);
    const weekday = WEEKDAY_TO_INDEX[lookup.weekday as keyof typeof WEEKDAY_TO_INDEX] ?? 0;
    return { dateIso, hour, weekday };
  } catch {
    // Fall back to UTC if the IANA name was junk.
    const dateIso = instant.toISOString().slice(0, 10);
    return { dateIso, hour: instant.getUTCHours(), weekday: instant.getUTCDay() };
  }
}

const WEEKDAY_TO_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
} as const;
