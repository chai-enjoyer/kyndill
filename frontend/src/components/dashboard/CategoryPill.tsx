import type { HabitCategory } from '../../hooks/useHabits';

interface CategoryPillProps {
  category: HabitCategory;
}

const SLUGS: Record<HabitCategory, string> = {
  Health: 'health',
  Productivity: 'productivity',
  Social: 'social',
  Learning: 'learning',
  Wellness: 'wellness',
};

export function CategoryPill({ category }: CategoryPillProps) {
  return (
    <span className={`category-pill category-pill--${SLUGS[category]}`}>
      {category}
    </span>
  );
}
