import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATE_IDS, HABIT_TEMPLATES, formatTemplateMeta, templateToHabitInput } from './habitTemplates';

describe('habit templates', () => {
  it('keeps onboarding defaults available in the full template library', () => {
    const ids = new Set(HABIT_TEMPLATES.map((template) => template.id));

    for (const id of DEFAULT_TEMPLATE_IDS) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('converts repeatable templates into habit input with target count', () => {
    const water = HABIT_TEMPLATES.find((template) => template.id === 'drink-water');

    expect(water).toBeDefined();
    expect(templateToHabitInput(water!)).toMatchObject({
      name: 'Drink water',
      category: 'Health',
      frequency: 'daily',
      target_count: 4,
      days_of_week: undefined,
    });
    expect(formatTemplateMeta(water!)).toBe('Daily - 4x/day');
  });

  it('formats weekly templates with selected weekdays', () => {
    const weekly = HABIT_TEMPLATES.find((template) => template.id === 'weekly-review');

    expect(weekly).toBeDefined();
    expect(templateToHabitInput(weekly!)).toMatchObject({
      frequency: 'weekly',
      days_of_week: [0],
    });
    expect(formatTemplateMeta(weekly!)).toBe('Weekly: Sun - once/day');
  });
});
