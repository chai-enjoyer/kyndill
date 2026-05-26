import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';

// Self-view of the user's own reflections. Pulls from two tables (feedback_events
// + mood_pings) and normalizes them into a single chronological stream. General
// feedback (context = 'general_feedback') is intentionally excluded — that's
// product feedback, not diary content.
export type JournalEntryKind = 'habit_feedback' | 'recovery_reflection' | 'recovery_skipped' | 'mood_ping';
export type JournalEntrySource = 'feedback' | 'mood_ping';

export interface JournalEntry {
  source: JournalEntrySource;
  id: string;
  kind: JournalEntryKind;
  created_at: string;
  note: string | null;
  mood: string | null;
  rating: number | null;
  missed_on: string | null;
  week_of: string | null;
  habit: { id: string; name: string; category: string } | null;
}

interface FeedbackRow {
  source: 'feedback';
  id: string;
  context: string;
  created_at: Date;
  note: string | null;
  mood: string | null;
  rating: number | null;
  habit_id: string | null;
  habit_name: string | null;
  habit_category: string | null;
}

interface MoodPingRow {
  source: 'mood_ping';
  id: string;
  created_at: Date;
  week_of: Date;
  note: string | null;
  rating: number;
}

export interface ListOptions {
  limit?: number;
  before?: string;
}

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

export async function listEntries(userId: string, options: ListOptions = {}): Promise<JournalEntry[]> {
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));
  // Keyset pagination on created_at. Pulling `limit` from each source and then
  // merge-sorting can over-fetch in one dimension; that's fine at 30/page and
  // avoids a UNION ALL plan that defeats the per-table index.
  const before = options.before ?? null;

  const [feedbackRes, moodRes] = await Promise.all([
    pool.query<FeedbackRow>(
      `SELECT 'feedback'::text AS source,
              f.id::text       AS id,
              f.context,
              f.created_at,
              f.note,
              f.mood,
              f.rating,
              h.id::text       AS habit_id,
              h.name           AS habit_name,
              h.category       AS habit_category
         FROM feedback_events f
         LEFT JOIN habits h ON h.id = f.habit_id
        WHERE f.user_id = $1
          AND f.context <> 'general_feedback'
          AND ($2::timestamptz IS NULL OR f.created_at < $2)
        ORDER BY f.created_at DESC
        LIMIT $3`,
      [userId, before, limit],
    ),
    pool.query<MoodPingRow>(
      `SELECT 'mood_ping'::text AS source,
              m.id::text        AS id,
              m.created_at,
              m.week_of,
              m.note,
              m.rating
         FROM mood_pings m
        WHERE m.user_id = $1
          AND ($2::timestamptz IS NULL OR m.created_at < $2)
        ORDER BY m.created_at DESC
        LIMIT $3`,
      [userId, before, limit],
    ),
  ]);

  const merged: JournalEntry[] = [
    ...feedbackRes.rows.map(toFeedbackEntry),
    ...moodRes.rows.map(toMoodEntry),
  ];

  merged.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  return merged.slice(0, limit);
}

export async function deleteEntry(
  userId: string,
  source: JournalEntrySource,
  id: string,
): Promise<void> {
  const table = source === 'feedback' ? 'feedback_events' : 'mood_pings';
  // user_id check in the WHERE clause is the authorization gate — without it
  // any logged-in user could delete any row by guessing UUIDs.
  const { rowCount } = await pool.query(
    `DELETE FROM ${table} WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  if (rowCount === 0) {
    throw new HttpError(404, 'ENTRY_NOT_FOUND', 'No journal entry to delete.');
  }
}

function toFeedbackEntry(row: FeedbackRow): JournalEntry {
  const { kind, missedOn } = classifyFeedback(row.context);
  return {
    source: 'feedback',
    id: row.id,
    kind,
    created_at: row.created_at.toISOString(),
    note: row.note,
    mood: row.mood,
    rating: row.rating,
    missed_on: missedOn,
    week_of: null,
    habit:
      row.habit_id && row.habit_name && row.habit_category
        ? { id: row.habit_id, name: row.habit_name, category: row.habit_category }
        : null,
  };
}

function toMoodEntry(row: MoodPingRow): JournalEntry {
  return {
    source: 'mood_ping',
    id: row.id,
    kind: 'mood_ping',
    created_at: row.created_at.toISOString(),
    note: row.note,
    mood: null,
    rating: row.rating,
    missed_on: null,
    week_of: row.week_of.toISOString().slice(0, 10),
    habit: null,
  };
}

function classifyFeedback(context: string): { kind: JournalEntryKind; missedOn: string | null } {
  if (context === 'habit_completion') return { kind: 'habit_feedback', missedOn: null };
  if (context.startsWith('recovery_reflection:')) {
    return { kind: 'recovery_reflection', missedOn: context.split(':')[1] ?? null };
  }
  if (context.startsWith('recovery_skipped:')) {
    return { kind: 'recovery_skipped', missedOn: context.split(':')[1] ?? null };
  }
  // Fallback: treat anything else as habit_feedback to keep the stream usable.
  return { kind: 'habit_feedback', missedOn: null };
}
