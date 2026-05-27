import { useEffect, useState } from 'react';
import type { HabitWithStatus, CompleteResult } from '../../hooks/useHabits';
import { AnimatedValue } from '../common/AnimatedValue';
import { HabitCheckbox } from './HabitCheckbox';
import { CategoryPill } from './CategoryPill';
import { Confetti } from './Confetti';

interface HabitListItemProps {
  habit: HabitWithStatus;
  onComplete: (habitId: string) => Promise<CompleteResult | null>;
  onOpenDetails?: (habit: HabitWithStatus) => void;
}

export function HabitListItem({ habit, onComplete, onOpenDetails }: HabitListItemProps) {
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState(false);
  const targetCount = Math.max(1, habit.today_target_count || habit.target_count || 1);
  const completedCount = Math.min(targetCount, habit.completed_count);
  const isRepeating = targetCount > 1;
  const progress = Math.round((completedCount / targetCount) * 100);

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(false), 900);
    return () => window.clearTimeout(t);
  }, [burst]);

  async function handleComplete() {
    if (habit.completed_today || submitting) return;
    setSubmitting(true);
    const willFinish = completedCount + 1 >= targetCount;
    setBurst(willFinish);
    const result = await onComplete(habit.id);
    setSubmitting(false);
    if (!result) {
      // Failure: hide the burst early.
      setBurst(false);
    }
  }

  const detailsClickable = Boolean(onOpenDetails);

  function handleRowKey(event: React.KeyboardEvent<HTMLLIElement>) {
    if (!detailsClickable) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDetails?.(habit);
    }
  }

  return (
    <li
      className={`habit-item ${habit.completed_today ? 'habit-item--done' : ''} ${burst ? 'habit-item--burst' : ''}${detailsClickable ? ' habit-item--clickable' : ''}`}
      onClick={detailsClickable ? () => onOpenDetails?.(habit) : undefined}
      onKeyDown={handleRowKey}
      tabIndex={detailsClickable ? 0 : undefined}
      role={detailsClickable ? 'button' : undefined}
      aria-label={detailsClickable ? `View details for ${habit.name}` : undefined}
    >
      <span
        className="habit-item__checkbox"
        onClick={(e) => e.stopPropagation()}
      >
        <HabitCheckbox
          checked={habit.completed_today}
          disabled={habit.completed_today || submitting}
          onClick={handleComplete}
          ariaLabel={
            isRepeating
              ? `Log ${habit.name}, ${completedCount} of ${targetCount} done today`
              : `Mark ${habit.name} complete`
          }
        />
        {burst && <Confetti />}
      </span>

      <div className="habit-item__body">
        <span className="habit-item__title-row">
          <span className="habit-item__name">{habit.name}</span>
          <CategoryPill category={habit.category} />
        </span>
        {isRepeating && (
          <span className="habit-item__repeat" aria-label={`${completedCount} of ${targetCount} done today`}>
            <span className="habit-item__repeat-track">
              <span style={{ width: `${progress}%` }} />
            </span>
            <span className="habit-item__repeat-count">
              <AnimatedValue value={`${completedCount}/${targetCount}`} />
            </span>
          </span>
        )}
      </div>

      <span className="habit-item__streak" title={`${habit.current_streak} day streak`}>
        <AnimatedValue value={habit.current_streak} className="habit-item__streak-value" />
        <span className="habit-item__streak-unit" aria-hidden="true">d</span>
        <span className="visually-hidden">{habit.current_streak === 1 ? 'day' : 'days'} streak</span>
      </span>
    </li>
  );
}
