import { pool } from '../../src/db/pool';

// All exports key on research_pseudonym, NEVER users.id. Identifying fields
// (email, display_name, username, avatar_url, bio) are never SELECTed by
// the queries below.

export interface TableSpec {
  key: string;
  label: string;
  description: string;
  countQuery: string;
  rowsSql: (filter: DateFilter) => { text: string; values: unknown[] };
  columns: string[];
}

export interface DateFilter {
  from: string | null;
  to: string | null;
  limit: number;
  offset: number;
}

const ALL_TABLES: TableSpec[] = [
  {
    key: 'users',
    label: 'Users (anonymized)',
    description: 'One row per consented research participant. Pseudonym only.',
    countQuery: `SELECT COUNT(*)::int AS n FROM users WHERE research_consent = TRUE`,
    columns: [
      'pseudonym',
      'level',
      'xp',
      'coins',
      'streak_current',
      'streak_longest',
      'reminder_hour',
      'reminder_timezone',
      'research_consent',
      'share_text_consent',
      'created_at',
    ],
    rowsSql: ({ from, to, limit, offset }) => ({
      text: `
        SELECT research_pseudonym::text AS pseudonym,
               level, xp, coins,
               streak_current, streak_longest,
               reminder_hour, reminder_timezone,
               research_consent,
               share_text_consent,
               to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
          FROM users
         WHERE research_consent = TRUE
           AND ($1::timestamptz IS NULL OR created_at >= $1)
           AND ($2::timestamptz IS NULL OR created_at <  $2)
         ORDER BY created_at ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
  {
    key: 'habits',
    label: 'Habits',
    description: 'Habits created by consented users. Name is hashed to length only.',
    countQuery: `
      SELECT COUNT(*)::int AS n
        FROM habits h JOIN users u ON u.id = h.user_id
       WHERE u.research_consent = TRUE
    `,
    columns: [
      'habit_id',
      'pseudonym',
      'name',
      'name_length',
      'category',
      'frequency',
      'target_count',
      'days_of_week',
      'is_active',
      'created_at',
    ],
    rowsSql: ({ from, to, limit, offset }) => ({
      // `name` is only populated for users who opted into text sharing.
      // `name_length` stays so length-only analysis still works across the
      // whole consented cohort.
      text: `
        SELECT h.id::text          AS habit_id,
               u.research_pseudonym::text AS pseudonym,
               CASE WHEN u.share_text_consent THEN h.name ELSE NULL END AS name,
               char_length(h.name) AS name_length,
               h.category,
               h.frequency,
               h.target_count,
               COALESCE(h.days_of_week::text, '') AS days_of_week,
               h.is_active,
               to_char(h.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
          FROM habits h
          JOIN users u ON u.id = h.user_id
         WHERE u.research_consent = TRUE
           AND ($1::timestamptz IS NULL OR h.created_at >= $1)
           AND ($2::timestamptz IS NULL OR h.created_at <  $2)
         ORDER BY h.created_at ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
  {
    key: 'habit_completions',
    label: 'Habit completions',
    description: 'Every habit check-in for consented users.',
    countQuery: `
      SELECT COUNT(*)::int AS n
        FROM habit_completions c JOIN users u ON u.id = c.user_id
       WHERE u.research_consent = TRUE
    `,
    columns: [
      'pseudonym',
      'habit_id',
      'completed_on',
      'completion_count',
      'target_count',
      'completed_at',
    ],
    rowsSql: ({ from, to, limit, offset }) => ({
      text: `
        SELECT u.research_pseudonym::text AS pseudonym,
               c.habit_id::text AS habit_id,
               to_char(c.completed_on, 'YYYY-MM-DD') AS completed_on,
               c.completion_count,
               c.target_count,
               to_char(c.completed_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS completed_at
          FROM habit_completions c
          JOIN users u ON u.id = c.user_id
         WHERE u.research_consent = TRUE
           AND ($1::timestamptz IS NULL OR c.completed_at >= $1)
           AND ($2::timestamptz IS NULL OR c.completed_at <  $2)
         ORDER BY c.completed_at ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
  {
    key: 'focus_sessions',
    label: 'Focus sessions',
    description: 'Focus timer sessions with optional rating.',
    countQuery: `
      SELECT COUNT(*)::int AS n
        FROM focus_sessions f JOIN users u ON u.id = f.user_id
       WHERE u.research_consent = TRUE
    `,
    columns: ['pseudonym', 'session_id', 'duration_minutes', 'rating', 'completed_at'],
    rowsSql: ({ from, to, limit, offset }) => ({
      text: `
        SELECT u.research_pseudonym::text AS pseudonym,
               f.id::text AS session_id,
               f.duration_minutes,
               f.rating,
               to_char(f.completed_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS completed_at
          FROM focus_sessions f
          JOIN users u ON u.id = f.user_id
         WHERE u.research_consent = TRUE
           AND ($1::timestamptz IS NULL OR f.completed_at >= $1)
           AND ($2::timestamptz IS NULL OR f.completed_at <  $2)
         ORDER BY f.completed_at ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
  {
    key: 'feedback_events',
    label: 'Feedback events',
    description: 'Habit-completion moods, recovery reflections, general feedback.',
    countQuery: `
      SELECT COUNT(*)::int AS n
        FROM feedback_events f JOIN users u ON u.id = f.user_id
       WHERE u.research_consent = TRUE
    `,
    columns: ['pseudonym', 'context', 'mood', 'rating', 'note', 'note_length', 'habit_id', 'created_at'],
    rowsSql: ({ from, to, limit, offset }) => ({
      text: `
        SELECT u.research_pseudonym::text AS pseudonym,
               f.context,
               f.mood,
               f.rating,
               CASE WHEN u.share_text_consent THEN f.note ELSE NULL END AS note,
               char_length(COALESCE(f.note, '')) AS note_length,
               COALESCE(f.habit_id::text, '') AS habit_id,
               to_char(f.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
          FROM feedback_events f
          JOIN users u ON u.id = f.user_id
         WHERE u.research_consent = TRUE
           AND ($1::timestamptz IS NULL OR f.created_at >= $1)
           AND ($2::timestamptz IS NULL OR f.created_at <  $2)
         ORDER BY f.created_at ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
  {
    key: 'analytics_events',
    label: 'Analytics events',
    description: 'Page views, feature interactions, system events.',
    countQuery: `
      SELECT COUNT(*)::int AS n
        FROM analytics_events e JOIN users u ON u.id = e.user_id
       WHERE u.research_consent = TRUE
    `,
    columns: ['pseudonym', 'event_type', 'properties', 'created_at'],
    rowsSql: ({ from, to, limit, offset }) => ({
      text: `
        SELECT u.research_pseudonym::text AS pseudonym,
               e.event_type,
               e.properties::text AS properties,
               to_char(e.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
          FROM analytics_events e
          JOIN users u ON u.id = e.user_id
         WHERE u.research_consent = TRUE
           AND ($1::timestamptz IS NULL OR e.created_at >= $1)
           AND ($2::timestamptz IS NULL OR e.created_at <  $2)
         ORDER BY e.created_at ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
  {
    key: 'mood_pings',
    label: 'Weekly mood pings',
    description: 'One row per opted-in user per ISO-week.',
    countQuery: `
      SELECT COUNT(*)::int AS n
        FROM mood_pings m JOIN users u ON u.id = m.user_id
       WHERE u.research_consent = TRUE
    `,
    columns: ['pseudonym', 'week_of', 'rating', 'note', 'note_length', 'created_at'],
    rowsSql: ({ from, to, limit, offset }) => ({
      text: `
        SELECT u.research_pseudonym::text AS pseudonym,
               to_char(m.week_of, 'YYYY-MM-DD') AS week_of,
               m.rating,
               CASE WHEN u.share_text_consent THEN m.note ELSE NULL END AS note,
               char_length(COALESCE(m.note, '')) AS note_length,
               to_char(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
          FROM mood_pings m
          JOIN users u ON u.id = m.user_id
         WHERE u.research_consent = TRUE
           AND ($1::timestamptz IS NULL OR m.created_at >= $1)
           AND ($2::timestamptz IS NULL OR m.created_at <  $2)
         ORDER BY m.week_of ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
  {
    key: 'onboarding_quiz',
    label: 'Onboarding quiz',
    description: 'Baseline answers per user, one row each.',
    countQuery: `
      SELECT COUNT(*)::int AS n
        FROM onboarding_quiz_responses q JOIN users u ON u.id = q.user_id
       WHERE u.research_consent = TRUE
    `,
    columns: ['pseudonym', 'answers', 'created_at'],
    rowsSql: ({ from, to, limit, offset }) => ({
      text: `
        SELECT u.research_pseudonym::text AS pseudonym,
               q.answers::text AS answers,
               to_char(q.created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
          FROM onboarding_quiz_responses q
          JOIN users u ON u.id = q.user_id
         WHERE u.research_consent = TRUE
           AND ($1::timestamptz IS NULL OR q.created_at >= $1)
           AND ($2::timestamptz IS NULL OR q.created_at <  $2)
         ORDER BY q.created_at ASC
         LIMIT $3 OFFSET $4
      `,
      values: [from, to, limit, offset],
    }),
  },
];

const tableMap: Record<string, TableSpec> = Object.fromEntries(
  ALL_TABLES.map((t) => [t.key, t]),
);

export function listTables(): { key: string; label: string; description: string }[] {
  return ALL_TABLES.map(({ key, label, description }) => ({ key, label, description }));
}

export async function getTableCount(key: string): Promise<number> {
  const spec = tableMap[key];
  if (!spec) throw new Error(`Unknown table: ${key}`);
  const { rows } = await pool.query<{ n: number }>(spec.countQuery);
  return rows[0]?.n ?? 0;
}

export async function getRows(
  key: string,
  filter: DateFilter,
): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const spec = tableMap[key];
  if (!spec) throw new Error(`Unknown table: ${key}`);
  const { text, values } = spec.rowsSql(filter);
  const { rows } = await pool.query<Record<string, unknown>>(text, values);
  return { columns: spec.columns, rows };
}

export function getTableSpec(key: string): TableSpec | null {
  return tableMap[key] ?? null;
}
