import { pool } from '../db/pool';

type HabitCategory = 'Health' | 'Productivity' | 'Social' | 'Learning' | 'Wellness';
type HabitFrequency = 'daily' | 'weekly';

interface HabitScheduleRow {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  days_of_week: number[] | null;
  target_count: number;
  created_on: string;
}

interface CompletionRow {
  habit_id: string;
  completed_on: string;
  completion_count: number;
  target_count: number;
}

export interface RecoveryPrompt {
  missed_on: string;
  missed_habits: Array<{
    id: string;
    name: string;
    category: HabitCategory;
    completion_count: number;
    target_count: number;
  }>;
}

export interface RecoveryReflectionInput {
  missed_on: string;
  habit_id?: string;
  mood?: string;
  note?: string;
  skipped?: boolean;
}

export async function getPrompt(userId: string): Promise<RecoveryPrompt | null> {
  const today = startOfUtcDay(new Date());
  const start = addUtcDays(today, -7);
  const startStr = toIsoDate(start);
  const yesterday = addUtcDays(today, -1);
  const yesterdayStr = toIsoDate(yesterday);

  const [{ rows: habits }, { rows: completions }, { rows: recoveryEvents }] = await Promise.all([
    pool.query<HabitScheduleRow>(
      `SELECT id,
              name,
              category,
              frequency,
              days_of_week,
              target_count,
              to_char(created_at, 'YYYY-MM-DD') AS created_on
         FROM habits
        WHERE user_id = $1
          AND is_active = TRUE`,
      [userId],
    ),
    pool.query<CompletionRow>(
      `SELECT habit_id,
              to_char(completed_on, 'YYYY-MM-DD') AS completed_on,
              completion_count,
              target_count
         FROM habit_completions
        WHERE user_id = $1
          AND completed_on BETWEEN $2::date AND $3::date`,
      [userId, startStr, yesterdayStr],
    ),
    pool.query<{ context: string }>(
      `SELECT context
         FROM feedback_events
        WHERE user_id = $1
          AND context LIKE 'recovery_%:%'
          AND created_at >= NOW() - INTERVAL '30 days'`,
      [userId],
    ),
  ]);

  if (habits.length === 0) return null;

  const handledDates = new Set(
    recoveryEvents
      .map((event) => event.context.split(':')[1])
      .filter((value): value is string => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')),
  );

  const completionsByHabitDate = new Map<string, CompletionRow>();
  for (const completion of completions) {
    completionsByHabitDate.set(`${completion.habit_id}:${completion.completed_on}`, completion);
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const date = addUtcDays(today, -offset);
    const dateStr = toIsoDate(date);
    if (handledDates.has(dateStr)) continue;

    const missed = habits
      .filter((habit) => isHabitExpectedOnDate(habit, date))
      .map((habit) => {
        const completion = completionsByHabitDate.get(`${habit.id}:${dateStr}`);
        const targetCount = completion?.target_count ?? habit.target_count;
        const completionCount = completion?.completion_count ?? 0;
        if (completionCount >= targetCount) return null;
        return {
          id: habit.id,
          name: habit.name,
          category: habit.category,
          completion_count: completionCount,
          target_count: targetCount,
        };
      })
      .filter((habit): habit is NonNullable<typeof habit> => habit !== null);

    if (missed.length > 0) {
      return { missed_on: dateStr, missed_habits: missed.slice(0, 4) };
    }
  }

  return null;
}

export async function saveReflection(
  userId: string,
  input: RecoveryReflectionInput,
): Promise<void> {
  const context = `${input.skipped ? 'recovery_skipped' : 'recovery_reflection'}:${input.missed_on}`;
  await pool.query(
    `INSERT INTO feedback_events (user_id, habit_id, context, mood, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      input.habit_id ?? null,
      context,
      input.mood ?? null,
      input.note?.trim() ? input.note.trim() : null,
    ],
  );
}

function isHabitExpectedOnDate(habit: HabitScheduleRow, date: Date): boolean {
  const dateStr = toIsoDate(date);
  if (dateStr < habit.created_on) return false;
  if (habit.frequency === 'daily') return true;
  return Array.isArray(habit.days_of_week) && habit.days_of_week.includes(date.getUTCDay());
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
