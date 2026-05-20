import type { HabitCategory, HabitFormInput, HabitFrequency } from '../hooks/useHabits';

export type HabitIntent = 'body' | 'mind' | 'heart' | 'space' | 'creative';
export type HabitTimeOfDay = 'morning' | 'midday' | 'evening' | 'flexible' | 'weekend';
export type HabitEffort = 'tiny' | 'medium' | 'larger';

export interface HabitTemplate extends HabitFormInput {
  id: string;
  summary: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  recommended?: boolean;
  // Onboarding quiz metadata. Optional so older call sites and tests stay
  // compatible; new pickStarterTemplates() expects them on most rows.
  intents?: HabitIntent[];
  time_of_day?: HabitTimeOfDay;
  effort?: HabitEffort;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // ─── Body care ───
  {
    id: 'drink-water',
    name: 'Drink water',
    description: 'Log a glass of water throughout the day.',
    summary: 'A repeatable health habit for daily care.',
    category: 'Health',
    frequency: 'daily',
    target_count: 4,
    recommended: true,
    intents: ['body'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'morning-meal',
    name: 'Eat a real meal',
    description: 'Make space for one nourishing meal.',
    summary: 'A simple anchor for hunger and energy.',
    category: 'Health',
    frequency: 'daily',
    intents: ['body'],
    time_of_day: 'morning',
    effort: 'medium',
  },
  {
    id: 'sleep-wind-down',
    name: 'Start wind-down',
    description: 'Begin a calmer evening routine before bed.',
    summary: 'A gentle habit for better rest.',
    category: 'Wellness',
    frequency: 'daily',
    intents: ['body', 'heart'],
    time_of_day: 'evening',
    effort: 'tiny',
  },
  {
    id: 'walk-10',
    name: 'Take a 10 minute walk',
    description: 'Step outside or move around for ten minutes.',
    summary: 'Low-friction movement that stacks well.',
    category: 'Wellness',
    frequency: 'daily',
    recommended: true,
    intents: ['body'],
    time_of_day: 'flexible',
    effort: 'medium',
  },
  {
    id: 'movement-breaks',
    name: 'Take a movement break',
    description: 'Stand up, stretch, or walk briefly during the day.',
    summary: 'Repeatable energy reset for desk days.',
    category: 'Wellness',
    frequency: 'daily',
    target_count: 3,
    intents: ['body'],
    time_of_day: 'midday',
    effort: 'tiny',
  },
  {
    id: 'stretch-5',
    name: 'Stretch for 5 minutes',
    description: 'A short, gentle stretch to loosen up.',
    summary: 'Easy entry point for body care, no equipment.',
    category: 'Wellness',
    frequency: 'daily',
    intents: ['body'],
    time_of_day: 'morning',
    effort: 'tiny',
  },
  {
    id: 'breathwork-3',
    name: 'Three deep breaths',
    description: 'Pause and take three slow, full breaths.',
    summary: 'A 30-second nervous system reset.',
    category: 'Wellness',
    frequency: 'daily',
    target_count: 2,
    intents: ['body', 'heart'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'screens-off-bed',
    name: 'Phone away before bed',
    description: 'Set the phone aside 30 minutes before sleep.',
    summary: 'Helps wind-down and rest quality.',
    category: 'Wellness',
    frequency: 'daily',
    intents: ['body'],
    time_of_day: 'evening',
    effort: 'tiny',
  },
  {
    id: 'hydrate-pre-coffee',
    name: 'Water before coffee',
    description: 'Drink a glass of water before your first coffee.',
    summary: 'Tiny habit that anchors hydration to a daily cue.',
    category: 'Health',
    frequency: 'daily',
    intents: ['body'],
    time_of_day: 'morning',
    effort: 'tiny',
  },
  {
    id: 'sun-5',
    name: 'Five minutes of daylight',
    description: 'Step outside or open a window for natural light.',
    summary: 'Gentle support for energy and sleep cycles.',
    category: 'Wellness',
    frequency: 'daily',
    intents: ['body'],
    time_of_day: 'morning',
    effort: 'tiny',
  },

  // ─── Mental clarity ───
  {
    id: 'plan-tomorrow',
    name: 'Plan tomorrow',
    description: "Write the next day's top priorities.",
    summary: 'A small evening productivity reset.',
    category: 'Productivity',
    frequency: 'daily',
    recommended: true,
    intents: ['mind', 'space'],
    time_of_day: 'evening',
    effort: 'tiny',
  },
  {
    id: 'focus-block',
    name: 'Finish a focus block',
    description: 'Complete one focused work block without multitasking.',
    summary: 'Pairs naturally with the Focus page.',
    category: 'Productivity',
    frequency: 'daily',
    intents: ['mind'],
    time_of_day: 'midday',
    effort: 'medium',
  },
  {
    id: 'pomodoro-block',
    name: 'One pomodoro',
    description: 'Set a 25 minute timer and work without switching tasks.',
    summary: 'Structured focus, smaller than a full block.',
    category: 'Productivity',
    frequency: 'daily',
    intents: ['mind'],
    time_of_day: 'midday',
    effort: 'medium',
  },
  {
    id: 'daily-shutdown',
    name: 'Daily shutdown',
    description: 'Close tabs, jot tomorrow, step away from work.',
    summary: 'Marks the end of the workday clearly.',
    category: 'Productivity',
    frequency: 'daily',
    intents: ['mind', 'space'],
    time_of_day: 'evening',
    effort: 'tiny',
  },

  // ─── Tidy surroundings ───
  {
    id: 'ten-minute-tidy',
    name: '10 minute tidy',
    description: 'Reset one small physical or digital space.',
    summary: 'A quick cleanup with visible payoff.',
    category: 'Productivity',
    frequency: 'daily',
    intents: ['space'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'inbox-10',
    name: 'Inbox ten',
    description: 'Spend ten minutes triaging your inbox.',
    summary: 'Keeps email from becoming a weekly avalanche.',
    category: 'Productivity',
    frequency: 'daily',
    intents: ['space'],
    time_of_day: 'midday',
    effort: 'tiny',
  },
  {
    id: 'desk-reset',
    name: 'Reset your desk',
    description: 'Clear your desk surface at the end of the day.',
    summary: 'Tomorrow-you walks in to a calm space.',
    category: 'Productivity',
    frequency: 'daily',
    intents: ['space'],
    time_of_day: 'evening',
    effort: 'tiny',
  },
  {
    id: 'one-thing-away',
    name: 'Put one thing away',
    description: 'Find one out-of-place item and return it.',
    summary: 'Tiny tidy that compounds across a room.',
    category: 'Productivity',
    frequency: 'daily',
    intents: ['space'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },

  // ─── Learning / Creative ───
  {
    id: 'read-10',
    name: 'Read 10 pages',
    description: 'Read a book, article, or study material.',
    summary: 'A learning habit that compounds over time.',
    category: 'Learning',
    frequency: 'daily',
    recommended: true,
    intents: ['mind'],
    time_of_day: 'evening',
    effort: 'medium',
  },
  {
    id: 'practice-skill',
    name: 'Practice a skill',
    description: 'Spend 15 minutes on a skill you want to improve.',
    summary: 'Good for language, music, coding, or art.',
    category: 'Learning',
    frequency: 'daily',
    intents: ['mind', 'creative'],
    time_of_day: 'flexible',
    effort: 'medium',
  },
  {
    id: 'review-notes',
    name: 'Review notes',
    description: "Revisit notes, flashcards, or yesterday's learning.",
    summary: 'Keeps learning fresh without a big session.',
    category: 'Learning',
    frequency: 'daily',
    intents: ['mind'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'language-flashcards',
    name: 'Language flashcards',
    description: 'Run a short flashcard set for a language.',
    summary: 'Five minutes a day beats a weekend cram.',
    category: 'Learning',
    frequency: 'daily',
    intents: ['mind'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'write-100',
    name: 'Write 100 words',
    description: 'Open a doc and write any 100 words.',
    summary: 'Tiny floor for a writing practice.',
    category: 'Learning',
    frequency: 'daily',
    intents: ['creative', 'mind'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'sketch-5',
    name: 'Sketch for 5 minutes',
    description: 'Open a sketchbook and draw something quickly.',
    summary: 'Lowers the bar for a creative practice.',
    category: 'Learning',
    frequency: 'daily',
    intents: ['creative'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'play-instrument',
    name: 'Play instrument',
    description: 'Pick up an instrument and play, even briefly.',
    summary: 'Frequency matters more than session length.',
    category: 'Learning',
    frequency: 'daily',
    intents: ['creative'],
    time_of_day: 'flexible',
    effort: 'medium',
  },

  // ─── Emotional grounding ───
  {
    id: 'message-friend',
    name: 'Message one friend',
    description: 'Send a short check-in to someone you care about.',
    summary: 'A gentle social accountability habit.',
    category: 'Social',
    frequency: 'daily',
    intents: ['heart'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'gratitude-note',
    name: 'Write a gratitude note',
    description: 'Write down one thing you appreciated today.',
    summary: 'Tiny reflection with a warmer mood loop.',
    category: 'Social',
    frequency: 'daily',
    intents: ['heart'],
    time_of_day: 'evening',
    effort: 'tiny',
  },
  {
    id: 'journal-3-lines',
    name: 'Journal three lines',
    description: 'Three lines on how today felt. Anything.',
    summary: 'Smallest possible journaling practice.',
    category: 'Wellness',
    frequency: 'daily',
    intents: ['heart'],
    time_of_day: 'evening',
    effort: 'tiny',
  },
  {
    id: 'mindful-pause',
    name: 'Mindful pause',
    description: 'Sit still for two minutes. Notice what you notice.',
    summary: 'A pocket-sized meditation practice.',
    category: 'Wellness',
    frequency: 'daily',
    intents: ['heart'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },
  {
    id: 'thanks-someone',
    name: 'Thank someone',
    description: 'Send a quick thank-you message to someone.',
    summary: 'Warm both ends of a small interaction.',
    category: 'Social',
    frequency: 'daily',
    intents: ['heart'],
    time_of_day: 'flexible',
    effort: 'tiny',
  },

  // ─── Weekly ───
  {
    id: 'weekly-review',
    name: 'Weekly review',
    description: "Review the week and choose next week's priorities.",
    summary: 'A Sunday reset for long-term consistency.',
    category: 'Productivity',
    frequency: 'weekly',
    days_of_week: [0],
    intents: ['mind', 'space'],
    time_of_day: 'weekend',
    effort: 'medium',
  },
  {
    id: 'meal-prep',
    name: 'Plan meals',
    description: 'Choose a few meals or snacks for the week.',
    summary: 'A weekly support habit for easier healthy days.',
    category: 'Health',
    frequency: 'weekly',
    days_of_week: [0],
    intents: ['body', 'space'],
    time_of_day: 'weekend',
    effort: 'medium',
  },
];

export const DEFAULT_TEMPLATE_IDS = ['drink-water', 'walk-10', 'plan-tomorrow'] as const;

// ─── Onboarding quiz ───

export type QuizPace = 'packed' | 'mixed' | 'spacious';
export type QuizEnergy = 'low' | 'steady' | 'building';
export type QuizBlocker = 'forgetting' | 'energy' | 'time' | 'all-or-nothing';

export interface QuizAnswers {
  intents: HabitIntent[];
  pace: QuizPace;
  times: HabitTimeOfDay[];
  energy: QuizEnergy;
  blocker: QuizBlocker;
}

const PACE_ORDER: Record<QuizPace, number> = { packed: 0, mixed: 1, spacious: 2 };
const EFFORT_ORDER: Record<HabitEffort, number> = { tiny: 0, medium: 1, larger: 2 };

export function pickStarterTemplates(answers: QuizAnswers): string[] {
  const intentSet = new Set(answers.intents);
  const timeSet = new Set(answers.times);
  const paceCap = PACE_ORDER[answers.pace];

  const scored = HABIT_TEMPLATES.map((habit) => {
    const intents = habit.intents ?? [];
    const intentMatches = intents.filter((intent) => intentSet.has(intent)).length;

    // Templates that don't touch any chosen intent are out.
    if (intentMatches === 0 && intents.length > 0) {
      return { habit, score: -100 };
    }

    let score = intentMatches * 4;

    const time = habit.time_of_day ?? 'flexible';
    if (time === 'flexible' || timeSet.has(time)) {
      score += 2;
    } else if (time === 'weekend' && timeSet.has('weekend')) {
      score += 2;
    } else {
      score -= 1;
    }

    const effort = habit.effort ?? 'medium';
    if (EFFORT_ORDER[effort] > paceCap) score -= 5;
    if (effort === 'tiny') score += 1;
    if (answers.pace === 'packed' && effort === 'tiny') score += 2;
    if (answers.pace === 'spacious' && effort === 'medium') score += 1;

    if (answers.energy === 'low' && effort === 'tiny') score += 2;
    if (answers.energy === 'building' && effort !== 'tiny') score += 1;

    if (
      (answers.blocker === 'energy' || answers.blocker === 'time') &&
      effort === 'tiny'
    ) {
      score += 2;
    }
    if (answers.blocker === 'forgetting' && time !== 'flexible') {
      score += 1; // anchored to a time → easier to remember
    }
    if (answers.blocker === 'all-or-nothing' && (habit.target_count ?? 1) > 1) {
      score += 1; // partial counts as progress
    }

    if (habit.recommended) score += 1;
    if (habit.frequency === 'weekly' && !timeSet.has('weekend')) score -= 2;

    return { habit, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  const intentsCovered = new Set<HabitIntent>();
  const MAX_PICKS = 4;

  // First pass: prefer habits that bring a new chosen intent into the mix.
  for (const { habit, score } of scored) {
    if (picked.length >= MAX_PICKS) break;
    if (score < 0) continue;
    const habitIntents = habit.intents ?? [];
    const bringsNewIntent = habitIntents.some(
      (intent) => intentSet.has(intent) && !intentsCovered.has(intent),
    );
    if (bringsNewIntent || picked.length < 2) {
      picked.push(habit.id);
      habitIntents.forEach((intent) => {
        if (intentSet.has(intent)) intentsCovered.add(intent);
      });
    }
  }

  // Second pass: top up to at least 3.
  if (picked.length < 3) {
    for (const { habit, score } of scored) {
      if (picked.length >= 3) break;
      if (score < 0) continue;
      if (!picked.includes(habit.id)) picked.push(habit.id);
    }
  }

  // Last-ditch fallback: hardcoded defaults so we never return empty.
  if (picked.length === 0) {
    return [...DEFAULT_TEMPLATE_IDS];
  }
  return picked;
}

export function templateToHabitInput(template: HabitTemplate): HabitFormInput {
  return {
    name: template.name,
    description: template.description,
    category: template.category,
    frequency: template.frequency,
    target_count: template.target_count ?? 1,
    days_of_week: template.frequency === 'weekly' ? template.days_of_week : undefined,
    completion_start_time: template.completion_start_time ?? null,
    completion_end_time: template.completion_end_time ?? null,
  };
}

export function formatTemplateMeta(template: HabitTemplate): string {
  const target = (template.target_count ?? 1) > 1 ? `${template.target_count}x/day` : 'once/day';
  if (template.frequency === 'daily') return `Daily - ${target}`;
  const days = template.days_of_week?.map((day) => DAY_LABELS[day] ?? '').filter(Boolean);
  return `Weekly${days && days.length > 0 ? `: ${days.join(', ')}` : ''} - ${target}`;
}
