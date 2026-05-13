import type { HabitCategory, HabitFormInput, HabitFrequency } from '../hooks/useHabits';

export interface HabitTemplate extends HabitFormInput {
  id: string;
  summary: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  recommended?: boolean;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'drink-water',
    name: 'Drink water',
    description: 'Log a glass of water throughout the day.',
    summary: 'A repeatable health habit for daily care.',
    category: 'Health',
    frequency: 'daily',
    target_count: 4,
    recommended: true,
  },
  {
    id: 'morning-meal',
    name: 'Eat a real meal',
    description: 'Make space for one nourishing meal.',
    summary: 'A simple anchor for hunger and energy.',
    category: 'Health',
    frequency: 'daily',
  },
  {
    id: 'sleep-wind-down',
    name: 'Start wind-down',
    description: 'Begin a calmer evening routine before bed.',
    summary: 'A gentle habit for better rest.',
    category: 'Wellness',
    frequency: 'daily',
  },
  {
    id: 'walk-10',
    name: 'Take a 10 minute walk',
    description: 'Step outside or move around for ten minutes.',
    summary: 'Low-friction movement that stacks well.',
    category: 'Wellness',
    frequency: 'daily',
    recommended: true,
  },
  {
    id: 'movement-breaks',
    name: 'Take a movement break',
    description: 'Stand up, stretch, or walk briefly during the day.',
    summary: 'Repeatable energy reset for desk days.',
    category: 'Wellness',
    frequency: 'daily',
    target_count: 3,
  },
  {
    id: 'plan-tomorrow',
    name: 'Plan tomorrow',
    description: 'Write the next day\'s top priorities.',
    summary: 'A small evening productivity reset.',
    category: 'Productivity',
    frequency: 'daily',
    recommended: true,
  },
  {
    id: 'focus-block',
    name: 'Finish a focus block',
    description: 'Complete one focused work block without multitasking.',
    summary: 'Pairs naturally with the Focus page.',
    category: 'Productivity',
    frequency: 'daily',
  },
  {
    id: 'ten-minute-tidy',
    name: '10 minute tidy',
    description: 'Reset one small physical or digital space.',
    summary: 'A quick cleanup with visible payoff.',
    category: 'Productivity',
    frequency: 'daily',
  },
  {
    id: 'read-10',
    name: 'Read 10 pages',
    description: 'Read a book, article, or study material.',
    summary: 'A learning habit that compounds over time.',
    category: 'Learning',
    frequency: 'daily',
    recommended: true,
  },
  {
    id: 'practice-skill',
    name: 'Practice a skill',
    description: 'Spend 15 minutes on a skill you want to improve.',
    summary: 'Good for language, music, coding, or art.',
    category: 'Learning',
    frequency: 'daily',
  },
  {
    id: 'review-notes',
    name: 'Review notes',
    description: 'Revisit notes, flashcards, or yesterday\'s learning.',
    summary: 'Keeps learning fresh without a big session.',
    category: 'Learning',
    frequency: 'daily',
  },
  {
    id: 'message-friend',
    name: 'Message one friend',
    description: 'Send a short check-in to someone you care about.',
    summary: 'A gentle social accountability habit.',
    category: 'Social',
    frequency: 'daily',
  },
  {
    id: 'gratitude-note',
    name: 'Write a gratitude note',
    description: 'Write down one thing you appreciated today.',
    summary: 'Tiny reflection with a warmer mood loop.',
    category: 'Social',
    frequency: 'daily',
  },
  {
    id: 'weekly-review',
    name: 'Weekly review',
    description: 'Review the week and choose next week\'s priorities.',
    summary: 'A Sunday reset for long-term consistency.',
    category: 'Productivity',
    frequency: 'weekly',
    days_of_week: [0],
  },
  {
    id: 'meal-prep',
    name: 'Plan meals',
    description: 'Choose a few meals or snacks for the week.',
    summary: 'A weekly support habit for easier healthy days.',
    category: 'Health',
    frequency: 'weekly',
    days_of_week: [0],
  },
];

export const DEFAULT_TEMPLATE_IDS = ['drink-water', 'walk-10', 'plan-tomorrow'] as const;

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
