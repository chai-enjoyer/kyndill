import { pool } from '../db/pool';

type HabitCategory = 'Health' | 'Productivity' | 'Social' | 'Learning' | 'Wellness';
type HabitFrequency = 'daily' | 'weekly';

const CATEGORIES: HabitCategory[] = ['Health', 'Productivity', 'Social', 'Learning', 'Wellness'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

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

export interface ProgressSummary {
  generated_at: string;
  overview: {
    total_habits_created: number;
    active_habits: number;
    total_check_ins: number;
    total_completed_days: number;
    active_days: number;
    current_streak: number;
    longest_streak: number;
    focus_minutes: number;
    focus_sessions: number;
    friends: number;
    gifts_sent: number;
    gifts_received: number;
    feedback_entries: number;
    recovery_reflections: number;
    weekly_completion_rate: number;
  };
  weekly: Array<{
    date: string;
    label: string;
    completed: number;
    target: number;
    rate: number | null;
  }>;
  most_consistent_habit: {
    id: string;
    name: string;
    category: HabitCategory;
    completed_days: number;
    expected_days: number;
    rate: number;
  } | null;
  category_breakdown: Array<{
    category: HabitCategory;
    completions: number;
    check_ins: number;
  }>;
  social: {
    friends: number;
    gifts_sent: number;
    gifts_received: number;
  };
}

export async function getSummary(userId: string): Promise<ProgressSummary> {
  const today = startOfUtcDay(new Date());
  const weekStart = addUtcDays(today, -6);
  const monthStart = addUtcDays(today, -29);
  const todayStr = toIsoDate(today);
  const weekStartStr = toIsoDate(weekStart);
  const monthStartStr = toIsoDate(monthStart);

  const [
    habitCountsResult,
    completionCountsResult,
    streakResult,
    focusResult,
    friendsResult,
    giftsResult,
    habitsResult,
    weeklyCompletionsResult,
    monthlyCompletionsResult,
    categoryResult,
    feedbackResult,
  ] = await Promise.all([
    pool.query<{ total_habits_created: number; active_habits: number }>(
      `SELECT COUNT(*)::int AS total_habits_created,
              (COUNT(*) FILTER (WHERE is_active = TRUE))::int AS active_habits
         FROM habits
        WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{
      total_check_ins: number;
      total_completed_days: number;
      active_days: number;
    }>(
      `SELECT COALESCE(SUM(completion_count), 0)::int AS total_check_ins,
              (COUNT(*) FILTER (WHERE completion_count >= target_count))::int AS total_completed_days,
              COUNT(DISTINCT completed_on)::int AS active_days
         FROM habit_completions
        WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{ current_streak: number; longest_streak: number }>(
      `SELECT current_streak, longest_streak
         FROM streaks
        WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{ focus_minutes: number; focus_sessions: number }>(
      `SELECT COALESCE(SUM(duration_minutes), 0)::int AS focus_minutes,
              COUNT(*)::int AS focus_sessions
         FROM focus_sessions
        WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{ friends: number }>(
      `SELECT COUNT(*)::int AS friends
         FROM friends
        WHERE user_id = $1`,
      [userId],
    ),
    pool.query<{ gifts_sent: number; gifts_received: number }>(
      `SELECT (COUNT(*) FILTER (WHERE from_user_id = $1))::int AS gifts_sent,
              (COUNT(*) FILTER (WHERE to_user_id = $1))::int AS gifts_received
         FROM gifts
        WHERE from_user_id = $1 OR to_user_id = $1`,
      [userId],
    ),
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
          AND is_active = TRUE
        ORDER BY sort_order ASC, created_at ASC`,
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
      [userId, weekStartStr, todayStr],
    ),
    pool.query<CompletionRow>(
      `SELECT habit_id,
              to_char(completed_on, 'YYYY-MM-DD') AS completed_on,
              completion_count,
              target_count
         FROM habit_completions
        WHERE user_id = $1
          AND completed_on BETWEEN $2::date AND $3::date`,
      [userId, monthStartStr, todayStr],
    ),
    pool.query<{ category: HabitCategory; completions: number; check_ins: number }>(
      `SELECT h.category,
              (COUNT(hc.id) FILTER (WHERE hc.completion_count >= hc.target_count))::int AS completions,
              COALESCE(SUM(hc.completion_count), 0)::int AS check_ins
         FROM habits h
         LEFT JOIN habit_completions hc
           ON hc.habit_id = h.id
          AND hc.user_id = h.user_id
        WHERE h.user_id = $1
        GROUP BY h.category`,
      [userId],
    ),
    pool.query<{ feedback_entries: number; recovery_reflections: number }>(
      `SELECT COUNT(*)::int AS feedback_entries,
              (COUNT(*) FILTER (WHERE context LIKE 'recovery_reflection:%'))::int AS recovery_reflections
         FROM feedback_events
        WHERE user_id = $1`,
      [userId],
    ),
  ]);

  const habitCounts = habitCountsResult.rows[0] ?? { total_habits_created: 0, active_habits: 0 };
  const completionCounts = completionCountsResult.rows[0] ?? {
    total_check_ins: 0,
    total_completed_days: 0,
    active_days: 0,
  };
  const streak = streakResult.rows[0] ?? { current_streak: 0, longest_streak: 0 };
  const focus = focusResult.rows[0] ?? { focus_minutes: 0, focus_sessions: 0 };
  const friends = friendsResult.rows[0]?.friends ?? 0;
  const gifts = giftsResult.rows[0] ?? { gifts_sent: 0, gifts_received: 0 };
  const feedback = feedbackResult.rows[0] ?? { feedback_entries: 0, recovery_reflections: 0 };

  const weekly = buildWeeklySummary(
    habitsResult.rows,
    weeklyCompletionsResult.rows,
    weekStart,
    today,
  );
  const weeklyRates = weekly
    .map((day) => day.rate)
    .filter((rate): rate is number => rate !== null);
  const weeklyCompletionRate =
    weeklyRates.length > 0
      ? Math.round(weeklyRates.reduce((sum, rate) => sum + rate, 0) / weeklyRates.length)
      : 0;

  return {
    generated_at: new Date().toISOString(),
    overview: {
      total_habits_created: habitCounts.total_habits_created,
      active_habits: habitCounts.active_habits,
      total_check_ins: completionCounts.total_check_ins,
      total_completed_days: completionCounts.total_completed_days,
      active_days: completionCounts.active_days,
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      focus_minutes: focus.focus_minutes,
      focus_sessions: focus.focus_sessions,
      friends,
      gifts_sent: gifts.gifts_sent,
      gifts_received: gifts.gifts_received,
      feedback_entries: feedback.feedback_entries,
      recovery_reflections: feedback.recovery_reflections,
      weekly_completion_rate: weeklyCompletionRate,
    },
    weekly,
    most_consistent_habit: findMostConsistentHabit(
      habitsResult.rows,
      monthlyCompletionsResult.rows,
      monthStart,
      today,
    ),
    category_breakdown: normalizeCategoryBreakdown(categoryResult.rows),
    social: {
      friends,
      gifts_sent: gifts.gifts_sent,
      gifts_received: gifts.gifts_received,
    },
  };
}

function buildWeeklySummary(
  habits: HabitScheduleRow[],
  completions: CompletionRow[],
  start: Date,
  end: Date,
): ProgressSummary['weekly'] {
  const completionByDate = new Map<string, CompletionRow[]>();
  for (const completion of completions) {
    const rows = completionByDate.get(completion.completed_on) ?? [];
    rows.push(completion);
    completionByDate.set(completion.completed_on, rows);
  }

  return eachUtcDate(start, end).map((date) => {
    const dateStr = toIsoDate(date);
    const scheduledTarget = habits.reduce((sum, habit) => {
      if (!isHabitExpectedOnDate(habit, date)) return sum;
      return sum + habit.target_count;
    }, 0);
    const completed = (completionByDate.get(dateStr) ?? []).reduce(
      (sum, completion) =>
        sum + Math.min(completion.completion_count, completion.target_count),
      0,
    );

    return {
      date: dateStr,
      label: WEEKDAY_LABELS[date.getUTCDay()],
      completed,
      target: scheduledTarget,
      rate: scheduledTarget > 0 ? Math.round((completed / scheduledTarget) * 100) : null,
    };
  });
}

function findMostConsistentHabit(
  habits: HabitScheduleRow[],
  completions: CompletionRow[],
  start: Date,
  end: Date,
): ProgressSummary['most_consistent_habit'] {
  if (habits.length === 0) return null;

  const completedDatesByHabit = new Map<string, Set<string>>();
  for (const completion of completions) {
    if (completion.completion_count < completion.target_count) continue;
    const dates = completedDatesByHabit.get(completion.habit_id) ?? new Set<string>();
    dates.add(completion.completed_on);
    completedDatesByHabit.set(completion.habit_id, dates);
  }

  let best: ProgressSummary['most_consistent_habit'] = null;
  for (const habit of habits) {
    const expectedDays = eachUtcDate(start, end).filter((date) =>
      isHabitExpectedOnDate(habit, date),
    ).length;
    if (expectedDays === 0) continue;
    const completedDays = completedDatesByHabit.get(habit.id)?.size ?? 0;
    const rate = Math.round((completedDays / expectedDays) * 100);
    const candidate = {
      id: habit.id,
      name: habit.name,
      category: habit.category,
      completed_days: completedDays,
      expected_days: expectedDays,
      rate,
    };
    if (
      best === null ||
      candidate.rate > best.rate ||
      (candidate.rate === best.rate && candidate.completed_days > best.completed_days)
    ) {
      best = candidate;
    }
  }

  return best;
}

function normalizeCategoryBreakdown(
  rows: Array<{ category: HabitCategory; completions: number; check_ins: number }>,
): ProgressSummary['category_breakdown'] {
  const byCategory = new Map(rows.map((row) => [row.category, row]));
  return CATEGORIES.map((category) => {
    const row = byCategory.get(category);
    return {
      category,
      completions: row?.completions ?? 0,
      check_ins: row?.check_ins ?? 0,
    };
  });
}

function isHabitExpectedOnDate(habit: HabitScheduleRow, date: Date): boolean {
  const dateStr = toIsoDate(date);
  if (dateStr < habit.created_on) return false;
  if (habit.frequency === 'daily') return true;
  return Array.isArray(habit.days_of_week) && habit.days_of_week.includes(date.getUTCDay());
}

function eachUtcDate(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
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
