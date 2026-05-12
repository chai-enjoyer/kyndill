import { useEffect, useState } from 'react';
import type { HabitWithStatus, CompleteResult } from '../../hooks/useHabits';
import { HabitCheckbox } from './HabitCheckbox';
import { CategoryPill } from './CategoryPill';
import { Confetti } from './Confetti';

interface HabitListItemProps {
  habit: HabitWithStatus;
  onComplete: (habitId: string) => Promise<CompleteResult | null>;
}

export function HabitListItem({ habit, onComplete }: HabitListItemProps) {
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(false), 900);
    return () => window.clearTimeout(t);
  }, [burst]);

  async function handleComplete() {
    if (habit.completed_today || submitting) return;
    setSubmitting(true);
    setBurst(true);
    const result = await onComplete(habit.id);
    setSubmitting(false);
    if (!result) {
      // Failure: hide the burst early.
      setBurst(false);
    }
  }

  return (
    <li className={`habit-item ${habit.completed_today ? 'habit-item--done' : ''}`}>
      <span className="habit-item__checkbox">
        <HabitCheckbox
          checked={habit.completed_today}
          disabled={habit.completed_today || submitting}
          onClick={handleComplete}
          ariaLabel={`Mark ${habit.name} complete`}
        />
        {burst && <Confetti />}
      </span>

      <div className="habit-item__body">
        <span className="habit-item__name">{habit.name}</span>
        <CategoryPill category={habit.category} />
      </div>

      <span className="habit-item__streak" title={`${habit.current_streak} day streak`}>
        <span className="habit-item__streak-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 3c-2 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-2-4 0-2 0-3-2-5z" />
          </svg>
        </span>
        <span className="habit-item__streak-value">{habit.current_streak}</span>
        <span className="habit-item__streak-label text-muted">
          {habit.current_streak === 1 ? 'day' : 'days'}
        </span>
      </span>
    </li>
  );
}
