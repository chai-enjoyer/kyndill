import { pool } from '../db/pool';
import { sendPushToUser } from './pushService';

interface MoodPingCandidate {
  id: string;
  reminder_timezone: string;
  created_at: Date;
  last_ping_sent: string | null;
  has_ping_this_week: boolean;
}

const PING_HOUR = 10;
const PING_WEEKDAY = 1; // Monday
const FIRST_PING_DELAY_DAYS = 7;

// Lines mirror the in-app modal voice: a short, gentle nudge without alarm.
const MOOD_LINES = [
  'A quick check-in: how did your week feel?',
  'Open Kyndill for a one-question weekly check-in.',
  'How are you doing this week? Tap to leave a note.',
];

export async function runHourlyMoodPingTick(now: Date = new Date()): Promise<void> {
  const start = Date.now();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const { rows: users } = await pool.query<MoodPingCandidate>(
    `SELECT u.id,
            COALESCE(u.reminder_timezone, 'UTC') AS reminder_timezone,
            u.created_at,
            to_char(u.last_mood_ping_sent, 'YYYY-MM-DD') AS last_ping_sent,
            EXISTS (
              SELECT 1 FROM mood_pings m
               WHERE m.user_id = u.id
                 AND m.week_of = date_trunc('week', NOW())::date
            ) AS has_ping_this_week
       FROM users u
      WHERE COALESCE((u.notification_prefs->>'moodPing')::boolean, FALSE) = TRUE
        AND EXISTS (
          SELECT 1 FROM push_subscriptions p WHERE p.user_id = u.id
        )`,
  );

  for (const user of users) {
    try {
      const local = localNowFor(user.reminder_timezone, now);
      if (local.weekday !== PING_WEEKDAY || local.hour !== PING_HOUR) {
        skipped += 1;
        continue;
      }

      const ageDays = (now.getTime() - new Date(user.created_at).getTime()) / 86_400_000;
      if (ageDays < FIRST_PING_DELAY_DAYS) {
        skipped += 1;
        continue;
      }

      if (user.has_ping_this_week) {
        skipped += 1;
        continue;
      }

      if (user.last_ping_sent === local.dateIso) {
        skipped += 1;
        continue;
      }

      const body = MOOD_LINES[Math.floor(Math.random() * MOOD_LINES.length)];
      await sendPushToUser(
        user.id,
        {
          title: 'Kyndill weekly check-in',
          body,
          url: '/',
          tag: 'mood_ping',
        },
        'mood_ping',
      );

      await pool.query(
        `UPDATE users SET last_mood_ping_sent = $1::date WHERE id = $2`,
        [local.dateIso, user.id],
      );
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`[mood-ping] failed for user ${user.id}:`, err);
    }
  }

  const ms = Date.now() - start;
  console.log(
    `[mood-ping] tick: ${users.length} candidates, ${sent} sent, ${skipped} skipped, ${failed} failed, ${ms}ms`,
  );
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
